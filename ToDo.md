

## Task 1 — Rate Limiting (F25)

```
Install express-rate-limit in the server project.

Add rate limiting middleware to server/index.js with the following rules:

1. Global limiter: 200 requests per 15 minutes per IP on all routes.

2. Auth limiter (stricter): 10 requests per 15 minutes per IP, applied 
   only to all /api/auth/* routes. Error message: "Too many requests from 
   this IP, please try again after 15 minutes."

3. OTP limiter (strictest): 5 requests per 60 minutes per IP, applied 
   only to POST /api/auth/send-otp. Error message: "Too many OTP requests. 
   Please wait 1 hour before requesting another OTP."

4. Lookup limiter: 30 requests per 5 minutes per IP, applied only to 
   POST /api/patients/lookup.

All limiters should return JSON in the standard API response format:
{ success: false, error: "message" } with HTTP status 429.

Use the standardHeaders: true and legacyHeaders: false options.
Mount all limiters before routes in index.js.
```

---

## Task 2 — Brute-force OTP Lockout (F24)

```
In server/src/services/otp.service.js, add brute-force protection for 
OTP verification.

Create an in-memory Map called otpAttempts that tracks failed attempts 
per email: Map<email, { count: number, lockedUntil: Date | null }>.

Update the verifyOTP function with this logic:
- Before checking the OTP, look up the email in otpAttempts.
- If lockedUntil exists and is in the future, return false and throw an 
  error: "Too many failed attempts. Try again after {time}."
- If the OTP is WRONG, increment the attempt count for that email.
- If count reaches 5, set lockedUntil to 30 minutes from now.
- If the OTP is CORRECT, delete the entry from otpAttempts (reset counter).

Also add a cleanup: auto-delete entries from the Map every 2 hours to 
prevent memory growth.

In the verifyOTP controller (auth.controller.js), catch the lockout error 
and return it as a 429 response with the standard error format.

Also add login brute-force protection in auth.service.js loginUser:
- Track failed login attempts per email in a separate Map called 
  loginAttempts.
- After 5 failed password attempts, lock the account for 15 minutes.
- On successful login, reset the counter.
- Return a clear error message: "Account temporarily locked due to too 
  many failed attempts. Try again in {X} minutes."
```

---

## Task 3 — Audit Log Writes (F11)

```
The AuditLog model already exists in server/src/models with fields: 
id, userId, action, resourceType, resourceId, clinicId, timestamp, 
and an ipAddress field (add this if not present as DataTypes.STRING).

Create a new file server/src/services/audit.service.js with a single 
async function:

  logAudit({ userId, action, resourceType, resourceId, clinicId, ip })

This function should write to the AuditLog table. Wrap in try/catch — 
audit failures must NEVER crash the main request. Just console.error 
if logging fails.

Actions to use (define these as constants in the same file):
  ACTIONS = {
    USER_LOGIN, USER_LOGOUT, USER_REGISTER,
    OTP_SENT, OTP_VERIFIED, PASSWORD_RESET_REQUESTED, PASSWORD_RESET_DONE,
    TOKEN_CREATED, TOKEN_STATUS_CHANGED, TOKEN_CANCELLED, TOKEN_EMERGENCY,
    QUEUE_PAUSED, QUEUE_RESUMED,
    VISIT_CREATED, VISIT_UPDATED, VISIT_COMPLETED,
    BILL_CREATED, BILL_PAID,
    JOIN_REQUEST_APPROVED, JOIN_REQUEST_REJECTED,
    MEMBER_SUSPENDED, MEMBER_REACTIVATED,
    CLINIC_UPDATED, PATIENT_CREATED, PATIENT_OPTED_OUT,
  }

Now add logAudit() calls (fire-and-forget — do NOT await, use .catch()) 
in these controllers:

auth.controller.js:
  - login success → USER_LOGIN, resourceType: 'user', resourceId: user.id
  - register success → USER_REGISTER
  - forgotPassword → PASSWORD_RESET_REQUESTED
  - resetPassword success → PASSWORD_RESET_DONE

token.controller.js:
  - createToken → TOKEN_CREATED, resourceId: token.id
  - updateTokenStatus → TOKEN_STATUS_CHANGED, resourceId: token.id
  - deleteToken → TOKEN_CANCELLED
  - createEmergencyToken → TOKEN_EMERGENCY
  - pauseQueue → QUEUE_PAUSED
  - resumeQueue → QUEUE_RESUMED

visit.controller.js:
  - createVisit → VISIT_CREATED
  - completeVisit → VISIT_COMPLETED

bill.controller.js:
  - createBill → BILL_CREATED
  - markPaid → BILL_PAID

clinic.controller.js:
  - reviewRequest (approve) → JOIN_REQUEST_APPROVED
  - reviewRequest (reject) → JOIN_REQUEST_REJECTED
  - updateMember (suspend) → MEMBER_SUSPENDED
  - updateMember (reactivate) → MEMBER_REACTIVATED
  - updateClinicDetails → CLINIC_UPDATED

patient.controller.js:
  - createPatient → PATIENT_CREATED

To get the IP address in each controller, pass req.ip. The userId comes 
from req.userId (set by auth middleware). The clinicId comes from 
req.user.clinicId.
```

