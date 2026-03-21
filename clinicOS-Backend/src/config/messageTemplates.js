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

  queue_paused: {
    subject: 'Queue update at {clinic_name}',
    body: `Hi {patient_name}, the queue at {clinic_name} has been temporarily paused.

Your token *T-{token_number}* (position #{queue_position}) has been held.
We will resume shortly and notify you.`,
  },

  queue_resumed: {
    subject: 'Queue resumed at {clinic_name}',
    body: `Hi {patient_name}, the queue at {clinic_name} has resumed!

Your updated estimated wait: ~{estimated_wait} minutes.
Token: *T-{token_number}* · Position: #{queue_position}`,
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
