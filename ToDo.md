Good catches. Two real problems here. Let me fix both.

---

## Problem 1 — Staff Can't Fetch Doctors

The doctor selector in reception calls `adminAPI.getTeam()` which hits `GET /api/admin/team` — but that route has `rbac(['admin'])` so staff get a 403 error and the dropdown stays empty.

**Fix — Add a public clinic endpoint for staff:**

### Update `server/src/routes/clinic.routes.js`

```js
const express = require('express')
const router  = express.Router()
const {
  getStats,
  getJoinRequests,
  reviewRequest,
  getTeam,
  updateMember,
  getClinicDetails,
  updateClinicDetails,
  getDoctors,              // ← add this
} = require('../controllers/clinic.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

// ── Staff + Admin accessible ──────────────────────────────────────
// Doctors list — needed by reception to assign tokens
router.get('/doctors', protect, rbac(['staff', 'admin', 'doctor']), getDoctors)

// ── Admin only ────────────────────────────────────────────────────
router.use(protect, rbac(['admin']))
router.get('/stats',               getStats)
router.get('/join-requests',       getJoinRequests)
router.patch('/join-requests/:id', reviewRequest)
router.get('/team',                getTeam)
router.patch('/team/:id',          updateMember)
router.get('/clinic',              getClinicDetails)
router.patch('/clinic',            updateClinicDetails)

module.exports = router
```

### Add `getDoctors` to `server/src/controllers/clinic.controller.js`

Add this function before `module.exports`:

```js
// GET /api/admin/doctors  (staff + admin accessible)
const getDoctors = async (req, res) => {
  try {
    const doctors = await User.findAll({
      where: {
        clinicId: req.user.clinicId,
        role:     'doctor',
        status:   'approved',
      },
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']],
    })
    return success(res, { doctors })
  } catch (err) {
    console.error('getDoctors error:', err.message)
    return error(res, 'Failed to fetch doctors', 500)
  }
}
```

Add it to `module.exports`:

```js
module.exports = {
  getStats,
  getJoinRequests,
  reviewRequest,
  getTeam,
  updateMember,
  getClinicDetails,
  updateClinicDetails,
  getDoctors,           // ← add this
}
```

### Update `client/src/services/api.js`

Add the doctors endpoint:

```js
export const clinicAPI = {
  getDoctors: () => api.get('/admin/doctors'),
}
```

### Update `ReceptionDashboard.jsx`

Change the `fetchDoctors` function — replace `adminAPI.getTeam()` with the new endpoint:

```jsx
// Add clinicAPI to your import at the top:
import { patientAPI, tokenAPI, adminAPI, clinicAPI } from '../../services/api'

// Replace the fetchDoctors function:
const fetchDoctors = useCallback(async () => {
  try {
    const res = await clinicAPI.getDoctors()
    setDoctors(res.data.data.doctors)
  } catch (err) {
    console.error('fetchDoctors error:', err)
  }
}, [])
```

Now the doctor dropdown will actually populate for staff users.

---

## Problem 2 — Prerequisites Check for Consultation Flow

Going through each item carefully:

---

### ✅ "Open Consultation" navigates to `/doctor/consult/:tokenId`

In `DoctorQueue.jsx`:
```jsx
const handleStartConsultation = (token) => {
  navigate(`/doctor/consult/${token.id}`, {
    state: { token, patient: token.patient }
  })
}
```

**Issue found:** `token.patient` only has `id`, `name`, `phone` from the include. The `ConsultationForm` uses `patient?.id` to create the visit — that works. But `token.id` is used as `tokenId` in the URL, while `ConsultationForm` uses `useParams()` to get `tokenId`. That's correct.

**But there's a mismatch** — the route is `/doctor/consult/:tokenId` but the token's `id` is a UUID, not `tokenNumber`. The `useParams()` returns `{ tokenId: 'uuid-here' }`. The `visitAPI.create` call sends `{ patientId, tokenId }` where `tokenId` is this UUID. That's correct.

✅ This works.

---

### ✅ Tag chips on Enter

`TagInput` component handles this:
```jsx
onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
```
✅ Works.

---

### ⚠️ Autosave — Visit must exist first

**Issue found:** The autosave interval starts immediately but `visitId` might be null for a few seconds while the `visitAPI.create` call is in flight. The interval checks `if (!visitId || isComplete) return` so it won't crash — but if `visitId` is never set (because `visitAPI.create` fails), autosave silently does nothing.

**Fix** — Show a loading state and add error handling:

In `ConsultationForm.jsx`, update the visit creation useEffect:

