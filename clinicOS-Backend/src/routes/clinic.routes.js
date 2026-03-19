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
} = require('../controllers/clinic.controller')
const { protect }  = require('../middleware/auth.middleware')
const { rbac }     = require('../middleware/rbac.middleware')

// All routes require JWT + admin role
router.use(protect, rbac(['admin']))

router.get('/stats',                getStats)
router.get('/join-requests',        getJoinRequests)
router.patch('/join-requests/:id',  reviewRequest)
router.get('/team',                 getTeam)
router.patch('/team/:id',           updateMember)
router.get('/clinic',               getClinicDetails)
router.patch('/clinic',             updateClinicDetails)

module.exports = router