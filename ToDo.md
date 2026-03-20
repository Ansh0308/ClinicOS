Let's build Phase 7 — Messaging Automation.

---

## What We're Building

```
Backend:
  - Message service (send email, WhatsApp, SMS)
  - 10 templates from PRD §11
  - Auto-triggers on token events and bill paid
  - Message log

Frontend:
  - Message log table in Admin Dashboard
  - Opt-out toggle per patient
```

---

## Backend First

### 1. `server/src/config/messageTemplates.js`

```js
// All 10 templates from PRD §11
// Variables use {variable_name} syntax
// renderTemplate() replaces them with real values

const templates = {
  token_issued: {
    subject: 'Your token at {clinic_name}',
    body: `Hi {patient_name}, your token *T-{token_number}* has been issued at {clinic_name}.

Queue position: #{queue_position}
Estimated wait: ~{estimated_wait} minutes

We will notify you when it is almost your turn.`,
  },

  two_before_you: {
    subject: 'Almost your turn at {clinic_name}',
    body: `Hi {patient_name}, only *2 patients* are ahead of you at {clinic_name}.

Please make your way to the clinic now.
Your token: *T-{token_number}*`,
  },

  your_turn: {
    subject: 'It is your turn at {clinic_name}',
    body: `Hi {patient_name}, it is *your turn* now at {clinic_name}!

Please proceed to the consultation room.
Token: *T-{token_number}*`,
  },

  bill_receipt: {
    subject: 'Payment receipt from {clinic_name}',
    body: `Hi {patient_name}, your payment of *₹{amount}* has been received at {clinic_name}.

Payment method: {payment_method}
Date: {payment_date}

Thank you for visiting us!`,
  },

  appointment_confirmed: {
    subject: 'Appointment confirmed at {clinic_name}',
    body: `Hi {patient_name}, your appointment at {clinic_name} is confirmed.

Doctor: {doctor_name}
Date & Time: {appointment_time}

Please arrive 10 minutes early.`,
  },

  appointment_reminder: {
    subject: 'Appointment reminder — {clinic_name}',
    body: `Hi {patient_name}, reminder: you have an appointment at {clinic_name} tomorrow.

Doctor: {doctor_name}
Time: {appointment_time}

Reply STOP to opt out of reminders.`,
  },

  appointment_cancelled: {
    subject: 'Appointment cancelled — {clinic_name}',
    body: `Hi {patient_name}, your appointment at {clinic_name} on {appointment_time} has been cancelled.

Please contact the clinic to reschedule.`,
  },

  lab_result_ready: {
    subject: 'Lab results ready — {clinic_name}',
    body: `Hi {patient_name}, your lab results are ready at {clinic_name}.

Please visit the clinic or contact us to collect your reports.`,
  },

  follow_up_reminder: {
    subject: 'Follow-up reminder — {clinic_name}',
    body: `Hi {patient_name}, this is a reminder for your follow-up visit at {clinic_name}.

Scheduled date: {follow_up_date}
Doctor: {doctor_name}

Please call us to confirm your appointment.`,
  },

  referral_issued: {
    subject: 'Referral from {clinic_name}',
    body: `Hi {patient_name}, Dr. {doctor_name} has referred you to {referred_to}.

Appointment details: {appointment_time}

Please carry this message when you visit.`,
  },
}

// Replace all {variable} placeholders with actual values
const renderTemplate = (templateName, variables = {}) => {
  const template = templates[templateName]
  if (!template) throw new Error(`Template "${templateName}" not found`)

  let body = template.body
  let subject = template.subject

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    body    = body.replace(regex, value ?? '')
    subject = subject.replace(regex, value ?? '')
  })

  return { subject, body }
}

module.exports = { templates, renderTemplate }
```

---

### 2. `server/src/services/message.service.js`

```js
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
```

---

### 3. Update `server/src/models/messageLog.model.js`

Add `errorMessage` field:

