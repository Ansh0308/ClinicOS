const transporter    = require('../config/mailer')
const { renderTemplate } = require('../config/messageTemplates')
const { MessageLog, Patient } = require('../models')
require('dotenv').config()

// ── Send email ────────────────────────────────────────────────────
const sendEmail = async (to, subject, body) => {
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <div style="background: linear-gradient(160deg, #D95570 0%, #A02040 55%, #4E0E20 100%);
                    padding: 20px 28px; border-radius: 16px 16px 0 0; margin-bottom: 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">ClinicOS</h2>
        </div>
        <div style="background: #FDFAF4; padding: 28px; border-radius: 0 0 16px 16px;
                    border: 1px solid #E0D4B5; border-top: none;">
          <p style="color: #5C3040; font-size: 15px; line-height: 1.7; white-space: pre-line; margin: 0 0 20px;">
            ${body}
          </p>
          <hr style="border: none; border-top: 1px solid #E0D4B5; margin: 20px 0;" />
          <p style="color: #8A6070; font-size: 12px; margin: 0;">
            This message was sent by ClinicOS on behalf of your clinic.
            Reply STOP to opt out.
          </p>
        </div>
      </div>
    `,
  })
}

// ── Send WhatsApp (via Meta Cloud API) ────────────────────────────
// Falls back to email if WhatsApp not configured
const sendWhatsApp = async (phone, body) => {
  const apiKey  = process.env.WHATSAPP_API_KEY
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!apiKey || !phoneId) {
    // WhatsApp not configured — skip silently in dev
    console.log(`[WhatsApp - DEV] To: ${phone}\n${body}`)
    return
  }

  const axios = require('axios')
  await axios.post(
    `https://graph.facebook.com/v18.0/${phoneId}/messages`,
    {
      messaging_product: 'whatsapp',
      to:    phone.startsWith('+') ? phone : `+91${phone}`,
      type:  'text',
      text:  { body },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )
}

// ── Send SMS (via MSG91) ──────────────────────────────────────────
const sendSMS = async (phone, body) => {
  const apiKey  = process.env.MSG91_API_KEY
  const senderId = process.env.MSG91_SENDER_ID || 'CLINICOS'

  if (!apiKey) {
    console.log(`[SMS - DEV] To: ${phone}\n${body}`)
    return
  }

  const axios = require('axios')
  await axios.post(
    'https://api.msg91.com/api/v5/flow/',
    {
      template_id:  process.env.MSG91_TEMPLATE_ID,
      short_url:    '0',
      realTimeResponse: '1',
      recipients: [{
        mobiles: `91${phone}`,
        message: body,
      }],
    },
    { headers: { authkey: apiKey } }
  )
}

// ── Log message to DB ─────────────────────────────────────────────
const logMessage = async ({ patientId, clinicId, channel, template, status, error }) => {
  try {
    await MessageLog.create({
      patientId,
      clinicId,
      channel,
      template,
      status: status || 'sent',
      errorMessage: error || null,
    })
  } catch (err) {
    console.error('Failed to log message:', err.message)
  }
}

// ── Main send function ────────────────────────────────────────────
// This is the single entry point for all outgoing messages
const sendMessage = async ({
  patientId,
  clinicId,
  templateName,
  variables,
  channels = ['email'], // default email only
}) => {
  try {
    // Check patient opt-in
    const patient = await Patient.findByPk(patientId, {
      attributes: ['id', 'phone', 'optInMsg'],
      include: [{ association: 'user', attributes: ['email'] }],
    })

    if (!patient) {
      console.error(`sendMessage: patient ${patientId} not found`)
      return
    }

    if (!patient.optInMsg) {
      console.log(`sendMessage: patient ${patientId} has opted out — skipping`)
      return
    }

    const { subject, body } = renderTemplate(templateName, variables)

    // Send on each requested channel
    for (const channel of channels) {
      try {
        if (channel === 'email' && patient.user?.email) {
          await sendEmail(patient.user.email, subject, body)
          await logMessage({ patientId, clinicId, channel: 'email', template: templateName, status: 'sent' })
        }

        if (channel === 'whatsapp' && patient.phone) {
          await sendWhatsApp(patient.phone, body)
          await logMessage({ patientId, clinicId, channel: 'whatsapp', template: templateName, status: 'sent' })
        }

        if (channel === 'sms' && patient.phone) {
          await sendSMS(patient.phone, body)
          await logMessage({ patientId, clinicId, channel: 'sms', template: templateName, status: 'sent' })
        }
      } catch (err) {
        console.error(`sendMessage: ${channel} failed for patient ${patientId}:`, err.message)
        await logMessage({ patientId, clinicId, channel, template: templateName, status: 'failed', error: err.message })
      }
    }
  } catch (err) {
    console.error('sendMessage error:', err.message)
  }
}

module.exports = { sendMessage, sendEmail, renderTemplate }
