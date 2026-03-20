That's fine — WhatsApp works exactly the same as email once you add the API key. The code is already there. Let's move to Phase 8 — Patient Portal.

---

## What We're Building

```
/patient
  ├── Dashboard    → active token + ETA + recent visits + recent bills
  ├── Queue        → live position tracker with countdown
  ├── History      → full visit timeline with prescriptions
  └── Bills        → all bills with receipt download
```

---

## Backend First

### 1. `server/src/controllers/patientPortal.controller.js`

```js
const { success, error } = require('../utils/apiResponse')
const { Patient, Token, Visit, Bill, User, Clinic } = require('../models')
const { Op } = require('sequelize')

// ── GET /api/patient/dashboard ────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    // Find the patient record linked to this logged-in user
    const patient = await Patient.findOne({
      where: { userId: req.userId },
    })

    if (!patient) {
      return success(res, {
        patient:     null,
        activeToken: null,
        recentVisits:[],
        recentBills: [],
        message: 'No patient profile found. Visit a clinic to register.',
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Run all queries in parallel for speed
    const [activeToken, recentVisits, recentBills] = await Promise.all([
      // Active token today
      Token.findOne({
        where: {
          patientId: patient.id,
          status:    { [Op.in]: ['waiting', 'now', 'paused', 'lab'] },
          createdAt: { [Op.gte]: today },
        },
        include: [
          { association: 'doctor',  attributes: ['id', 'name'] },
          { association: 'clinic',  attributes: ['id', 'name'] },
        ],
      }),

      // Last 3 visits
      Visit.findAll({
        where:   { patientId: patient.id, isComplete: true },
        include: [{ association: 'doctor', attributes: ['id', 'name'] }],
        order:   [['createdAt', 'DESC']],
        limit:   3,
      }),

      // Last 3 bills
      Bill.findAll({
        where:   { patientId: patient.id },
        include: [{ association: 'clinic', attributes: ['id', 'name'] }],
        order:   [['createdAt', 'DESC']],
        limit:   3,
      }),
    ])

    return success(res, {
      patient,
      activeToken,
      recentVisits,
      recentBills,
    })
  } catch (err) {
    console.error('getDashboard error:', err.message)
    return error(res, 'Failed to fetch dashboard', 500)
  }
}

// ── GET /api/patient/token ────────────────────────────────────────
const getActiveToken = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { userId: req.userId } })
    if (!patient) return success(res, { token: null })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Count tokens ahead to get live position
    const token = await Token.findOne({
      where: {
        patientId: patient.id,
        status:    { [Op.in]: ['waiting', 'now', 'paused', 'lab'] },
        createdAt: { [Op.gte]: today },
      },
      include: [
        { association: 'doctor', attributes: ['id', 'name'] },
        { association: 'clinic', attributes: ['id', 'name'] },
      ],
    })

    if (!token) return success(res, { token: null })

    // Count how many are ahead in the queue
    const tokensAhead = await Token.count({
      where: {
        clinicId:      token.clinicId,
        status:        'waiting',
        queuePosition: { [Op.lt]: token.queuePosition || 999 },
        createdAt:     { [Op.gte]: today },
      },
    })

    return success(res, {
      token: {
        ...token.toJSON(),
        tokensAhead,
        livePosition: tokensAhead + (token.status === 'waiting' ? 1 : 0),
      }
    })
  } catch (err) {
    console.error('getActiveToken error:', err.message)
    return error(res, 'Failed to fetch token', 500)
  }
}

// ── GET /api/patient/visits ───────────────────────────────────────
const getVisitHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { userId: req.userId } })
    if (!patient) return success(res, { visits: [] })

    const visits = await Visit.findAll({
      where:   { patientId: patient.id, isComplete: true },
      include: [
        { association: 'doctor', attributes: ['id', 'name'] },
        { association: 'clinic', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    })

    return success(res, { patient, visits })
  } catch (err) {
    console.error('getVisitHistory error:', err.message)
    return error(res, 'Failed to fetch visits', 500)
  }
}

// ── GET /api/patient/bills ────────────────────────────────────────
const getBillHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { userId: req.userId } })
    if (!patient) return success(res, { bills: [] })

    const bills = await Bill.findAll({
      where:   { patientId: patient.id },
      include: [{ association: 'clinic', attributes: ['id', 'name'] }],
      order:   [['createdAt', 'DESC']],
    })

    return success(res, { bills })
  } catch (err) {
    console.error('getBillHistory error:', err.message)
    return error(res, 'Failed to fetch bills', 500)
  }
}

module.exports = { getDashboard, getActiveToken, getVisitHistory, getBillHistory }
```

