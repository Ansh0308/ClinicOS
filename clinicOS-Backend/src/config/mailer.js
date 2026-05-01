const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendMail = async ({ to, subject, html }) => {
  // If no API key is provided, log to console and skip (prevents 500 error & timeout)
  if (!process.env.RESEND_API_KEY) {
    console.warn('\n⚠️ [Mailer] RESEND_API_KEY is not set! Skipping email delivery.')
    console.warn(`⚠️ [Mailer] Would have sent to: ${to} | Subject: ${subject}\n`)
    return { success: false, message: 'Email skipped - No API Key' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'ClinicOS <onboarding@resend.dev>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Mailer] Resend Error:', error)
      throw new Error(error.message)
    }

    return { success: true, data }
  } catch (err) {
    console.error('[Mailer] Failed to send email via Resend:', err.message)
    throw err
  }
}

module.exports = { sendMail }
