const { success, error } = require('../utils/apiResponse')
const { generateOTP, saveOTP, verifyOTP, sendOTPEmail } = require('../services/otp.service')
const { registerUser, loginUser } = require('../services/auth.service')
const { User, Clinic } = require('../models')

// POST /api/auth/send-otp
const sendOTP = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return error(res, 'Email is required', 400)
  }

  try {
    const code = generateOTP()
    await saveOTP(email, code)
    await sendOTPEmail(email, code)

    return success(res, { message: 'OTP sent to ' + email })
  } catch (err) {
    console.error('sendOTP error:', err.message)
    return error(res, 'Failed to send OTP. Please try again.', 500)
  }
}

// POST /api/auth/verify-otp
const verifyOTPHandler = async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) {
    return error(res, 'Email and code are required', 400)
  }

  try {
    const valid = await verifyOTP(email, code)

    if (!valid) {
      return error(res, 'Invalid or expired OTP', 400)
    }

    return success(res, { message: 'OTP verified successfully' })
  } catch (err) {
    console.error('verifyOTP error:', err.message)
    return error(res, 'Verification failed', 500)
  }
}

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, phone, role, clinicData, clinicCode, qualification, designation } = req.body

  if (!name || !email || !password || !role) {
    return error(res, 'Name, email, password and role are required', 400)
  }

  const validRoles = ['patient', 'admin', 'doctor', 'staff']
  if (!validRoles.includes(role)) {
    return error(res, 'Invalid role', 400)
  }

  try {
    const result = await registerUser({
      name, email, password, phone, role,
      clinicData, clinicCode, qualification, designation,
    })

    return success(res, result, 201)
  } catch (err) {
    console.error('register error:', err.message)

    // Specific error for duplicate email
    if (err.message.includes('already exists')) {
      return error(res, err.message, 409)
    }

    if (err.message.includes('Clinic code not found')) {
      return error(res, err.message, 404)
    }

    return error(res, err.message || 'Registration failed', 500)
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return error(res, 'Email and password are required', 400)
  }

  try {
    const result = await loginUser(email, password)
    return success(res, result)
  } catch (err) {
    console.error('login error:', err.message)
    return error(res, err.message || 'Login failed', 401)
  }
}

// GET /api/auth/me  (protected — needs JWT)
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'role', 'status', 'clinicId'],
      include: [{ association: 'clinic', attributes: ['id', 'name', 'clinicCode'] }],
    })

    if (!user) {
      return error(res, 'User not found', 404)
    }

    return success(res, {
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        status:     user.status,
        clinicId:   user.clinicId,
        clinicName: user.clinic?.name       || null,
        clinicCode: user.clinic?.clinicCode || null,
      }
    })
  } catch (err) {
    console.error('getMe error:', err.message)
    return error(res, 'Failed to get user', 500)
  }
}

module.exports = { sendOTP, verifyOTP: verifyOTPHandler, register, login, getMe }