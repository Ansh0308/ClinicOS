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
  getDoctors,
} = require('../controllers/clinic.controller')
const { protect }  = require('../middleware/auth.middleware')
const { rbac }     = require('../middleware/rbac.middleware')
const { getAuditLogs } = require('../controllers/audit.controller')
const { getIntegrations, updateIntegrations } = require('../controllers/clinic.controller')

// ── Staff + Admin accessible ──────────────────────────────────────
// Doctors list — needed by reception to assign tokens
router.get('/doctors', protect, rbac(['staff', 'admin', 'doctor']), getDoctors)

// ── Admin only ────────────────────────────────────────────────────
router.use(protect, rbac(['admin']))

router.get('/stats',                getStats)
router.get('/join-requests',        getJoinRequests)
router.patch('/join-requests/:id',  reviewRequest)
router.get('/team',                 getTeam)
router.patch('/team/:id',           updateMember)
router.get('/clinic',               getClinicDetails)
router.patch('/clinic',             updateClinicDetails)
router.get('/audit-logs',           getAuditLogs)
router.get('/integrations',         getIntegrations)
router.patch('/integrations',       updateIntegrations)

module.exports = router