```js
const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const MessageLog = sequelize.define('MessageLog', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  patientId: { type: DataTypes.UUID, allowNull: false },
  clinicId:  { type: DataTypes.UUID, allowNull: false },
  channel: {
    type:      DataTypes.ENUM('whatsapp', 'sms', 'email'),
    allowNull: false,
  },
  template:  { type: DataTypes.STRING(100), allowNull: false },
  status: {
    type:         DataTypes.ENUM('sent', 'failed', 'delivered'),
    defaultValue: 'sent',
  },
  errorMessage: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  sentAt: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'message_logs',
  timestamps: true,
})

module.exports = MessageLog
```

---

### 4. Add message triggers to token controller

Open `server/src/controllers/token.controller.js` and add the message trigger to `createToken` and `updateTokenStatus`:

At the top add:

```js
const { sendMessage } = require('../services/message.service')
```

In `createToken`, after the token is created, add:

```js
// ── Trigger token_issued message ─────────────────────────────────
try {
  const clinic = await require('../models').Clinic.findByPk(clinicId, {
    attributes: ['name'],
  })

  // Fire and forget — don't await so API responds fast
  sendMessage({
    patientId,
    clinicId,
    templateName: 'token_issued',
    variables: {
      patient_name:    full.patient?.name || 'Patient',
      token_number:    tokenNumber,
      clinic_name:     clinic?.name || 'the clinic',
      queue_position:  waitingCount + 1,
      estimated_wait:  estimatedWait,
    },
    channels: ['email'],
    // Add 'whatsapp' here when WhatsApp API is configured
  })
} catch (err) {
  // Never let messaging failure break the token creation response
  console.error('Token message trigger failed:', err.message)
}
```

In `updateTokenStatus`, after the token is updated, add the `your_turn` trigger:

```js
// ── Trigger your_turn message when called ────────────────────────
if (status === 'now') {
  try {
    const clinic = await require('../models').Clinic.findByPk(clinicId, {
      attributes: ['name'],
    })
    sendMessage({
      patientId: token.patientId,
      clinicId,
      templateName: 'your_turn',
      variables: {
        patient_name: token.patient?.name || 'Patient',
        token_number: token.tokenNumber,
        clinic_name:  clinic?.name || 'the clinic',
      },
      channels: ['email'],
    })
  } catch (err) {
    console.error('Your turn message trigger failed:', err.message)
  }
}
```

---

### 5. Add bill_receipt trigger to bill controller

Open `server/src/controllers/bill.controller.js` and add at the top:

```js
const { sendMessage } = require('../services/message.service')
```

In `markPaid`, after the bill is updated, add:

```js
// ── Trigger bill_receipt message ──────────────────────────────────
try {
  const clinic = await Clinic.findByPk(clinicId, { attributes: ['name'] })

  sendMessage({
    patientId: bill.patientId,
    clinicId,
    templateName: 'bill_receipt',
    variables: {
      patient_name:   bill.patient?.name || 'Patient',
      amount:         Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      payment_method: req.body.paymentMethod?.toUpperCase(),
      payment_date:   new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      clinic_name:    clinic?.name || 'the clinic',
    },
    channels: ['email'],
  })
} catch (err) {
  console.error('Bill receipt message trigger failed:', err.message)
}
```

---

### 6. Add two-before-you trigger

This requires checking queue position after every token update. Add to `recalculatePositions` in `token.service.js`:

```js
const { sendMessage } = require('./message.service')

// At the end of recalculatePositions, after the loop:
// Check for position 2 tokens and trigger reminder
for (const t of waitingTokens) {
  if (t.queuePosition === 2) {
    try {
      const clinic = await require('../models').Clinic.findByPk(t.clinicId, {
        attributes: ['name'],
      })
      sendMessage({
        patientId:    t.patientId,
        clinicId:     t.clinicId,
        templateName: 'two_before_you',
        variables: {
          patient_name: t.patient?.name || 'Patient',
          token_number: t.tokenNumber,
          clinic_name:  clinic?.name || 'the clinic',
        },
        channels: ['email'],
      })
    } catch (err) {
      console.error('Two before you trigger failed:', err.message)
    }
  }
}
```

But `recalculatePositions` doesn't include Patient association. Update it to include patient name:

