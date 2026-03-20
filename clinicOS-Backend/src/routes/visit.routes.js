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
