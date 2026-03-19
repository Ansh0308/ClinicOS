const bcrypt  = require('bcryptjs')
const crypto  = require('crypto')
const { success, error } = require('../utils/apiResponse')
const { generateOTP, saveOTP, verifyOTP, sendOTPEmail } = require('../services/otp.service')
const { registerUser, loginUser } = require('../services/auth.service')
const { User, Clinic } = require('../models')
const transporter = require('../config/mailer')
require('dotenv').config()

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
const sendOTP = async (req, res) => {
  const { email, checkDuplicate } = req.body

  if (!email) return error(res, 'Email is required', 400)

  try {
    // If signup is sending this — check email not already taken
    // This way user finds out BEFORE receiving an OTP email
    if (checkDuplicate) {
      const existing = await User.findOne({ where: { email } })
      if (existing) {
        return error(res, 'An account with this email already exists. Please sign in instead.', 409)
      }
    }

    const code = generateOTP()
    await saveOTP(email, code)
    await sendOTPEmail(email, code)

    return success(res, { message: 'OTP sent to ' + email })
  } catch (err) {
    console.error('sendOTP error:', err.message)
    return error(res, 'Failed to send OTP. Please try again.', 500)
  }
}

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
const verifyOTPHandler = async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) return error(res, 'Email and code are required', 400)

  try {
    const valid = await verifyOTP(email, code)
    if (!valid) return error(res, 'Invalid or expired OTP', 400)
    return success(res, { message: 'OTP verified successfully' })
  } catch (err) {
    console.error('verifyOTP error:', err.message)
    return error(res, 'Verification failed', 500)
  }
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res) => {
  const { name, email, password, phone, role, clinicData, clinicCode, qualification, designation } = req.body

  if (!name || !email || !password || !role) {
    return error(res, 'Name, email, password and role are required', 400)
  }

  const validRoles = ['patient', 'admin', 'doctor', 'staff']
  if (!validRoles.includes(role)) return error(res, 'Invalid role', 400)

  try {
    const result = await registerUser({
      name, email, password, phone, role,
      clinicData, clinicCode, qualification, designation,
    })
    return success(res, result, 201)
  } catch (err) {
    console.error('register error:', err.message)
    if (err.message.includes('already exists')) return error(res, err.message, 409)
    if (err.message.includes('Clinic code not found')) return error(res, err.message, 404)
    return error(res, err.message || 'Registration failed', 500)
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) return error(res, 'Email and password are required', 400)

  try {
    const result = await loginUser(email, password)
    return success(res, result)
  } catch (err) {
    console.error('login error:', err.message)
    return error(res, err.message || 'Login failed', 401)
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'role', 'status', 'clinicId'],
      include: [{ association: 'clinic', attributes: ['id', 'name', 'clinicCode'] }],
    })

    if (!user) return error(res, 'User not found', 404)

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

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email) return error(res, 'Email is required', 400)

  try {
    const user = await User.findOne({ where: { email } })

    // Always return success even if email not found
    // This prevents email enumeration attacks
    if (!user) {
      return success(res, { message: 'If this email exists, a reset link has been sent.' })
    }

    // Generate a secure random token
    const resetToken  = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await user.update({
      resetToken,
      resetTokenExpiry: resetExpiry,
    })

    // Build the reset link pointing to your frontend
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

    await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to:      email,
      subject: 'Reset your ClinicOS password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #C43055; margin-bottom: 8px;">ClinicOS</h2>
          <p style="color: #5C3040; margin-bottom: 24px;">
            Someone requested a password reset for your account. Click the button below to set a new password.
            This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetLink}"
             style="display: inline-block; background: #4E0E20; color: white; padding: 14px 32px;
                    border-radius: 100px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Reset Password
          </a>
          <p style="color: #8A6070; font-size: 13px; margin-top: 24px;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
          <p style="color: #8A6070; font-size: 12px;">
            Or copy this link: ${resetLink}
          </p>
        </div>
      `,
    })

    return success(res, { message: 'If this email exists, a reset link has been sent.' })
  } catch (err) {
    console.error('forgotPassword error:', err.message)
    return error(res, 'Failed to send reset email. Try again.', 500)
  }
}

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) {
    return error(res, 'Token and new password are required', 400)
  }

  if (password.length < 8) {
    return error(res, 'Password must be at least 8 characters', 400)
  }

  try {
    // Find user with this token that hasn't expired
    const user = await User.findOne({
      where: { resetToken: token },
    })

    if (!user) {
      return error(res, 'Invalid or expired reset link. Please request a new one.', 400)
    }

    // Check token not expired
    if (new Date() > new Date(user.resetTokenExpiry)) {
      return error(res, 'This reset link has expired. Please request a new one.', 400)
    }

    // Hash new password and clear the reset token
    const passwordHash = await bcrypt.hash(password, 12)
    await user.update({
      passwordHash,
      resetToken:       null,
      resetTokenExpiry: null,
    })

    return success(res, { message: 'Password reset successfully. You can now sign in.' })
  } catch (err) {
    console.error('resetPassword error:', err.message)
    return error(res, 'Failed to reset password. Try again.', 500)
  }
}

module.exports = {
  sendOTP,
  verifyOTP: verifyOTPHandler,
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
}