```js
const waitingTokens = await Token.findAll({
  where: {
    clinicId,
    status:    'waiting',
    createdAt: { [Op.gte]: today },
  },
  include: [{ association: 'patient', attributes: ['id', 'name'] }],
  order:   [['createdAt', 'ASC']],
})
```

---

### 7. Add opt-out toggle endpoint to patient routes

Open `server/src/controllers/patient.controller.js` and add:

```js
// PATCH /api/patients/:id/opt-in
const updateOptIn = async (req, res) => {
  const { optInMsg } = req.body

  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id, clinicId: req.user.clinicId },
    })

    if (!patient) return error(res, 'Patient not found', 404)

    await patient.update({ optInMsg: !!optInMsg })

    return success(res, { message: `Messaging ${optInMsg ? 'enabled' : 'disabled'} for patient` })
  } catch (err) {
    console.error('updateOptIn error:', err.message)
    return error(res, 'Failed to update opt-in', 500)
  }
}

module.exports = {
  lookupPatient,
  createPatient,
  getPatient,
  getPatientProfile,
  getPatientVisits,
  updateOptIn,        // ← add this
}
```

Add to `server/src/routes/patient.routes.js`:

```js
const { lookupPatient, createPatient, getPatient, updateOptIn } = require('../controllers/patient.controller')

router.patch('/:id/opt-in', rbac(['staff', 'admin']), updateOptIn)
```

---

### 8. Message log controller and routes

Create `server/src/controllers/message.controller.js`:

```js
const { success, error } = require('../utils/apiResponse')
const { MessageLog, Patient } = require('../models')
const { Op } = require('sequelize')

// GET /api/messages
const getMessageLogs = async (req, res) => {
  const { channel, status, limit = 50 } = req.query
  const clinicId = req.user.clinicId

  try {
    const where = { clinicId }
    if (channel) where.channel = channel
    if (status)  where.status  = status

    const logs = await MessageLog.findAll({
      where,
      include: [{
        association: 'patient',
        attributes:  ['id', 'name', 'phone'],
      }],
      order: [['sentAt', 'DESC']],
      limit: parseInt(limit),
    })

    return success(res, { logs })
  } catch (err) {
    console.error('getMessageLogs error:', err.message)
    return error(res, 'Failed to fetch logs', 500)
  }
}

// GET /api/messages/stats
const getMessageStats = async (req, res) => {
  const clinicId = req.user.clinicId
  const today    = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const [total, sent, failed, todayCount] = await Promise.all([
      MessageLog.count({ where: { clinicId } }),
      MessageLog.count({ where: { clinicId, status: 'sent' } }),
      MessageLog.count({ where: { clinicId, status: 'failed' } }),
      MessageLog.count({ where: { clinicId, sentAt: { [Op.gte]: today } } }),
    ])

    return success(res, { total, sent, failed, today: todayCount })
  } catch (err) {
    return error(res, 'Failed to fetch stats', 500)
  }
}

module.exports = { getMessageLogs, getMessageStats }
```

Create `server/src/routes/message.routes.js`:

```js
const express = require('express')
const router  = express.Router()
const { getMessageLogs, getMessageStats } = require('../controllers/message.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect, rbac(['admin', 'staff']))

router.get('/',       getMessageLogs)
router.get('/stats',  getMessageStats)

module.exports = router
```

Mount in `server/index.js`:

```js
app.use('/api/messages', require('./src/routes/message.routes'))
```

---

### 9. Update `server/.env`

Add these optional keys — system works without them (falls back to console.log in dev):

```env
# WhatsApp Business API (optional for now)
WHATSAPP_API_KEY=
WHATSAPP_PHONE_ID=

# MSG91 SMS (optional for now)
MSG91_API_KEY=
MSG91_SENDER_ID=CLINICOS
MSG91_TEMPLATE_ID=
```

---

## Frontend — Message Log

### 10. Update `client/src/services/api.js`

