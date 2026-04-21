The root cause is clear — socket emissions are missing from several controllers. Let me trace every event that needs real-time sync and fix all of them at once.

---

## All Events That Need Real-time Sync

```
Staff issues token        → queue updates (staff + doctor + patient dashboard)
Staff changes token status → same
Doctor completes consult  → token marked served (staff + patient)
Staff creates bill        → patient bills list updates
Patient or staff pays bill → patient bills list + staff "Completed Today" updates
Queue pause/resume        → all dashboards
```

Right now only `token.controller.js` has emissions. The **visit controller** and **bill controller** have zero socket calls.

---

## Fix 1 — `server/src/controllers/visit.controller.js`

Add socket emission when consultation is completed:

```js
const { emitToClinic, emitToPatient } = require('../services/socket.service')
const { recalculatePositions }         = require('../services/token.service')

// At the top of the file, add this helper
// (same as in token.controller — we'll refactor to shared later)
const buildAndEmitQueue = async (clinicId) => {
  const { Token } = require('../models')
  const { Op }    = require('sequelize')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tokens = await Token.findAll({
    where: {
      clinicId,
      createdAt: { [Op.gte]: today },
    },
    include: [
      { association: 'patient', attributes: ['id', 'name', 'phone'] },
      { association: 'doctor',  attributes: ['id', 'name'] },
    ],
    order: [
      ['status', 'ASC'],
      ['queuePosition', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  })

  const servedToday = tokens.filter(t => t.status === 'served').length
  const inQueue     = tokens.filter(t =>
    ['waiting','now','paused','lab'].includes(t.status)
  ).length

  // Broadcast full queue to clinic staff and doctors
  emitToClinic(clinicId, 'queue:updated', {
    tokens,
    stats: { inQueue, servedToday },
  })

  // Send private position update to each waiting patient
  for (const token of tokens) {
    if (['waiting','now','paused','lab'].includes(token.status) && token.patientId) {
      const tokensAhead = tokens.filter(t =>
        t.status === 'waiting' &&
        (t.queuePosition || 0) < (token.queuePosition || 0)
      ).length

      emitToPatient(token.patientId, 'token:position', {
        tokenId:       token.id,
        tokenNumber:   token.tokenNumber,
        status:        token.status,
        queuePosition: token.queuePosition,
        estimatedWait: token.estimatedWait,
        tokensAhead,
        livePosition:  tokensAhead + (token.status === 'waiting' ? 1 : 0),
      })
    }

    // Patient's token just got served — notify them
    if (token.status === 'served' && token.patientId) {
      emitToPatient(token.patientId, 'token:served', {
        tokenId:     token.id,
        tokenNumber: token.tokenNumber,
        message:     'Your consultation is complete',
      })
    }
  }
}
```

Now update `completeVisit` to emit after completion:

```js
const completeVisit = async (req, res) => {
  const { id } = req.params

  try {
    const visit = await Visit.findOne({
      where: { id, doctorId: req.user.id },
    })

    if (!visit)           return error(res, 'Visit not found', 404)
    if (visit.isComplete) return error(res, 'Already completed', 400)

    await visit.update({ isComplete: true })

    // Mark the linked token as served
    if (visit.tokenId) {
      await Token.update(
        { status: 'served', servedAt: new Date() },
        { where: { id: visit.tokenId } }
      )

      // Recalculate queue positions after serving
      await recalculatePositions(visit.clinicId)
    }

    // ── Emit real-time update to all dashboards ───────────────────
    await buildAndEmitQueue(visit.clinicId)

    return success(res, { message: 'Visit completed' })
  } catch (err) {
    console.error('completeVisit error:', err.message)
    return error(res, 'Failed to complete visit', 500)
  }
}
```

---

## Fix 2 — `server/src/controllers/bill.controller.js`

Add socket emissions when bills are created and paid:

