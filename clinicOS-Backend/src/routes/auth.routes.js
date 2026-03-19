const express = require('express')
const router  = express.Router()
const { sendOTP, verifyOTP, register, login, getMe } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')

router.post('/send-otp',   sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/register',   register)
router.post('/login',      login)
router.get('/me',          protect, getMe)

module.exports = router