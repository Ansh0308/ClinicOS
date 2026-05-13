const { OtpCode } = require('../models')
const { sendMail } = require('../config/mailer')

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const saveOTP = async (email, code) => {
  await OtpCode.destroy({ where: { email } })

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await OtpCode.create({ email, code, expiresAt })
}

const otpAttempts = new Map()

setInterval(() => {
  otpAttempts.clear()
}, 2 * 60 * 60 * 1000)

const verifyOTP = async (email, code) => {
  const attempt = otpAttempts.get(email) || { count: 0, lockedUntil: null }

  if (attempt.lockedUntil && new Date() < attempt.lockedUntil) {
    const minutesLeft = Math.ceil((attempt.lockedUntil - new Date()) / 60000)
    throw new Error(`Too many failed attempts. Try again after ${minutesLeft} minutes.`)
  }

  const otp = await OtpCode.findOne({
    where: {
      email,
      code,
      used: false,
    },
  })

  if (!otp || new Date() > new Date(otp.expiresAt)) {
    attempt.count += 1
    if (attempt.count >= 5) {
      attempt.lockedUntil = new Date(Date.now() + 30 * 60 * 1000)
    }
    otpAttempts.set(email, attempt)
    return false
  }

  await otp.update({ used: true })
  otpAttempts.delete(email)

  return true
}

const sendOTPEmail = async (email, otp) => {
  try {
    await sendMail({
      to: email,
      subject: 'Your ClinicOS verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #C43055; margin-bottom: 8px;">ClinicOS</h2>
          <p style="color: #5C3040; margin-bottom: 24px;">
            Use the code below to verify your email. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background: #FBEAF0; border: 2px solid #F2C5D4; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #8A6070; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">
              Your OTP Code
            </p>
            <p style="color: #1C0910; font-size: 40px; font-weight: 700; letter-spacing: 8px; margin: 0;">
              ${otp}
            </p>
          </div>
          <p style="color: #8A6070; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('sendOTPEmail failed:', err.message)
    throw err
  }
}

module.exports = { generateOTP, saveOTP, verifyOTP, sendOTPEmail }