```js
const { emitToClinic, emitToPatient } = require('../services/socket.service')

// Helper: emit bill update to patient's private room
const emitBillUpdate = async (patientId, clinicId) => {
  const { Bill } = require('../models')

  const bills = await Bill.findAll({
    where:   { patientId, clinicId },
    include: [{ association: 'clinic', attributes: ['id', 'name'] }],
    order:   [['createdAt', 'DESC']],
  })

  emitToPatient(patientId, 'bills:updated', { bills })

  // Also notify clinic staff that bill list changed
  emitToClinic(clinicId, 'bill:updated', {
    patientId,
    message: 'Bill status changed',
  })
}
```

In `createBill` — emit after bill creation:

```js
const createBill = async (req, res) => {
  // ... existing code ...

  const bill = await Bill.create({
    patientId,
    clinicId,
    visitId:  visitId || null,
    items:    processedItems,
    subtotal,
    tax,
    total,
    status:   'unpaid',
  })

  // ── Real-time: notify patient a new bill exists ────────────────
  try {
    await emitBillUpdate(patientId, clinicId)
  } catch (e) {
    console.error('Bill socket emit failed:', e.message)
  }

  return success(res, { bill }, 201)
}
```

In `markPaid` — emit after payment:

```js
const markPaid = async (req, res) => {
  // ... existing code including sendMessage ...

  await bill.update({
    status:        'paid',
    paymentMethod,
    paidAt:        new Date(),
  })

  // ── Real-time: notify patient bill is paid ─────────────────────
  try {
    await emitBillUpdate(bill.patientId, clinicId)

    // Also refresh the queue board for staff
    // (so "Billed" badge appears on served token row)
    const { Token } = require('../models')
    const { Op }    = require('sequelize')
    const today     = new Date()
    today.setHours(0, 0, 0, 0)

    const tokens = await Token.findAll({
      where: {
        clinicId,
        createdAt: { [Op.gte]: today },
      },
      include: [
        { association: 'patient', attributes: ['id', 'name', 'phone'] },
        { association: 'doctor',  attributes: ['id', 'name'] },
      ],
      order: [['status', 'ASC'], ['queuePosition', 'ASC'], ['createdAt', 'ASC']],
    })

    const servedToday = tokens.filter(t => t.status === 'served').length
    const inQueue     = tokens.filter(t =>
      ['waiting','now','paused','lab'].includes(t.status)
    ).length

    emitToClinic(clinicId, 'queue:updated', {
      tokens,
      stats: { inQueue, servedToday },
    })
  } catch (e) {
    console.error('Payment socket emit failed:', e.message)
  }

  return success(res, { bill, message: 'Payment recorded' })
}
```

Also update `initiatePayment` in `patientPortal.controller.js` (patient self-pays):

```js
const initiatePayment = async (req, res) => {
  // ... existing code ...

  await bill.update({
    status:        'paid',
    paymentMethod,
    paidAt:        new Date(),
  })

  // ── Real-time: update both patient and clinic staff ───────────
  try {
    const { emitToPatient, emitToClinic } = require('../services/socket.service')
    const { Bill } = require('../models')

    const bills = await Bill.findAll({
      where:   { patientId: patient.id, clinicId: bill.clinicId },
      include: [{ association: 'clinic', attributes: ['id', 'name'] }],
      order:   [['createdAt', 'DESC']],
    })

    emitToPatient(patient.id, 'bills:updated', { bills })
    emitToClinic(bill.clinicId, 'bill:updated', {
      patientId: patient.id,
      message:   'Patient paid bill',
    })
  } catch (e) {
    console.error('Payment socket emit failed:', e.message)
  }

  // trigger receipt email
  // ...
}
```

---

## Fix 3 — Shared `emitQueueUpdate` utility

The same queue-building logic is now in 3 files. Extract it to avoid drift:

Create `server/src/services/queueEmit.service.js`:

