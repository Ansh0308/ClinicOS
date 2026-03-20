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