---

### 2. `server/src/routes/patientPortal.routes.js`

```js
const express = require('express')
const router  = express.Router()
const {
  getDashboard,
  getActiveToken,
  getVisitHistory,
  getBillHistory,
} = require('../controllers/patientPortal.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect, rbac(['patient']))

router.get('/dashboard', getDashboard)
router.get('/token',     getActiveToken)
router.get('/visits',    getVisitHistory)
router.get('/bills',     getBillHistory)

module.exports = router
```

---

### 3. Mount in `server/index.js`

```js
app.use('/api/patient', require('./src/routes/patientPortal.routes'))
```

---

### 4. Update `client/src/services/api.js`

```js
export const patientPortalAPI = {
  getDashboard:   () => api.get('/patient/dashboard'),
  getActiveToken: () => api.get('/patient/token'),
  getVisits:      () => api.get('/patient/visits'),
  getBills:       () => api.get('/patient/bills'),
}
```

---

## Frontend

### 5. `client/src/layouts/PatientLayout.jsx`

```jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Stethoscope, Home, Activity,
  FileText, Receipt, LogOut
} from 'lucide-react'

const NAV = [
  { to: '/patient',         label: 'Home',    icon: Home,     end: true },
  { to: '/patient/queue',   label: 'Queue',   icon: Activity },
  { to: '/patient/history', label: 'History', icon: FileText },
  { to: '/patient/bills',   label: 'Bills',   icon: Receipt },
]

export default function PatientLayout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col max-w-lg mx-auto">

      {/* Topbar */}
      <header className="nav-gradient px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center">
            <Stethoscope size={16} className="text-crimson-800" />
          </div>
          <span className="font-display font-bold text-white text-lg">ClinicOS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-sm text-white/80">{user?.name?.split(' ')[0]}</span>
          <button
            onClick={handleLogout}
            className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <LogOut size={14} className="text-white" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 py-5 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav bar — mobile style */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-cream-200 flex z-30">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center gap-1 py-3 font-body text-xs font-semibold transition-all
              ${isActive ? 'text-crimson-500' : 'text-text-muted hover:text-text-body'}
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-crimson-500' : 'text-text-muted'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
```

---

### 6. `client/src/pages/patient/PatientDashboard.jsx`

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { patientPortalAPI } from '../../services/api'
import {
  Activity, FileText, Receipt,
  Clock, ChevronRight, Stethoscope
} from 'lucide-react'

