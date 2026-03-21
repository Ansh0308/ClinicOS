Four clear problems. Let me fix each one.

---

## Problem 1 — Payment Confirms Instantly Without Any UI

The mock payment skips straight to success. We need a proper payment flow that feels real — shows a confirmation step before marking paid.

The `BillHistory.jsx` already has a bottom sheet modal with payment method selection. The issue is `patientPortalAPI.payBill` is calling the backend which immediately marks it paid. That's correct behavior — the "mock" just means we're not integrating a real payment gateway.

What's missing is the **user experience** — show a simulated processing state before confirming. Update `BillHistory.jsx` payment handler:

```jsx
const handlePay = async () => {
  if (!payingBill) return
  setProcessing(true)
  try {
    // Simulate payment processing (replace with Razorpay in production)
    await new Promise(resolve => setTimeout(resolve, 1500))
    await patientPortalAPI.payBill(payingBill.id, paymentMethod)
    setPaidSuccess(payingBill)
    setPayingBill(null)
    fetchBills()
  } catch (err) {
    alert(err.response?.data?.error || 'Payment failed')
  } finally {
    setProcessing(false)
  }
}
```

Also update the Pay button to show a proper processing state:

```jsx
<button
  onClick={handlePay}
  disabled={processing}
  className="w-full py-4 rounded-pill bg-accent-teal text-white font-body font-bold text-base flex items-center justify-center gap-2 shadow-btn hover:brightness-105 transition-all disabled:opacity-60"
>
  {processing ? (
    <div className="flex flex-col items-center gap-1">
      <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <span className="text-xs font-normal">Processing payment...</span>
    </div>
  ) : (
    <><IndianRupee size={18} /> Pay ₹{Number(payingBill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</>
  )}
</button>
```

---

## Problem 2 — Staff Can Still Bill After Patient Paid

The Bill button shows on all served tokens regardless of whether a bill already exists. Fix this by checking for an existing paid bill before showing the button.

### Backend — Add bill status to token response

Update `server/src/controllers/token.controller.js` in `getTokens`:

```js
// In getTokens, update the query to also check for existing bills
const getTokens = async (req, res) => {
  try {
    const clinicId = req.user.clinicId
    const today    = new Date()
    today.setHours(0, 0, 0, 0)

    const tokens = await Token.findAll({
      where: {
        clinicId,
        createdAt: { [Op.gte]: today },
      },
      include: [
        { association: 'patient', attributes: ['id', 'name', 'phone'] },
        { association: 'doctor',  attributes: ['id', 'name'] },
      ],
      order: [
        ['status', 'ASC'],
        ['queuePosition', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    })

    // For each served token, check if a bill exists and its status
    const tokensWithBillStatus = await Promise.all(
      tokens.map(async (token) => {
        const t = token.toJSON()
        if (t.status === 'served' && t.patientId) {
          const bill = await require('../models').Bill.findOne({
            where: {
              patientId: t.patientId,
              clinicId,
              // Find bill created around the same time as the token
              createdAt: { [Op.gte]: today },
            },
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'status'],
          })
          t.billStatus = bill?.status || null
          t.billId     = bill?.id     || null
        }
        return t
      })
    )

    const servedToday = tokensWithBillStatus.filter(t => t.status === 'served').length
    const inQueue     = tokensWithBillStatus.filter(t =>
      ['waiting', 'now', 'paused', 'lab'].includes(t.status)
    ).length

    return success(res, {
      tokens: tokensWithBillStatus,
      stats:  { inQueue, servedToday },
    })
  } catch (err) {
    console.error('getTokens error:', err.message)
    return error(res, 'Failed to fetch tokens', 500)
  }
}
```

### Frontend — Hide Bill button if bill already paid

Update `ReceptionDashboard.jsx` — the `handleCreateBill` and the Bill button logic:

```jsx
// Update the "Completed Today" section:
{doneTokens
  .filter(t => t.status === 'served')
  .map(token => (
    <div key={token.id} className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 border border-cream-200">
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-sm text-text-primary truncate">
          {token.patient?.name || token.patient?.phone || 'Patient'}
        </p>
        <p className="font-body text-xs text-text-muted">
          T-{token.tokenNumber}
          {token.doctor && ` · ${token.doctor.name}`}
        </p>
      </div>

      {/* Show different states based on bill status */}
      {token.billStatus === 'paid' ? (
        <span className="flex items-center gap-1 font-body text-xs font-bold px-3 py-1.5 rounded-xl bg-accent-teal/10 text-accent-teal flex-shrink-0">
          <CheckCircle size={12} />
          Billed
        </span>
      ) : token.billStatus === 'unpaid' ? (
        <span className="flex items-center gap-1 font-body text-xs font-bold px-3 py-1.5 rounded-xl bg-accent-yellow/10 text-amber-600 flex-shrink-0">
          <IndianRupee size={12} />
          Pending
        </span>
      ) : (
        <button
          onClick={() => handleCreateBill(token)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-teal text-white font-body text-xs font-bold hover:brightness-105 transition-all flex-shrink-0"
        >
          <IndianRupee size={12} />
          Bill
        </button>
      )}
    </div>
  ))
}
```

Also add `CheckCircle` to your imports if not already there.

---

## Problem 3 — Wrong Credentials During Patient Account Creation