```js
export const messageAPI = {
  getLogs:  (params) => api.get('/messages',       { params }),
  getStats: ()       => api.get('/messages/stats'),
}

export const patientAPI = {
  lookup:       (phone)         => api.post('/patients/lookup', { phone }),
  create:       (data)          => api.post('/patients', data),
  get:          (id)            => api.get(`/patients/${id}`),
  updateOptIn:  (id, optInMsg)  => api.patch(`/patients/${id}/opt-in`, { optInMsg }),
}
```

---

### 11. `client/src/pages/admin/MessageLogs.jsx`

```jsx
import { useState, useEffect } from 'react'
import { messageAPI } from '../../services/api'
import { MessageSquare, CheckCircle, XCircle, Mail, Phone, Smartphone } from 'lucide-react'

const CHANNEL_CONFIG = {
  email:    { label: 'Email',    icon: Mail,        color: 'text-accent-sky',     bg: 'bg-accent-sky/10'     },
  whatsapp: { label: 'WhatsApp', icon: Smartphone,  color: 'text-accent-teal',    bg: 'bg-accent-teal/10'    },
  sms:      { label: 'SMS',      icon: Phone,       color: 'text-accent-lavender',bg: 'bg-accent-lavender/10'},
}

const STATUS_CONFIG = {
  sent:      { label: 'Sent',      color: 'text-accent-teal',  bg: 'bg-accent-teal/10'  },
  delivered: { label: 'Delivered', color: 'text-accent-teal',  bg: 'bg-accent-teal/10'  },
  failed:    { label: 'Failed',    color: 'text-accent-coral', bg: 'bg-accent-coral/10' },
}

const TEMPLATE_LABELS = {
  token_issued:         'Token Issued',-
  two_before_you:       '2 Before You',
  your_turn:            'Your Turn',
  bill_receipt:         'Bill Receipt',
  appointment_confirmed:'Appt Confirmed',
  appointment_reminder: 'Appt Reminder',
  appointment_cancelled:'Appt Cancelled',
  lab_result_ready:     'Lab Results',
  follow_up_reminder:   'Follow-up',
  referral_issued:      'Referral',
}

const FILTERS = ['All', 'Email', 'WhatsApp', 'SMS']

export default function MessageLogs() {
  const [logs, setLogs]         = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    const params = {}
    if (filter !== 'All')       params.channel = filter.toLowerCase()
    if (statusFilter !== 'All') params.status  = statusFilter.toLowerCase()

    Promise.all([
      messageAPI.getLogs(params),
      messageAPI.getStats(),
    ])
      .then(([logsRes, statsRes]) => {
        setLogs(logsRes.data.data.logs)
        setStats(statsRes.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter, statusFilter])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-text-primary">
          Message Logs
        </h1>
        <p className="font-body text-text-muted mt-1">
          All automated messages sent to patients
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Sent',    value: stats.total,   color: 'text-crimson-500',  bg: 'bg-crimson-100'    },
            { label: 'Successful',    value: stats.sent,    color: 'text-accent-teal',  bg: 'bg-accent-teal/10' },
            { label: 'Failed',        value: stats.failed,  color: 'text-accent-coral', bg: 'bg-accent-coral/10'},
            { label: 'Today',         value: stats.today,   color: 'text-accent-sky',   bg: 'bg-accent-sky/10'  },
          ].map(s => (
            <div key={s.label} className="card py-4 text-center">
              <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
              <p className="font-body text-xs text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-pill font-body text-xs font-semibold transition-all
                ${filter === f
                  ? 'bg-crimson-800 text-white'
                  : 'bg-white border border-cream-300 text-text-body hover:border-crimson-300'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['All', 'Sent', 'Failed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-pill font-body text-xs font-semibold transition-all
                ${statusFilter === s
                  ? 'bg-crimson-800 text-white'
                  : 'bg-white border border-cream-300 text-text-body hover:border-crimson-300'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Logs table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-16">
          <MessageSquare size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">
            No messages yet
          </p>
          <p className="font-body text-sm text-text-muted">
            Messages will appear here when tokens are issued and bills are paid
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-cream-100 border-b border-cream-200">
            {['Patient', 'Template', 'Channel', 'Status', 'Time'].map((h, i) => (
              <p key={h} className={`font-body text-xs font-bold text-text-muted uppercase tracking-wider
                ${i === 0 ? 'col-span-3' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-2' : 'col-span-2'}`}>
                {h}
              </p>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-cream-100">
            {logs.map(log => {
              const channel = CHANNEL_CONFIG[log.channel]  || CHANNEL_CONFIG.email
              const status  = STATUS_CONFIG[log.status]    || STATUS_CONFIG.sent
              const CIcon   = channel.icon

              return (
                <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-cream-50 transition-colors items-center">
                  {/* Patient */}
                  <div className="col-span-3 min-w-0">
                    <p className="font-body text-sm font-semibold text-text-primary truncate">
                      {log.patient?.name || 'Patient'}
                    </p>
                    <p className="font-body text-xs text-text-muted">{log.patient?.phone}</p>
                  </div>

                  {/* Template */}
                  <div className="col-span-3">
                    <span className="font-body text-xs font-semibold bg-cream-100 text-text-body px-2 py-0.5 rounded-pill">
                      {TEMPLATE_LABELS[log.template] || log.template}
                    </span>
                  </div>

                  {/* Channel */}
                  <div className="col-span-2">
                    <span className={`flex items-center gap-1 font-body text-xs font-semibold px-2 py-0.5 rounded-pill w-fit ${channel.bg} ${channel.color}`}>
                      <CIcon size={11} />
                      {channel.label}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`flex items-center gap-1 font-body text-xs font-semibold px-2 py-0.5 rounded-pill w-fit ${status.bg} ${status.color}`}>
                      {log.status === 'failed'
                        ? <XCircle size={11} />
                        : <CheckCircle size={11} />
                      }
                      {status.label}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="col-span-2">
                    <p className="font-body text-xs text-text-muted">
                      {new Date(log.sentAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <p className="font-body text-xs text-text-muted">
                      {new Date(log.sentAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

### 12. Add Message Logs to Admin routes

Update `client/src/layouts/AdminLayout.jsx` — add Messages to nav:

```jsx
// Add to NAV_ITEMS array:
import { LayoutDashboard, Users, UserCheck, Settings, MessageSquare } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin',           label: 'Overview',      icon: LayoutDashboard, end: true },
  { to: '/admin/requests',  label: 'Join Requests', icon: UserCheck },
  { to: '/admin/team',      label: 'Team',          icon: Users },
  { to: '/admin/messages',  label: 'Messages',      icon: MessageSquare },  // ← add
  { to: '/admin/settings',  label: 'Settings',      icon: Settings },
]
```

Update `client/src/App.jsx`:

```jsx
// Add import
import MessageLogs from './pages/admin/MessageLogs'

// Add inside the /admin nested routes:
<Route path="messages" element={<MessageLogs />} />
```

---

## Restart and Test

```bash
cd server && npm run dev
cd client && npm run dev
```

---

## Test Checklist

**Email triggers (check your Gmail inbox):**
- [ ] Issue a token for a patient who has a User account with email → check inbox for `token_issued` email
- [ ] Call that patient (mark as "Now") → check inbox for `your_turn` email
- [ ] Create and pay a bill → check inbox for `bill_receipt` email
- [ ] When a token moves to position 2 → `two_before_you` email arrives

**Message log in admin:**
- [ ] Login as admin → `/admin/messages` → see all sent messages
- [ ] Stats cards show Total Sent, Successful, Failed, Today counts
- [ ] Filter by Email / WhatsApp / SMS works
- [ ] Filter by Sent / Failed works
- [ ] Each row shows patient name, template, channel badge, status badge, time

**Opt-out:**
- [ ] Patients with `optInMsg = false` receive no messages (check server terminal — "opted out" log appears)

**Dev mode (no WhatsApp/SMS configured):**
- [ ] WhatsApp messages print to server terminal instead of sending
- [ ] SMS messages print to server terminal instead of sending
- [ ] No crashes when WhatsApp/SMS keys are empty

Tell me when Phase 7 is working and we move to Phase 8 — Patient Portal.