---

## Task 4 — Audit Log Admin Page (A-6)

```
Backend:

Create server/src/controllers/audit.controller.js with one function:
  getAuditLogs(req, res)
  
  Query the AuditLog table for the current clinicId.
  Support these query params: action, resourceType, userId, 
  startDate, endDate, limit (default 100, max 500), page (default 1).
  Include: association 'user' with attributes ['id', 'name', 'email', 'role'].
  Order by timestamp DESC.
  Return: { logs, total, page, totalPages }

Create server/src/routes/audit.routes.js:
  GET /api/admin/audit → getAuditLogs
  Protected by protect + rbac(['admin'])
  Mount in index.js as app.use('/api/admin', require('./src/routes/audit.routes'))
  (Note: clinic.routes already uses /api/admin — add audit routes to the 
  SAME clinic.routes.js file, not a separate mount)

Actually: add the route directly inside clinic.routes.js:
  router.get('/audit', getAuditLogs) — with the existing admin rbac

Add to client/src/services/api.js:
  export const auditAPI = {
    getLogs: (params) => api.get('/admin/audit', { params }),
  }

Frontend:

Create client/src/pages/admin/AuditLogs.jsx

The page should have:
- Page title "Audit Logs" with subtitle "Complete action history for your clinic"
- Filter bar with: Action dropdown (all the ACTIONS constants as options), 
  Resource Type dropdown, Date range (start + end date pickers), 
  a Search/Apply button, and a "Export CSV" button
- A table with columns: Timestamp, User (name + role badge), 
  Action (colour-coded badge), Resource Type, Resource ID (truncated UUID), 
  IP Address
- Pagination (Prev / Page X of Y / Next)
- Loading skeleton (3 rows animate-pulse)
- Empty state if no logs
- Action badges should be colour coded:
    Login/Register → accent-sky
    Token actions → crimson-500
    Visit actions → accent-teal
    Bill actions → accent-yellow
    Queue actions → accent-lavender
    Admin actions → accent-peach

Add to AdminLayout.jsx NAV_ITEMS:
  { to: '/admin/audit', label: 'Audit Logs', icon: Shield }

Add to App.jsx inside /admin nested routes:
  <Route path="audit" element={<AuditLogs />} />
```

---

## Task 5 — Patient Detail Page for Staff (ST-2)

```
Backend:

In server/src/controllers/patient.controller.js add a new function:
  getPatientDetail(req, res)
  
  Accepts patient ID from req.params.id.
  Must verify patient belongs to req.user.clinicId.
  Returns:
    - Full patient record (id, name, phone, email, dob, gender, optInMsg, createdAt)
    - visitCount (total completed visits)
    - lastVisit (most recent visit date + complaint + doctor name)
    - outstandingBalance (sum of total from unpaid bills)
    - last5Visits (last 5 complete visits with: date, complaint, complaintTags, 
      diagnosis, prescriptions, testsOrdered, followUpDate, doctor name)
    - last5Bills (last 5 bills with: date, total, status, paymentMethod, items)
    - activeToken (today's active token if any: tokenNumber, status, queuePosition)

Add route in patient.routes.js:
  GET /api/patients/:id/detail → getPatientDetail
  rbac(['staff', 'admin', 'doctor'])

Add to patientAPI in api.js:
  getDetail: (id) => api.get(`/patients/${id}/detail`)

Frontend:

Create client/src/pages/reception/PatientDetail.jsx

This page is accessed at /staff/patient/:patientId.
It receives patient data either from React Router location.state 
(for fast navigation from reception) or fetches via API if no state.

Layout — two column on desktop, stacked on mobile:

LEFT COLUMN (1/3 width):
  Patient card:
    - Large avatar circle with first letter of name
    - Name, phone, email
    - Gender, DOB (calculate age), optInMsg toggle (calls PATCH /api/patients/:id/opt-in)
    - Stats row: Total Visits | Outstanding Balance (red if > 0) | Member Since
    - Active token card (if any): token number + status badge + queue position
    - "Issue New Token" button → navigates to /reception with phone pre-filled

RIGHT COLUMN (2/3 width):
  Tabs: "Visit History" | "Bills"

  Visit History tab:
    - Accordion list of last5Visits
    - Each item: date + doctor name in header
    - Expanded: complaint, complaint tags, diagnosis, prescriptions table, 
      tests ordered chips, follow-up date
    - "View All Visits" link at bottom

  Bills tab:
    - List of last5Bills with: date, items summary, total, status badge
    - If status is unpaid → show "Create Bill" button linking to /billing/:patientId
    - "View All Bills" link at bottom

Add to App.jsx:
  import PatientDetail from './pages/reception/PatientDetail'
  
  <Route path="/staff/patient/:patientId" element={
    <ProtectedRoute allowedRoles={['staff', 'admin', 'doctor']}>
      <PatientDetail />
    </ProtectedRoute>
  } />

In ReceptionDashboard.jsx — update the patient found card to add a 
"View Full Profile" button alongside Issue Token. It should navigate to 
/staff/patient/:patientId passing the patient object as location.state.

Also in the Completed Today section — add a small "Profile" icon button 
on each served token row that links to /staff/patient/:token.patient.id.
```