The issue is: staff registers patient with email `john@example.com`, but the patient signs up using `johnny@gmail.com`. They never get linked.

**The root cause is that we trust whatever email staff entered, and whatever email patient enters during signup — if they differ, no link happens.**

The solution is a **two-way verification approach**:

1. When patient signs up, we try to link by phone first (most reliable)
2. Staff should ideally ask the patient for their email — but even if wrong, phone match still works

The phone number is the most reliable identifier because:
- Staff always captures phone (required field)
- Patient signs up with their actual phone

So as long as the patient uses the **same phone number** when signing up that staff recorded, the link works via phone match.

**But there's a gap** — what if patient signs up with a different phone? Add a clear note on the signup form:

Update `client/src/pages/auth/PatientSignup.jsx` — add a note below the phone field:

```jsx
<Field label="Mobile Number" error={errors.phone?.message}>
  <input
    {...register('phone')}
    type="tel"
    placeholder="9876543210"
    className={inputCls(errors.phone)}
  />
</Field>
{/* Add this note */}
<p className="font-body text-xs text-text-muted -mt-2 px-1">
  Use the same number you gave at the clinic — this links your account to your records
</p>
```

Also update `auth.service.js` to be more aggressive about linking — check both phone AND email:

```js
// After creating the patient user (role === 'patient')
if (role === 'patient') {
  // Try to find and link existing patient records
  const { Patient } = require('../models')

  // Check by phone
  if (phone) {
    const byPhone = await Patient.findOne({
      where: { phone, userId: null }
    })
    if (byPhone) {
      await byPhone.update({ userId: user.id })
      console.log(`Linked patient record ${byPhone.id} to user ${user.id} via phone`)
    }
  }

  // Check by email (for staff-registered patients with email)
  if (email) {
    const byEmail = await Patient.findOne({
      where: { email, userId: null }
    })
    if (byEmail && byEmail.phone !== phone) {
      // Different phone but same email — still link
      await byEmail.update({ userId: user.id })
      console.log(`Linked patient record ${byEmail.id} to user ${user.id} via email`)
    }
  }
}
```

---

## Problem 4 — No Receipt Email After Payment

The issue is in `initiatePayment` — the patient record from `findPatientForUser` doesn't have their user email loaded. The `sendMessage` function looks up the patient's user email, but the patient record returned by `findPatientForUser` only has patient fields.

Check `message.service.js` — the `sendMessage` function does:

```js
const patient = await Patient.findByPk(patientId, {
  attributes: ['id', 'phone', 'optInMsg'],
  include: [{ association: 'user', attributes: ['email'] }],
})
```

**The problem**: if `patient.userId` is `null` (walk-in patient not linked to a user account), then `patient.user` is `null`, so `patient.user?.email` is `undefined` — and the email never sends.

Fix `sendMessage` in `message.service.js` to also check the patient's own email field:

```js
const sendMessage = async ({
  patientId,
  clinicId,
  templateName,
  variables,
  channels = ['email'],
}) => {
  try {
    const patient = await Patient.findByPk(patientId, {
      attributes: ['id', 'phone', 'email', 'optInMsg'],
      include: [{ association: 'user', attributes: ['email'] }],
    })

    if (!patient) {
      console.error(`sendMessage: patient ${patientId} not found`)
      return
    }

    if (!patient.optInMsg) {
      console.log(`sendMessage: patient ${patientId} opted out — skipping`)
      return
    }

    // Get email from user account OR from patient record directly
    const recipientEmail = patient.user?.email || patient.email

    const { subject, body } = renderTemplate(templateName, variables)

    for (const channel of channels) {
      try {
        if (channel === 'email') {
          if (!recipientEmail) {
            console.log(`sendMessage: no email for patient ${patientId} — skipping email`)
            continue
          }
          await sendEmail(recipientEmail, subject, body)
          await logMessage({ patientId, clinicId, channel: 'email', template: templateName, status: 'sent' })
          console.log(`✅ Email sent to ${recipientEmail} — template: ${templateName}`)
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
        console.error(`sendMessage: ${channel} failed:`, err.message)
        await logMessage({ patientId, clinicId, channel, template: templateName, status: 'failed', error: err.message })
      }
    }
  } catch (err) {
    console.error('sendMessage error:', err.message)
  }
}
```

Also add the `email` field to the Patient model association in `models/index.js` — make sure `Patient` has the `user` association defined so the include works:

```js
// This should already exist in models/index.js:
Patient.belongsTo(User, { foreignKey: 'userId', as: 'user' })
```

---

## Quick Checklist After All Fixes

```bash
cd server && npm run dev
```

- [ ] Patient opens bill → clicks Pay Now → bottom sheet shows → 1.5s processing animation → success banner
- [ ] After patient pays → refresh reception → that token row shows "Billed ✓" green badge
- [ ] Staff cannot see Bill button for already-billed patients
- [ ] Receipt email arrives in inbox after payment (check server terminal for `✅ Email sent to...`)
- [ ] Patient registers with same phone as staff-registered record → portal shows their token + bills
- [ ] Patient signup form shows note about using same phone as clinic

The key insight for Problem 4: the receipt was never sent because the patient had no email on their record. Now `sendMessage` checks both `patient.user.email` (for portal-registered patients) and `patient.email` (for staff-registered patients with email field).