```jsx
const [visitLoading, setVisitLoading] = useState(true)
const [visitError, setVisitError]     = useState('')

useEffect(() => {
  if (!patient?.id) return

  visitAPI.create({ patientId: patient.id, tokenId })
    .then(res => {
      setVisitId(res.data.data.visit.id)
      setVisitLoading(false)
    })
    .catch(err => {
      console.error('create visit error:', err)
      setVisitError('Failed to start consultation. Please go back and try again.')
      setVisitLoading(false)
    })
}, [patient?.id, tokenId])
```

Show this at the top of the form:

```jsx
// Add after the completed banner:
{visitLoading && (
  <div className="flex items-center gap-2 p-3 bg-cream-100 rounded-2xl mb-4">
    <span className="w-4 h-4 border-2 border-crimson-300 border-t-crimson-600 rounded-full animate-spin" />
    <span className="font-body text-sm text-text-muted">Starting consultation...</span>
  </div>
)}

{visitError && (
  <div className="bg-accent-coral/10 border border-accent-coral/30 rounded-2xl p-4 mb-4">
    <p className="font-body text-sm text-accent-coral">{visitError}</p>
  </div>
)}
```

---

### ⚠️ Visit routes — wrong path structure

**Issue found:** In `visit.routes.js` the patient history routes are:
```js
router.get('/patients/:id/visits', ...)
```

Mounted at `/api/visits` — so the full URL is `/api/visits/patients/:id/visits`.

But in `api.js`:
```js
getPatientVisits: (patientId) => api.get(`/visits/patients/${patientId}/visits`),
```

This is `/api/visits/patients/:id/visits` — ✅ matches.

**But there's a conflict** — Express might try to match `/patients/:id` as a visit ID `:id` from `router.patch('/:id', ...)`. The solution is to put the patient routes BEFORE the `:id` routes.

**Fix** — Reorder `visit.routes.js`:

```js
const express = require('express')
const router  = express.Router()
const {
  createVisit,
  updateVisit,
  completeVisit,
  getPatientVisits,
  getPatientProfile,
} = require('../controllers/visit.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect)

// ── Patient history routes FIRST (before /:id routes) ────────────
// Without this, Express matches 'patients' as the :id param
router.get('/patients/:id/visits',  rbac(['doctor', 'admin', 'staff']), getPatientVisits)
router.get('/patients/:id/profile', rbac(['doctor', 'admin', 'staff']), getPatientProfile)

// ── Visit CRUD routes ─────────────────────────────────────────────
router.post('/',              rbac(['doctor']), createVisit)
router.patch('/:id',          rbac(['doctor']), updateVisit)
router.patch('/:id/complete', rbac(['doctor']), completeVisit)

module.exports = router
```

---

### ✅ History panel — PatientHistoryPanel

`PatientHistoryPanel` calls `visitAPI.getPatientVisits(patientId)`. The `patientId` comes from `state?.patient` passed through navigation. `token.patient.id` is included in the `getTokens` response — ✅ correct.

---

### ⚠️ Complete Consultation → token marked served

**Issue found:** `completeVisit` does:
```js
if (visit.tokenId) {
  await Token.update(
    { status: 'served', servedAt: new Date() },
    { where: { id: visit.tokenId } }
  )
}
```

The `tokenId` stored in the visit is the token's UUID (from `useParams` → `tokenId`). This is correct as long as the visit was created with `tokenId: tokenId` where `tokenId` is the UUID from the URL. ✅ Works.

---

### ⚠️ "Call Next" in DoctorQueue

**Issue found:** `handleCallNext` marks current as served AND next as now in sequence — but if either API call fails halfway, the queue gets into an inconsistent state.

**Fix** — Wrap in try/catch with rollback messaging:

```jsx
const handleCallNext = async () => {
  if (!nextPatient) return
  setCalling(nextPatient.id)
  try {
    if (currentPatient) {
      await tokenAPI.updateStatus(currentPatient.id, 'served')
    }
    await tokenAPI.updateStatus(nextPatient.id, 'now')
    await fetchMyQueue()
  } catch (err) {
    console.error('Call next failed:', err)
    // Refresh to get accurate state
    await fetchMyQueue()
  } finally {
    setCalling(null)
  }
}
```

---

## Summary of All Fixes

| Issue | Fix |
|---|---|
| Staff can't see doctors in dropdown | New `GET /api/admin/doctors` route with `rbac(['staff','admin','doctor'])` |
| Doctor dropdown uses wrong API call | `clinicAPI.getDoctors()` instead of `adminAPI.getTeam()` |
| Visit creation error not shown to user | Added `visitLoading` + `visitError` states |
| Route order conflict in visit.routes.js | Patient routes moved before `/:id` routes |
| Call Next no error recovery | Added try/catch with queue refresh |

Make these 5 fixes, restart both servers, then go through the test checklist again. The consultation flow should work end to end.