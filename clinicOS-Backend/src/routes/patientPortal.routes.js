const express = require('express')
const router  = express.Router()
const {
  getDashboard,
  getActiveToken,
  getVisitHistory,
  getBillHistory,
  getProfile,
  updateProfile,
  leaveQueue,
  initiatePayment,
  getNotifications,
} = require('../controllers/patientPortal.controller')
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require('../controllers/bill.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect, rbac(['patient']))

router.get('/dashboard',                getDashboard)
router.get('/token',                    getActiveToken)
router.get('/visits',                   getVisitHistory)
router.get('/bills',                    getBillHistory)
router.get('/profile',                  getProfile)
router.patch('/profile',                updateProfile)
router.post('/leave-queue',             leaveQueue)
router.post('/bills/:id/pay',           initiatePayment)       // Cash / UPI (mock)
router.post('/bills/:id/razorpay-order',  createRazorpayOrder)  // Step 1: create Razorpay order
router.post('/bills/:id/razorpay-verify', verifyRazorpayPayment)// Step 2: verify & mark paid
router.get('/notifications',            getNotifications)

module.exports = router