export default function PatientDashboard() {
  const { user }              = useAuth()
  const navigate              = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientPortalAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-1/2" />
        <div className="card h-40" />
        <div className="card h-32" />
      </div>
    )
  }

  const { activeToken, recentVisits, recentBills } = data || {}

  return (
    <div className="space-y-5">

      {/* Greeting */}
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">
          Hi, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="font-body text-sm text-text-muted">
          Welcome to your health dashboard
        </p>
      </div>

      {/* Active Token Card */}
      {activeToken ? (
        <div
          className="nav-gradient rounded-3xl p-5 cursor-pointer"
          onClick={() => navigate('/patient/queue')}
        >
          <p className="font-body text-xs text-white/60 uppercase tracking-wider mb-1">
            Active Queue Token
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-5xl text-white">
                T-{activeToken.tokenNumber}
              </p>
              <p className="font-body text-sm text-white/80 mt-1">
                {activeToken.clinic?.name}
              </p>
              {activeToken.doctor && (
                <p className="font-body text-xs text-white/60">
                  Dr. {activeToken.doctor.name}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className={`inline-block px-3 py-1.5 rounded-pill font-body text-xs font-bold mb-2
                ${activeToken.status === 'now'
                  ? 'bg-accent-yellow text-crimson-900 animate-pulse'
                  : 'bg-white/20 text-white'
                }`}>
                {activeToken.status === 'now'
                  ? '🎉 Your Turn!'
                  : activeToken.status === 'paused'
                  ? 'On Hold'
                  : activeToken.status === 'lab'
                  ? 'In Lab'
                  : `#${activeToken.queuePosition} in queue`
                }
              </div>
              {activeToken.estimatedWait > 0 && activeToken.status === 'waiting' && (
                <p className="font-body text-xs text-white/70 flex items-center gap-1 justify-end">
                  <Clock size={11} />
                  ~{activeToken.estimatedWait} min wait
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-white/60 font-body text-xs">
            <span>Tap to track live queue</span>
            <ChevronRight size={12} />
          </div>
        </div>
      ) : (
        <div className="card border-2 border-dashed border-cream-300 text-center py-8">
          <Activity size={28} className="text-cream-400 mx-auto mb-2" />
          <p className="font-body font-semibold text-sm text-text-body mb-0.5">
            No active queue token
          </p>
          <p className="font-body text-xs text-text-muted">
            Visit a clinic to get a token
          </p>
        </div>
      )}

      {/* Recent Visits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-sm font-bold text-text-secondary">
            Recent Visits
          </p>
          <button
            onClick={() => navigate('/patient/history')}
            className="font-body text-xs text-crimson-500 font-semibold hover:text-crimson-700"
          >
            View all
          </button>
        </div>

        {recentVisits?.length === 0 ? (
          <div className="card text-center py-6">
            <Stethoscope size={24} className="text-cream-400 mx-auto mb-2" />
            <p className="font-body text-sm text-text-muted">No visits yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentVisits?.map(visit => (
              <div
                key={visit.id}
                onClick={() => navigate('/patient/history')}
                className="card flex items-center gap-3 cursor-pointer hover:shadow-hero transition-shadow py-3"
              >
                <div className="w-10 h-10 bg-crimson-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={16} className="text-crimson-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-text-primary truncate">
                    {visit.complaint || 'Consultation'}
                  </p>
                  <p className="font-body text-xs text-text-muted">
                    {visit.doctor?.name} · {new Date(visit.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
                <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bills */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-sm font-bold text-text-secondary">
            Recent Bills
          </p>
          <button
            onClick={() => navigate('/patient/bills')}
            className="font-body text-xs text-crimson-500 font-semibold hover:text-crimson-700"
          >
            View all
          </button>
        </div>

        {recentBills?.length === 0 ? (
          <div className="card text-center py-6">
            <Receipt size={24} className="text-cream-400 mx-auto mb-2" />
            <p className="font-body text-sm text-text-muted">No bills yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentBills?.map(bill => (
              <div
                key={bill.id}
                onClick={() => navigate('/patient/bills')}
                className="card flex items-center gap-3 cursor-pointer hover:shadow-hero transition-shadow py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-text-primary">
                    {bill.clinic?.name}
                  </p>
                  <p className="font-body text-xs text-text-muted">
                    {new Date(bill.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-body font-bold text-sm text-text-primary">
                    ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`font-body text-xs font-bold px-2 py-0.5 rounded-pill
                    ${bill.status === 'paid'
                      ? 'bg-accent-teal/10 text-accent-teal'
                      : 'bg-accent-yellow/10 text-amber-600'
                    }`}>
                    {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### 7. `client/src/pages/patient/QueueTracker.jsx`

```jsx
import { useState, useEffect, useCallback } from 'react'
import { patientPortalAPI } from '../../services/api'
import { Activity, Clock, CheckCircle, FlaskConical, Pause } from 'lucide-react'

const STATUS_UI = {
  waiting: {
    emoji:   '⏳',
    label:   'Waiting',
    message: 'Please wait — we will notify you when your turn is near',
    color:   'text-text-body',
    bg:      'bg-cream-100',
  },
  now: {
    emoji:   '🎉',
    label:   'Your Turn!',
    message: 'Please proceed to the consultation room now',
    color:   'text-accent-teal',
    bg:      'bg-accent-teal/10',
  },
  paused: {
    emoji:   '⏸️',
    label:   'On Hold',
    message: 'Your token has been put on hold by the clinic',
    color:   'text-accent-peach',
    bg:      'bg-accent-peach/10',
  },
  lab: {
    emoji:   '🔬',
    label:   'In Lab',
    message: 'Please proceed to the lab for your tests',
    color:   'text-accent-sky',
    bg:      'bg-accent-sky/10',
  },
}

export default function QueueTracker() {
  const [tokenData, setTokenData] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

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
    // Poll every 20 seconds for live updates
    const interval = setInterval(fetchToken, 20000)
    return () => clearInterval(interval)
  }, [fetchToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-6 h-6 border-2 border-crimson-300 border-t-crimson-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!tokenData) {
    return (
      <div className="text-center py-20">
        <Activity size={48} className="text-cream-300 mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
          No Active Token
        </h2>
        <p className="font-body text-sm text-text-muted">
          You don't have an active queue token today.
          Visit a clinic to get one.
        </p>
      </div>
    )
  }

  const ui = STATUS_UI[tokenData.status] || STATUS_UI.waiting

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">
          Live Queue
        </h1>
        <p className="font-body text-sm text-text-muted">
          {tokenData.clinic?.name}
          {tokenData.doctor && ` · Dr. ${tokenData.doctor.name}`}
        </p>
      </div>

      {/* Main token display */}
      <div className={`rounded-3xl p-6 text-center ${ui.bg} border-2 border-current/10`}>
        <p className="text-5xl mb-2">{ui.emoji}</p>
        <p className={`font-body text-sm font-bold uppercase tracking-widest mb-2 ${ui.color}`}>
          {ui.label}
        </p>
        <p className="font-display font-bold text-8xl text-text-primary mb-1">
          T-{tokenData.tokenNumber}
        </p>
        <p className="font-body text-sm text-text-muted">{ui.message}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center py-4">
          <p className="font-body text-xs text-text-muted mb-1 flex items-center justify-center gap-1">
            <Activity size={12} /> Position
          </p>
          <p className="font-display font-bold text-3xl text-crimson-500">
            {tokenData.status === 'now'
              ? '🎉'
              : `#${tokenData.livePosition || tokenData.queuePosition || '—'}`
            }
          </p>
        </div>
        <div className="card text-center py-4">
          <p className="font-body text-xs text-text-muted mb-1 flex items-center justify-center gap-1">
            <Clock size={12} /> Est. Wait
          </p>
          <p className="font-display font-bold text-3xl text-accent-teal">
            {tokenData.status === 'now'
              ? 'Now'
              : tokenData.estimatedWait > 0
              ? `${tokenData.estimatedWait}m`
              : '—'
            }
          </p>
        </div>
      </div>

      {/* Tokens ahead */}
      {tokenData.status === 'waiting' && tokenData.tokensAhead >= 0 && (
        <div className="card">
          <p className="font-body text-sm text-text-muted text-center">
            {tokenData.tokensAhead === 0
              ? '✨ You are next in line!'
              : tokenData.tokensAhead === 1
              ? '1 patient ahead of you'
              : `${tokenData.tokensAhead} patients ahead of you`
            }
          </p>

          {/* Visual queue dots */}
          <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
            {Array.from({ length: Math.min(tokenData.tokensAhead + 1, 10) }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all
                  ${i < tokenData.tokensAhead ? 'bg-cream-300' : 'bg-crimson-500 scale-125'}`}
              />
            ))}
            {tokenData.tokensAhead > 9 && (
              <span className="font-body text-xs text-text-muted">+{tokenData.tokensAhead - 9} more</span>
            )}
          </div>
        </div>
      )}

      {/* Status steps */}
      <div className="card">
        <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
          Your Journey
        </p>
        <div className="space-y-3">
          {[
            { icon: CheckCircle, label: 'Token issued',         done: true },
            { icon: Clock,       label: 'Waiting in queue',     done: ['now','served','lab'].includes(tokenData.status), active: tokenData.status === 'waiting' },
            { icon: Activity,    label: 'Called by doctor',     done: ['served'].includes(tokenData.status),             active: tokenData.status === 'now'     },
            { icon: FlaskConical,label: 'Lab tests (if needed)',done: false,                                             active: tokenData.status === 'lab'     },
            { icon: CheckCircle, label: 'Consultation complete',done: false },
          ].map(({ icon: Icon, label, done, active }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                ${done   ? 'bg-accent-teal text-white'      : ''}
                ${active ? 'bg-crimson-500 text-white animate-pulse' : ''}
                ${!done && !active ? 'bg-cream-200 text-text-muted'  : ''}
              `}>
                <Icon size={13} />
              </div>
              <p className={`font-body text-sm
                ${done   ? 'text-accent-teal font-semibold line-through' : ''}
                ${active ? 'text-crimson-600 font-bold'                  : ''}
                ${!done && !active ? 'text-text-muted'                   : ''}
              `}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <p className="font-body text-xs text-text-muted text-center">
          Updates every 20 seconds · Last checked {lastUpdated.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
        </p>
      )}
    </div>
  )
}
```

---

### 8. `client/src/pages/patient/VisitHistory.jsx`

```jsx
import { useState, useEffect } from 'react'
import { patientPortalAPI } from '../../services/api'
import { Stethoscope, ChevronDown, ChevronUp, Pill, FlaskConical, Calendar } from 'lucide-react'

export default function VisitHistory() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    patientPortalAPI.getVisits()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-1/3" />
        {[1,2,3].map(i => <div key={i} className="card h-20" />)}
      </div>
    )
  }

  const { visits = [] } = data || {}

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">
          Visit History
        </h1>
        <p className="font-body text-sm text-text-muted">
          {visits.length} consultation{visits.length !== 1 ? 's' : ''} recorded
        </p>
      </div>

      {visits.length === 0 ? (
        <div className="card text-center py-16">
          <Stethoscope size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">
            No visits yet
          </p>
          <p className="font-body text-sm text-text-muted">
            Your consultation history will appear here after your first visit
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map(visit => (
            <div key={visit.id} className="card p-0 overflow-hidden">

              {/* Visit header */}
              <button
                className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-cream-50 transition-colors"
                onClick={() => setExpanded(expanded === visit.id ? null : visit.id)}
              >
                <div className="w-10 h-10 bg-crimson-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={16} className="text-crimson-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-bold text-sm text-text-primary">
                    {visit.complaint || 'Consultation'}
                  </p>
                  <p className="font-body text-xs text-text-muted mt-0.5">
                    Dr. {visit.doctor?.name}
                    {' · '}
                    {new Date(visit.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                  {/* Complaint tags */}
                  {visit.complaintTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {visit.complaintTags.slice(0, 3).map(tag => (
                        <span key={tag} className="font-body text-xs bg-crimson-100 text-crimson-600 px-2 py-0.5 rounded-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {expanded === visit.id
                  ? <ChevronUp size={16} className="text-text-muted flex-shrink-0 mt-1" />
                  : <ChevronDown size={16} className="text-text-muted flex-shrink-0 mt-1" />
                }
              </button>

              {/* Expanded visit details */}
              {expanded === visit.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-cream-100">

                  {/* Diagnosis */}
                  {visit.diagnosis && (
                    <div className="pt-3">
                      <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                        Diagnosis
                      </p>
                      <p className="font-body text-sm text-text-body bg-cream-50 rounded-xl px-3 py-2">
                        {visit.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {visit.prescriptions?.length > 0 && (
                    <div>
                      <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                        <Pill size={11} /> Prescriptions
                      </p>
                      <div className="space-y-1.5">
                        {visit.prescriptions.map((rx, i) => (
                          <div key={i} className="bg-cream-50 rounded-xl px-3 py-2">
                            <p className="font-body text-sm font-bold text-text-primary">
                              {rx.name}
                            </p>
                            <p className="font-body text-xs text-text-muted">
                              {[rx.dose, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tests */}
                  {visit.testsOrdered?.length > 0 && (
                    <div>
                      <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                        <FlaskConical size={11} /> Tests Ordered
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {visit.testsOrdered.map(test => (
                          <span key={test} className="font-body text-xs bg-accent-sky/10 text-accent-sky px-2.5 py-1 rounded-pill">
                            {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up */}
                  {visit.followUpDate && (
                    <div className="flex items-center gap-2 bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl px-3 py-2">
                      <Calendar size={14} className="text-amber-600 flex-shrink-0" />
                      <p className="font-body text-sm text-text-body">
                        Follow-up:{' '}
                        <strong>
                          {new Date(visit.followUpDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </strong>
                      </p>
                    </div>
                  )}

                  {/* Vitals */}
                  {visit.vitals && Object.values(visit.vitals).some(Boolean) && (
                    <div>
                      <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                        Vitals
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(visit.vitals).filter(([,v]) => v).map(([k, v]) => (
                          <div key={k} className="bg-cream-50 rounded-xl px-3 py-2">
                            <p className="font-body text-xs text-text-muted capitalize">{k === 'bp' ? 'Blood Pressure' : k}</p>
                            <p className="font-body text-sm font-bold text-text-primary">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### 9. `client/src/pages/patient/BillHistory.jsx`

```jsx
import { useState, useEffect } from 'react'
import { patientPortalAPI } from '../../services/api'
import { Receipt, CheckCircle, Clock } from 'lucide-react'

export default function BillHistory() {
  const [bills, setBills]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientPortalAPI.getBills()
      .then(res => setBills(res.data.data.bills))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-1/3" />
        {[1,2,3].map(i => <div key={i} className="card h-20" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Bills</h1>
        <p className="font-body text-sm text-text-muted">
          {bills.length} bill{bills.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {bills.length === 0 ? (
        <div className="card text-center py-16">
          <Receipt size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">No bills yet</p>
          <p className="font-body text-sm text-text-muted">Your bills will appear here after consultations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map(bill => (
            <div key={bill.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-body font-bold text-sm text-text-primary">
                    {bill.clinic?.name}
                  </p>
                  <p className="font-body text-xs text-text-muted mt-0.5">
                    {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>

                  {/* Items summary */}
                  <div className="mt-2 space-y-0.5">
                    {bill.items?.slice(0, 2).map((item, i) => (
                      <p key={i} className="font-body text-xs text-text-muted">
                        {item.name} × {item.quantity}
                        <span className="ml-2">₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </p>
                    ))}
                    {bill.items?.length > 2 && (
                      <p className="font-body text-xs text-text-muted">
                        +{bill.items.length - 2} more items
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className="font-display font-bold text-lg text-text-primary">
                    ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`inline-flex items-center gap-1 font-body text-xs font-bold px-2 py-0.5 rounded-pill mt-1
                    ${bill.status === 'paid'
                      ? 'bg-accent-teal/10 text-accent-teal'
                      : 'bg-accent-yellow/10 text-amber-600'
                    }`}>
                    {bill.status === 'paid'
                      ? <><CheckCircle size={11} /> Paid</>
                      : <><Clock size={11} /> Unpaid</>
                    }
                  </span>
                  {bill.paymentMethod && (
                    <p className="font-body text-xs text-text-muted mt-1 capitalize">
                      via {bill.paymentMethod}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### 10. Update `client/src/App.jsx`

```jsx
// Add imports
import PatientLayout    from './layouts/PatientLayout'
import PatientDashboard from './pages/patient/PatientDashboard'
import QueueTracker     from './pages/patient/QueueTracker'
import VisitHistory     from './pages/patient/VisitHistory'
import BillHistory      from './pages/patient/BillHistory'

// Replace the /patient route with nested routes:
<Route path="/patient" element={
  <ProtectedRoute allowedRoles={['patient']}>
    <PatientLayout />
  </ProtectedRoute>
}>
  <Route index           element={<PatientDashboard />} />
  <Route path="queue"    element={<QueueTracker />} />
  <Route path="history"  element={<VisitHistory />} />
  <Route path="bills"    element={<BillHistory />} />
</Route>
```

Also create `client/src/pages/patient/` folder.

---

## Important — Patient Must Have a `userId`

The patient portal works by finding a `Patient` record where `userId = logged-in user's id`. This means patients who registered through the patient signup flow will have a `userId` linked. But patients registered by staff at reception (walk-ins) have `userId = null`.

For the portal to work for a patient, they need to have signed up through `/signup/patient` and their phone number must match a patient record in the clinic.

**Add a link step** — when a patient signs up, after registration, check if their phone already exists as a walk-in patient and link them:

In `server/src/services/auth.service.js`, after the patient user is created, add:

```js
// Link to existing walk-in patient record if phone matches
if (role === 'patient' && phone) {
  const existingPatient = await Patient.findOne({ where: { phone } })
  if (existingPatient && !existingPatient.userId) {
    await existingPatient.update({ userId: user.id })
  } else if (!existingPatient) {
    // Create a patient record for them (they can be added to any clinic later)
    await Patient.create({
      userId: user.id,
      phone,
      name,
      clinicId: null, // will be set when they visit a clinic
    })
  }
}
```

Wait — `clinicId` is required (allowNull: false) in the Patient model. Update `patient.model.js`:

```js
clinicId: {
  type:      DataTypes.UUID,
  allowNull: true,   // ← change to true for patient portal signups
},
```

---

## Restart Both Servers

```bash
cd server && npm run dev
cd client && npm run dev
```

---

## Test Checklist

- [ ] Login as patient → lands on `/patient` dashboard
- [ ] If patient has active token → big token card shown with queue position
- [ ] Click token card → goes to `/patient/queue`
- [ ] Queue tracker shows position, ETA, tokens ahead, journey steps
- [ ] Updates every 20 seconds without page refresh
- [ ] When staff calls patient (marks "Now") → status changes to "Your Turn 🎉"
- [ ] `/patient/history` → list of completed visits
- [ ] Click any visit → expands with diagnosis, prescriptions, tests, follow-up
- [ ] `/patient/bills` → list of all bills with paid/unpaid badge
- [ ] Bottom navigation works between all 4 tabs
- [ ] Sign out → back to homepage

Tell me when Phase 8 is working and we move to Phase 9 — Admin Analytics.