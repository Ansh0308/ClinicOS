const express = require('express')
const router  = express.Router()

const {
  sendOTP,
  verifyOTP,
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller')

const { protect } = require('../middleware/auth.middleware')

// ── Auth Routes ───────────────────────────────────────────────────
router.post('/send-otp',        sendOTP)
router.post('/verify-otp',      verifyOTP)
router.post('/register',        register)
router.post('/login',           login)
router.get( '/me',              protect, getMe)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password',  resetPassword)

module.exports = router