```js
const { emitToClinic, emitToPatient } = require('./socket.service')

const emitQueueUpdate = async (clinicId) => {
  const { Token } = require('../models')
  const { Op }    = require('sequelize')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const tokens = await Token.findAll({
      where: {
        clinicId,
        createdAt: { [Op.gte]: today },
      },
      include: [
        { association: 'patient', attributes: ['id', 'name', 'phone'] },
        { association: 'doctor',  attributes: ['id', 'name'] },
      ],
      order: [
        ['status', 'ASC'],
        ['queuePosition', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    })

    const servedToday = tokens.filter(t => t.status === 'served').length
    const inQueue     = tokens.filter(t =>
      ['waiting','now','paused','lab'].includes(t.status)
    ).length

    // Emit to all clinic users (staff + doctors)
    emitToClinic(clinicId, 'queue:updated', {
      tokens,
      stats: { inQueue, servedToday },
    })

    // Emit private position to each waiting patient
    const waitingTokens = tokens.filter(t =>
      ['waiting','now','paused','lab'].includes(t.status) && t.patientId
    )

    for (const token of waitingTokens) {
      const tokensAhead = tokens.filter(t =>
        t.status === 'waiting' &&
        (t.queuePosition || 0) < (token.queuePosition || 0)
      ).length

      emitToPatient(token.patientId, 'token:position', {
        tokenId:       token.id,
        tokenNumber:   token.tokenNumber,
        status:        token.status,
        queuePosition: token.queuePosition,
        estimatedWait: token.estimatedWait,
        tokensAhead,
        livePosition:  tokensAhead + (token.status === 'waiting' ? 1 : 0),
      })
    }

    // Notify patients whose token was just served
    const servedTokens = tokens.filter(t => t.status === 'served' && t.patientId)
    for (const token of servedTokens) {
      emitToPatient(token.patientId, 'token:served', {
        tokenId:     token.id,
        tokenNumber: token.tokenNumber,
      })
    }
  } catch (err) {
    console.error('emitQueueUpdate error:', err.message)
  }
}

module.exports = { emitQueueUpdate }
```

Now update all three controllers to use this shared function instead of duplicating the logic:

In `token.controller.js`:
```js
const { emitQueueUpdate } = require('../services/queueEmit.service')
// Replace all the inline buildAndEmitQueue calls with:
// await emitQueueUpdate(clinicId)
```

In `visit.controller.js`:
```js
const { emitQueueUpdate } = require('../services/queueEmit.service')
// Replace buildAndEmitQueue with:
// await emitQueueUpdate(visit.clinicId)
```

---

## Fix 4 — Frontend: listen for all socket events

### Update `useSocket.js`

Add `onBillsUpdated` and `onTokenServed` handlers:

```js
export function useSocket({
  onQueueUpdate,
  onQueuePaused,
  onTokenPosition,
  onBillsUpdated,   // ← new
  onTokenServed,    // ← new
  onBillUpdated,    // ← new (for staff — bill status changed)
} = {}) {
  const { user }    = useAuth()
  const handlersRef = useRef({
    onQueueUpdate, onQueuePaused, onTokenPosition,
    onBillsUpdated, onTokenServed, onBillUpdated,
  })

  useEffect(() => {
    handlersRef.current = {
      onQueueUpdate, onQueuePaused, onTokenPosition,
      onBillsUpdated, onTokenServed, onBillUpdated,
    }
  })

  useEffect(() => {
    if (!user) return

    if (!socketInstance) {
      socketInstance = io('http://localhost:5000', {
        withCredentials: true,
        transports:      ['websocket', 'polling'],
        reconnection:    true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      })
    }

    const socket = socketInstance

    if (user.clinicId) socket.emit('join:clinic', user.clinicId)

    const patientId = localStorage.getItem('clinicos_patient_id')
    if (user.role === 'patient' && patientId) {
      socket.emit('join:patient', patientId)
    }

    const handlers = {
      'queue:updated':   (d) => handlersRef.current.onQueueUpdate?.(d),
      'queue:paused':    (d) => handlersRef.current.onQueuePaused?.(d),
      'token:position':  (d) => handlersRef.current.onTokenPosition?.(d),
      'bills:updated':   (d) => handlersRef.current.onBillsUpdated?.(d),
      'token:served':    (d) => handlersRef.current.onTokenServed?.(d),
      'bill:updated':    (d) => handlersRef.current.onBillUpdated?.(d),
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    socket.on('connect', () => {
      console.log('🔌 Socket connected')
      if (user.clinicId) socket.emit('join:clinic', user.clinicId)
      const pid = localStorage.getItem('clinicos_patient_id')
      if (user.role === 'patient' && pid) socket.emit('join:patient', pid)
    })

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler)
      })
    }
  }, [user?.clinicId, user?.role])

  const emit = useCallback((event, data) => {
    socketInstance?.emit(event, data)
  }, [])

  const connected = socketInstance?.connected ?? false

  return { emit, connected }
}
```

