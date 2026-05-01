const sendMail = async ({ to, subject, html }) => {
  const brevoApiKey = process.env.BREVO_API_KEY

  // If no API key is provided, log to console and skip (prevents 500 error & timeout)
  if (!brevoApiKey) {
    console.warn('\n⚠️ [Mailer] BREVO_API_KEY is not set! Skipping email delivery.')
    console.warn(`⚠️ [Mailer] Would have sent to: ${to} | Subject: ${subject}\n`)
    return { success: false, message: 'Email skipped - No API Key' }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: 'ClinicOS',
          // Note: This email must be verified in your Brevo account
          email: process.env.MAIL_FROM_EMAIL || 'anshraythatha123@gmail.com'
        },
        to: [
          { email: to }
        ],
        subject: subject,
        htmlContent: html
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Mailer] Brevo Error:', errorData)
      return { success: false, message: errorData.message || 'Brevo API error' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (err) {
    console.error('[Mailer] Failed to send email via Brevo:', err.message)
    return { success: false, message: err.message }
  }
}

module.exports = { sendMail }
