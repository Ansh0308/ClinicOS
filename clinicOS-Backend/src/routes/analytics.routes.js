const express = require('express')
const {
  getOverview,
  getRevenue,
  getQueueStats,
  getTopComplaints,
  getDoctorStats,
} = require('../controllers/analytics.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac } = require('../middleware/rbac.middleware')

const router = express.Router()

router.use(protect)
router.get('/overview', rbac(['admin', 'staff']), getOverview)

router.use(rbac(['admin']))

router.get('/revenue', getRevenue)
router.get('/queue', getQueueStats)
router.get('/complaints', getTopComplaints)
router.get('/doctors', getDoctorStats)

module.exports = router