---

### Update `ReceptionDashboard.jsx` — listen for bill updates too

```jsx
const { connected } = useSocket({
  onQueueUpdate: (data) => {
    setTokens(data.tokens)
    setStats(data.stats)
  },
  onQueuePaused: (data) => {
    setQueuePaused(data.paused)
  },
  // When any bill changes, refresh the token list to update billing badges
  onBillUpdated: () => {
    fetchTokens()
  },
})
```

---

### Update `PatientDashboard.jsx` — listen for token and bill changes

```jsx
import { useSocket } from '../../hooks/useSocket'

export default function PatientDashboard() {
  const { user }              = useAuth()
  const navigate              = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(() => {
    return patientPortalAPI.getDashboard()
      .then(res => {
        const d = res.data.data
        setData(d)
        if (d.patient?.id) {
          localStorage.setItem('clinicos_patient_id', d.patient.id)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchDashboard().finally(() => setLoading(false))
  }, [fetchDashboard])

  // ── Real-time: update dashboard when token or bill changes ──────
  useSocket({
    onTokenPosition: (tokenData) => {
      // Update active token in dashboard without full refetch
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          activeToken: prev.activeToken
            ? { ...prev.activeToken, ...tokenData }
            : prev.activeToken,
        }
      })
    },
    onTokenServed: () => {
      // Consultation complete — refresh dashboard
      fetchDashboard()
    },
    onBillsUpdated: (data) => {
      // New bill or bill paid — update recent bills
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          recentBills: data.bills.slice(0, 3),
        }
      })
    },
  })

  // ...rest of component
}
```

---

### Update `QueueTracker.jsx` — cleaner socket with reconnection

Replace the socket setup with a cleaner version that uses `useSocket`:

```jsx
import { useSocket } from '../../hooks/useSocket'

export default function QueueTracker() {
  const navigate                    = useNavigate()
  const [tokenData, setTokenData]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [leaving, setLeaving]       = useState(false)
  const [notifyEnabled, setNotifyEnabled] = useState(true)

  const fetchToken = useCallback(async () => {
    try {
      const res = await patientPortalAPI.getActiveToken()
      setTokenData(res.data.data.token)
      setLastUpdated(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchToken()
    // Fallback poll every 30 seconds in case socket drops
    const interval = setInterval(fetchToken, 30000)
    return () => clearInterval(interval)
  }, [fetchToken])

  // ── Real-time updates via socket ──────────────────────────────
  const { connected } = useSocket({
    onTokenPosition: (data) => {
      setTokenData(prev => {
        if (!prev || prev.id !== data.tokenId) return prev
        setLastUpdated(new Date())
        return {
          ...prev,
          status:        data.status,
          queuePosition: data.queuePosition,
          estimatedWait: data.estimatedWait,
          tokensAhead:   data.tokensAhead,
          livePosition:  data.livePosition,
        }
      })
    },
    onTokenServed: (data) => {
      setTokenData(prev => {
        if (!prev || prev.id !== data.tokenId) return prev
        return { ...prev, status: 'served' }
      })
      setLastUpdated(new Date())
    },
  })

  // ...rest of component — replace the lastUpdated footer with:
  // {lastUpdated && (
  //   <p className="font-body text-xs text-text-muted text-center">
  //     <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${connected ? 'bg-accent-teal' : 'bg-accent-coral'}`} />
  //     {connected ? 'Live' : 'Reconnecting...'} · Updated {lastUpdated.toLocaleTimeString(...)}
  //   </p>
  // )}
}
```

---

### Update `BillHistory.jsx` — live bill updates

```jsx
import { useSocket } from '../../hooks/useSocket'