---

## Task 6 — Admin Integrations Settings (A-5)

```
The goal is to move all third-party API keys OUT of .env hardcoding and 
into a database table that admin can edit via the UI.

Backend:

Create a new Sequelize model server/src/models/clinicSettings.model.js:
  Fields: id (UUID), clinicId (UUID), settingKey (STRING), 
  settingValue (TEXT, allowNull), isSecret (BOOLEAN default false),
  updatedAt (auto)
  Unique constraint on [clinicId, settingKey]
  tableName: 'clinic_settings'

The settingKeys to support:
  whatsapp_api_key, whatsapp_phone_id,
  msg91_api_key, msg91_sender_id, msg91_template_id,
  smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
  razorpay_key_id, razorpay_key_secret,
  gst_rate (default "18"), 
  clinic_timezone (default "Asia/Kolkata"),
  token_prefix (default "T"),
  working_hours_start (default "09:00"),
  working_hours_end (default "20:00"),
  avg_consult_mins (default "10")

Add to models/index.js:
  const ClinicSettings = require('./clinicSettings.model')
  Clinic.hasMany(ClinicSettings, { foreignKey: 'clinicId', as: 'settings' })

Create server/src/controllers/settings.controller.js:

  getSettings(req, res):
    Fetch all settings for clinicId.
    For rows where isSecret=true, return value as "••••••••" if set, 
    or empty string if not set. Never return actual secret values.
    Also return .env fallback values for keys not yet in DB 
    (so the form shows current config).
    Return as a flat object: { whatsapp_api_key: "••••••••", gst_rate: "18", ... }

  updateSettings(req, res):
    Accepts a flat object of key:value pairs.
    For each key, upsert into clinic_settings.
    Mark these keys as isSecret=true: 
      whatsapp_api_key, msg91_api_key, smtp_pass, razorpay_key_secret, 
      razorpay_key_id, smtp_user.
    After saving, update the in-memory config so message.service.js uses 
    the new values immediately (without server restart).
    
    Create a helper getClinicSetting(clinicId, key) that:
      1. Checks clinic_settings table first
      2. Falls back to process.env value
    
    Update message.service.js to use getClinicSetting(clinicId, key) 
    instead of process.env directly for all API keys.

Add routes in clinic.routes.js (admin only):
  router.get('/settings/integrations', getSettings)
  router.patch('/settings/integrations', updateSettings)

Update client/src/services/api.js:
  Add to adminAPI:
    getIntegrations: () => api.get('/admin/settings/integrations'),
    updateIntegrations: (data) => api.patch('/admin/settings/integrations', data),

Frontend:

Create client/src/pages/admin/IntegrationSettings.jsx

The page has tabbed sections (use button tabs, not browser tabs):

Tab 1 — Messaging:
  WhatsApp Business API section:
    - WhatsApp API Key (password input with show/hide toggle)
    - WhatsApp Phone ID
    - Status badge: "Connected" (green) if key is set, "Not configured" (grey)
    - Help text: "Get these from Meta Business Suite → WhatsApp → API Setup"
  
  SMS — MSG91 section:
    - API Key (secret), Sender ID, Template ID
    - Status badge same pattern
    - Help text: "Register at msg91.com to get these credentials"
  
  Email / SMTP section:
    - SMTP Host, SMTP Port, SMTP User (secret), SMTP Password (secret), From Address
    - "Test Email" button → POST /api/admin/settings/test-email 
      (add this endpoint that sends a test email to the admin's own email)
    - Status badge

Tab 2 — Payments:
  Razorpay section:
    - Key ID (secret), Key Secret (secret)
    - Status badge
    - Note: "Currently using mock payment. Add keys to enable live Razorpay."
    - Help text: "Get from Razorpay Dashboard → Settings → API Keys"

Tab 3 — Clinic Config:
  - GST Rate (%) — number input, default 18
  - Clinic Timezone — dropdown of Indian timezones
  - Token Prefix — text input, default "T" (shows preview: T-1, T-2...)
  - Working Hours Start / End — time pickers
  - Average Consult Time (minutes) — number input, used for ETA calculation

Each tab has a "Save Changes" button that only saves that tab's settings.
Show a "Saved ✓" success state for 3 seconds after save.
Secret fields show "••••••••" as placeholder when a value is already set 
but not being edited. Show a small "Click to change" hint.

Replace the existing ClinicSettings.jsx in the admin dashboard 
(the one with clinic name/address/phone) — KEEP that page as is but 
rename it to "Clinic Profile" and update AdminLayout nav label accordingly. 
The new IntegrationSettings page is separate.

Add to AdminLayout.jsx NAV_ITEMS:
  { to: '/admin/integrations', label: 'Integrations', icon: Settings2 }

Add to App.jsx inside /admin nested routes:
  import IntegrationSettings from './pages/admin/IntegrationSettings'
  <Route path="integrations" element={<IntegrationSettings />} />
