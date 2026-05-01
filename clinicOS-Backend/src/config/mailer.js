const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

const sendMail = async ({ to, subject, html }) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log('[Mailer] SMTP credentials not configured')
    throw new Error('SMTP credentials not set')
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || 'ClinicOS <no-reply@clinicos.com>',
    to,
    subject,
    html,
  }

  return transporter.sendMail(mailOptions)
}

module.exports = { sendMail }