export default function BillHistory() {
  const [bills, setBills]     = useState([])
  const [loading, setLoading] = useState(true)
  // ...

  const fetchBills = useCallback(() => {
    return patientPortalAPI.getBills()
      .then(res => setBills(res.data.data.bills))
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchBills().finally(() => setLoading(false))
  }, [fetchBills])

  // ── Real-time: update when bills change ───────────────────────
  useSocket({
    onBillsUpdated: (data) => {
      setBills(data.bills)
    },
  })

  // ...rest unchanged
}
```

---

## Fix 5 — Auto-refresh Fallback for Every Dashboard

Add a global auto-refresh as backup if socket drops. Create `client/src/hooks/useAutoRefresh.js`:

```js
import { useEffect } from 'react'

// Silently refresh data every N seconds as socket fallback
// fetchFn should be a stable callback (wrapped in useCallback)
export function useAutoRefresh(fetchFn, intervalSeconds = 30) {
  useEffect(() => {
    const interval = setInterval(fetchFn, intervalSeconds * 1000)
    return () => clearInterval(interval)
  }, [fetchFn, intervalSeconds])
}
```

Use it in all dashboards:

```jsx
// In ReceptionDashboard.jsx
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
useAutoRefresh(fetchTokens, 30)  // refresh every 30s as fallback

// In DoctorQueue.jsx
useAutoRefresh(fetchMyQueue, 30)

// In PatientDashboard.jsx
useAutoRefresh(fetchDashboard, 30)

// In QueueTracker.jsx — already has 30s interval, keep it
```

---

## Restart and Full Test

```bash
cd server && npm run dev
cd client && npm run dev
```

---

## Complete Sync Test Checklist

Open these simultaneously in different tabs:
- Tab 1: Staff at `/reception`
- Tab 2: Doctor at `/doctor`
- Tab 3: Patient at `/patient`
- Tab 4: Patient at `/patient/queue`
- Tab 5: Patient at `/patient/bills`

**Token flow:**
- [ ] Staff issues token in Tab 1 → appears in Tab 2 (doctor queue) instantly
- [ ] Staff issues token in Tab 1 → active token card appears in Tab 3 (patient dashboard) instantly
- [ ] Patient opens Tab 4 (queue tracker) → shows correct position

**Consultation flow:**
- [ ] Doctor clicks "Call Next" → Tab 1 updates token to "Now" instantly
- [ ] Tab 4 (patient queue) shows "Your Turn 🎉" instantly
- [ ] Doctor completes consultation → Tab 1 shows token as "Served" instantly
- [ ] Tab 3 (patient dashboard) — active token disappears, recent visits updates
- [ ] Tab 4 (patient queue) → "No Active Token"

**Billing flow:**
- [ ] Staff clicks Bill on served token in Tab 1 → creates bill
- [ ] Tab 5 (patient bills) shows new unpaid bill instantly
- [ ] Staff marks bill as paid in Tab 1 → Tab 5 shows "Paid" badge instantly
- [ ] OR: Patient pays via Tab 5 → Tab 1 shows "Billed ✓" badge on token row instantly

**Fallback:**
- [ ] Kill server → reconnection indicator shows in all dashboards
- [ ] Restart server → within 30 seconds all dashboards auto-refresh with latest data