# ClinicOS — Complete Project Checklist
> **Stack:** React.js · Vite · Tailwind CSS v3 · Node.js · Express · Sequelize · MySQL · JWT · Nodemailer
> **Pattern:** Frontend + Backend built page by page, feature by feature
> **ORM:** Sequelize model-first — define model → `sync()` → table auto-created, no SQL needed

---

## How to Read This List

- 🖥️ **Frontend** — React/Vite task
- ⚙️ **Backend** — Node/Express task
- 🗄️ **Database** — Sequelize model or query
- 📦 **Install** — new library needed
- ✅ Already done

---

## Phase 0 — Project Foundation
> **Goal:** Both servers running, DB connected, tables created, axios talking to express

### 0.1 Folder Structure
- [ ] 🖥️ Move existing Vite project into `clinicos/client/`
- [ ] ⚙️ Create `clinicos/server/` folder
- [ ] ⚙️ Create folder tree inside server: `src/config` `src/controllers` `src/models` `src/routes` `src/services` `src/middleware` `src/utils`
- [ ] ⚙️ Create `server/index.js` as entry point
- [ ] Create root `.gitignore` — covers `node_modules/`, `.env`, `dist/`
- [ ] `git init` at root level, first commit

### 0.2 Backend — Install & Bootstrap
📦 **Install:** `express` `sequelize` `mysql2` `dotenv` `cors` `bcryptjs` `jsonwebtoken` `nodemailer` `nodemon`

- [ ] ⚙️ `npm init -y` inside `server/`
- [ ] ⚙️ Install all backend packages above
- [ ] ⚙️ Add scripts to `package.json`: `"dev": "nodemon index.js"` `"start": "node index.js"`
- [ ] ⚙️ Create `server/.env` — fill in DB creds, JWT secret, mail config
- [ ] ⚙️ `src/config/database.js` — Sequelize instance connecting to MySQL
- [ ] ⚙️ `src/config/mailer.js` — Nodemailer transporter (Gmail SMTP)
- [ ] ⚙️ `src/utils/apiResponse.js` — helper: `success(res, data)` and `error(res, message, code)`
- [ ] ⚙️ `src/utils/generateCode.js` — generates `CLIN-XXXX` unique clinic code
- [ ] ⚙️ `src/utils/generateToken.js` — signs and returns JWT from userId
- [ ] ⚙️ `src/middleware/error.middleware.js` — global Express error handler
- [ ] ⚙️ `src/middleware/auth.middleware.js` — verifies JWT, attaches `req.user`
- [ ] ⚙️ `src/middleware/rbac.middleware.js` — checks `req.user.role` against allowed roles
- [ ] ⚙️ `index.js` — sets up Express, CORS, JSON parsing, mounts routes, calls `sequelize.sync()`
- [ ] ⚙️ `GET /api/health` route — returns `{ status: "ok" }`
- [ ] ✅ Test: visit `http://localhost:5000/api/health` in browser

### 0.3 Database — Sequelize Models
> Define model → restart server → Sequelize creates the MySQL table automatically via `sync({ alter: true })`

📦 **Already installed:** `sequelize` `mysql2`

- [ ] 🗄️ `src/models/user.model.js`
  ```
  Fields: id (UUID), name, email, passwordHash, phone,
  role ENUM[patient,admin,doctor,staff],
  status ENUM[pending,approved,rejected,suspended],
  clinicId (FK), emailVerified BOOLEAN
  ```
- [ ] 🗄️ `src/models/clinic.model.js`
  ```
  Fields: id (UUID), name, address, phone, specialty,
  clinicCode (unique), adminId (FK to users)
  ```
- [ ] 🗄️ `src/models/otpCode.model.js`
  ```
  Fields: id, email, code (6 chars), expiresAt, used BOOLEAN
  ```
- [ ] 🗄️ `src/models/joinRequest.model.js`
  ```
  Fields: id, userId (FK), clinicId (FK),
  status ENUM[pending,approved,rejected],
  reviewedBy (FK to users), reviewedAt
  ```
- [ ] 🗄️ `src/models/patient.model.js`
  ```
  Fields: id, userId (FK nullable), clinicId (FK),
  phone, name, dob, gender, optInMsg BOOLEAN
  Unique: (phone + clinicId)
  ```
- [ ] 🗄️ `src/models/token.model.js`
  ```
  Fields: id, clinicId (FK), doctorId (FK), patientId (FK),
  tokenNumber INT, status ENUM[waiting,now,paused,lab,served,cancelled],
  queuePosition INT, estimatedWait INT,
  issuedAt, calledAt, servedAt
  ```
- [ ] 🗄️ `src/models/visit.model.js`
  ```
  Fields: id, patientId (FK), doctorId (FK), clinicId (FK),
  complaint TEXT, complaintTags JSON, diagnosis TEXT,
  notes TEXT, prescriptions JSON, testsOrdered JSON,
  followUpDate DATE
  ```
- [ ] 🗄️ `src/models/bill.model.js`
  ```
  Fields: id, visitId (FK nullable), patientId (FK), clinicId (FK),
  items JSON, subtotal, tax, total,
  status ENUM[unpaid,paid,cancelled],
  paymentMethod ENUM[cash,upi,card], paidAt
  ```
- [ ] 🗄️ `src/models/messageLog.model.js`
  ```
  Fields: id, patientId (FK), clinicId (FK),
  channel ENUM[whatsapp,sms,email],
  template VARCHAR, status ENUM[sent,failed,delivered],
  sentAt
  ```
- [ ] 🗄️ `src/models/auditLog.model.js`
  ```
  Fields: id, userId (FK), clinicId (FK),
  action VARCHAR, entity VARCHAR, entityId,
  meta JSON, createdAt
  ```
- [ ] 🗄️ `src/models/index.js` — imports all models, defines all associations, exports them
  ```
  Associations to define:
  User belongsTo Clinic
  Clinic hasMany Users
  Clinic hasMany Patients
  Patient hasMany Tokens
  Patient hasMany Visits
  Patient hasMany Bills
  Token belongsTo Patient
  Token belongsTo User (as doctor)
  Visit belongsTo Patient
  Visit belongsTo User (as doctor)
  Bill belongsTo Patient
  Bill belongsTo Visit
  JoinRequest belongsTo User
  JoinRequest belongsTo Clinic
  ```
- [ ] ⚙️ Import `models/index.js` in `index.js` and call `sequelize.sync({ alter: true })`
- [ ] ✅ Test: restart server → check MySQL → all 10 tables created

### 0.4 Frontend — Install & Bootstrap
📦 **Install:** `react-router-dom` `axios` `react-hook-form` `zod` `@hookform/resolvers` `lucide-react`

- [ ] 🖥️ Install all frontend packages above
- [ ] ✅ Confirm `tailwind.config.js` has all design tokens (crimson, cream, accent colors, fonts, radius, shadows)
- [ ] ✅ Confirm `src/index.css` has `.btn-primary` `.btn-cta` `.btn-ghost` `.card` `.nav-gradient` `.hero-glow` `.section-container`
- [ ] ✅ Confirm Google Fonts (Fredoka + DM Sans) in `index.html`
- [ ] 🖥️ `src/services/api.js` — Axios instance with baseURL, JWT request interceptor, 401 auto-logout interceptor
- [ ] 🖥️ `src/context/AuthContext.jsx` — user state, `login(user, token)`, `logout()`, localStorage read/write, `GET /api/auth/me` on app load to restore session
- [ ] 🖥️ Update `main.jsx` — wrap app in `<AuthProvider>`
- [ ] 🖥️ `src/components/layout/ProtectedRoute.jsx` — checks `user` exists + role allowed, else redirects
- [ ] 🖥️ `src/App.jsx` — BrowserRouter + all routes stubbed (empty placeholder pages for now)
- [ ] ✅ Test: `npm run dev` in client → homepage loads, no console errors

---

## Phase 1 — Public Website
> ✅ Already built. Small updates only.

📦 **No new installs needed**

- [x] 🖥️ Navbar — public version (gradient pill, links)
- [x] 🖥️ HomePage — Hero, Stats, Features, How it Works, CTA
- [x] 🖥️ Footer
- [ ] 🖥️ Navbar — update "Sign In" button: `<Link to="/login">`
- [ ] 🖥️ Navbar — update "Get Started" button: `<Link to="/signup">`
- [ ] 🖥️ Navbar — logged-in state: show `user.name` + role badge chip + sign out dropdown
- [ ] 🖥️ Navbar — sign out: call `logout()` from AuthContext → redirect to `/`

---

## Phase 2 — Authentication
> **Goal:** All 4 signup flows working end-to-end with real email OTP

### 2.1 Backend — Auth Controller & Routes
📦 **Already installed:** `bcryptjs` `jsonwebtoken` `nodemailer`

- [ ] ⚙️ `src/services/otp.service.js`
  - `generateOTP()` — 6-digit random number
  - `saveOTP(email, code)` — delete old codes for email, insert new with 10min expiry
  - `verifyOTP(email, code)` — check DB, mark used, return true/false
  - `sendOTPEmail(email, otp)` — send branded HTML email via mailer
- [ ] ⚙️ `src/services/auth.service.js`
  - `registerUser(data)` — hash password, create User, handle role-specific logic
  - `loginUser(email, password)` — find user, bcrypt compare, return user + token
  - `createClinic(adminId, clinicData)` — create Clinic record, generate unique clinic code, link to admin
  - `createJoinRequest(userId, clinicCode)` — find clinic by code, insert JoinRequest
- [ ] ⚙️ `src/controllers/auth.controller.js`
  - `sendOTP(req, res)` — validate email → call otp.service.sendOTP
  - `verifyOTP(req, res)` — validate code → call otp.service.verifyOTP
  - `register(req, res)` — call auth.service.registerUser → return JWT + user
  - `login(req, res)` — call auth.service.loginUser → return JWT + user
  - `getMe(req, res)` — return `req.user` (set by auth middleware) + clinic info
- [ ] ⚙️ `src/routes/auth.routes.js`
  ```
  POST /api/auth/send-otp
  POST /api/auth/verify-otp
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me          ← protected (auth middleware)
  ```
- [ ] ⚙️ Mount auth routes in `index.js`: `app.use('/api/auth', authRoutes)`
- [ ] ✅ Test with Postman/Thunder Client: send-otp → check email inbox → verify-otp → register → login → getMe

### 2.2 Frontend — Shared Auth Components
📦 **No new installs**

- [ ] 🖥️ `src/components/auth/SignupLayout.jsx` — centered card, ClinicOS logo top, back arrow, children slot
- [ ] 🖥️ `src/components/auth/StepIndicator.jsx` — receives `steps[]` and `currentStep`, renders dot progress bar
- [ ] 🖥️ `src/components/auth/OTPInput.jsx`
  - Six individual single-character inputs
  - Auto-advance to next box on type
  - Backspace goes to previous box
  - Paste fills all 6 boxes at once
  - Calls `onChange(fullCode)` when all 6 filled
- [ ] 🖥️ `src/pages/auth/OTPVerification.jsx`
  - Receives `email` and `onVerified` callback via router state
  - Shows masked email, OTP input, resend button
  - Resend button: disabled + 60-second countdown after first send
  - Wrong code: red border + "Invalid or expired code" message
  - Calls `POST /api/auth/verify-otp` → on success calls `onVerified()`

### 2.3 Role Selector `/signup`
- [ ] 🖥️ `src/pages/auth/RoleSelector.jsx`
  - 4 large clickable cards in a 2×2 grid
  - Each card: big emoji icon, role name, one-line description, what you can do
  - Patient card: "Book appointments, track your queue, view prescriptions"
  - Admin card: "Register your clinic, manage your team"
  - Doctor card: "View your queue, record consultations"
  - Staff card: "Register patients, manage queue, create bills"
  - Click → navigate to `/signup/patient` `/signup/admin` `/signup/doctor` `/signup/staff`
  - Already logged in → redirect to their dashboard (check in useEffect)

### 2.4 Patient Signup `/signup/patient`
- [ ] 🖥️ `src/pages/auth/PatientSignup.jsx`
  - **Step 1 — Form:** name, email, phone, password, confirm password
  - Zod schema: email valid, phone 10 digits, password min 8, passwords match
  - Submit → `POST /api/auth/send-otp` → navigate to OTP step
  - **Step 2 — OTP:** use `OTPVerification` component
  - OTP verified → `POST /api/auth/register` with `role: patient`
  - On success: `login(user, token)` from AuthContext → redirect `/patient`
  - Loading spinner on every button
  - API error shown as red alert below form

### 2.5 Admin Signup `/signup/admin`
- [ ] 🖥️ `src/pages/auth/AdminSignup.jsx`
  - **Step 1 — Personal Info:** name, email, phone, password, confirm password
  - Submit → `POST /api/auth/send-otp` → go to Step 2
  - **Step 2 — OTP:** verify email
  - **Step 3 — Clinic Info:** clinic name, address, clinic phone, specialty (free text)
  - Submit Step 3 → `POST /api/auth/register` with `role: admin` + `clinicData: {}`
  - On success: `login(user, token)` → redirect `/admin`
  - StepIndicator shows: Personal Info → Verify Email → Clinic Details
  - After redirect: clinic code shown in a yellow banner "Share this code with your team: CLIN-XXXX"

### 2.6 Doctor Signup `/signup/doctor`
- [ ] 🖥️ `src/pages/auth/DoctorSignup.jsx`
  - **Step 1 — Form:** name, email, phone, password, qualification (text)
  - Submit → `POST /api/auth/send-otp` → OTP step
  - **Step 2 — OTP:** verify email
  - **Step 3 — Clinic Code:** single large input styled for `CLIN-XXXX` format
  - Validate: must match pattern `CLIN-` + 4 alphanumeric chars
  - Submit → `POST /api/auth/register` with `role: doctor` + `clinicCode`
  - On success: `login(user, token)` → redirect `/pending`
  - Invalid clinic code → show "No clinic found. Check the code with your admin."

### 2.7 Staff Signup `/signup/staff`
- [ ] 🖥️ `src/pages/auth/StaffSignup.jsx`
  - Same flow as Doctor Signup
  - **Step 1 fields:** name, email, phone, password, designation (text, e.g. "Head Receptionist")
  - role = staff throughout

### 2.8 Pending Approval Screen `/pending`
- [ ] 🖥️ `src/pages/auth/PendingApproval.jsx`
  - Protected: only doctor/staff with status=pending
  - Shows: role, clinic name, date request submitted, "Under Review" badge
  - Friendly message explaining the process
  - Polls `GET /api/auth/me` every 30 seconds
  - On status=approved → auto-redirect to their dashboard (no page refresh needed)
  - On status=rejected → show rejection screen: "Not approved. Contact clinic admin."
  - Sign out button always visible

### 2.9 Login Page `/login`
- [ ] 🖥️ `src/pages/auth/LoginPage.jsx`
  - Email + password fields only (no role picker — role detected from account)
  - Zod: valid email, password min 6 chars
  - Submit → `POST /api/auth/login`
  - Success → role-based redirect:
    ```
    patient → /patient
    admin   → /admin
    doctor  → /doctor  (if approved) or /pending (if pending)
    staff   → /reception (if approved) or /pending (if pending)
    ```
  - Wrong credentials → "Invalid email or password"
  - Rejected account → "Your registration was not approved. Contact your clinic admin."
  - Link: "New to ClinicOS? → /signup"
  - Link: "Forgot password?" (placeholder for now)

### 2.10 Update App.jsx Routes
- [ ] 🖥️ Add all Phase 2 routes to `App.jsx`:
  ```
  /signup                  → RoleSelector
  /signup/patient          → PatientSignup
  /signup/admin            → AdminSignup
  /signup/doctor           → DoctorSignup
  /signup/staff            → StaffSignup
  /login                   → LoginPage
  /pending                 → PendingApproval (protected: doctor/staff)
  /unauthorized            → UnauthorizedPage
  ```
- [ ] ✅ Test full flow: signup as patient → OTP email arrives → verify → redirected to /patient
- [ ] ✅ Test: signup as admin → clinic created → CLIN-XXXX shown
- [ ] ✅ Test: signup as doctor with CLIN-XXXX → redirected to /pending
- [ ] ✅ Test: login with each role → correct dashboard

---

## Phase 3 — Admin Dashboard `/admin`
> **Goal:** Admin can see pending requests and approve/reject doctor and staff

### 3.1 Backend — Admin Routes
📦 **No new installs**

- [ ] ⚙️ `src/controllers/clinic.controller.js`
  - `getStats(req, res)` — count doctors, staff, patients today, revenue today
  - `getJoinRequests(req, res)` — all pending JoinRequests for this clinic (with user details)
  - `reviewRequest(req, res)` — approve: set user.status=approved + user.clinicId; reject: set status=rejected
  - `getTeam(req, res)` — all approved doctors + staff for clinic
  - `updateMember(req, res)` — suspend or reactivate a team member
  - `getClinicDetails(req, res)` — return clinic record
  - `updateClinicDetails(req, res)` — update name, address, phone, specialty
- [ ] ⚙️ `src/routes/clinic.routes.js`
  ```
  GET   /api/admin/stats                  ← admin only
  GET   /api/admin/join-requests          ← admin only
  PATCH /api/admin/join-requests/:id      ← admin only
  GET   /api/admin/team                   ← admin only
  PATCH /api/admin/team/:id               ← admin only
  GET   /api/admin/clinic                 ← admin only
  PATCH /api/admin/clinic                 ← admin only
  ```
- [ ] ⚙️ Apply `auth.middleware` + `rbac.middleware(['admin'])` to all admin routes
- [ ] ⚙️ Mount in `index.js`: `app.use('/api/admin', clinicRoutes)`

### 3.2 Frontend — Admin Layout
📦 **No new installs**

- [ ] 🖥️ `src/layouts/AdminLayout.jsx`
  - Left sidebar (desktop) + bottom drawer (mobile)
  - Sidebar links: Overview, Join Requests (with pending count badge), Team, Settings
  - Topbar: ClinicOS logo, clinic name, `CLIN-XXXX` chip with copy button, admin name, sign out
  - Active link highlighted
  - `<Outlet />` for page content (React Router nested routes)
- [ ] 🖥️ Update `App.jsx` — nest admin pages under `AdminLayout`:
  ```
  /admin                   → AdminOverview
  /admin/requests          → JoinRequests
  /admin/team              → TeamManagement
  /admin/settings          → ClinicSettings
  ```

### 3.3 Frontend — Admin Pages
- [ ] 🖥️ `src/pages/admin/AdminOverview.jsx`
  - 4 stat cards: total doctors, total staff, patients today, revenue today
  - Fetch from `GET /api/admin/stats`
  - Loading skeleton while fetching

- [ ] 🖥️ `src/pages/admin/JoinRequests.jsx`
  - List of pending requests: avatar initial, name, role badge, email, phone, requested date
  - Approve button (teal) + Reject button (coral) per row
  - Confirmation dialog: "Approve Dr. Ananya as Doctor?" with confirm/cancel
  - After action: row updates with approved/rejected badge (no full page reload)
  - Empty state: illustration + "No pending join requests"
  - Pending count badge in sidebar auto-updates

- [ ] 🖥️ `src/pages/admin/TeamManagement.jsx`
  - Table: avatar, name, role badge, email, phone, joined date, status
  - Filter tabs: All / Doctors / Staff
  - Suspend button per active member (with confirmation)
  - Reactivate button per suspended member
  - Empty state per filter

- [ ] 🖥️ `src/pages/admin/ClinicSettings.jsx`
  - Editable form: clinic name, address, phone, specialty
  - Clinic code in read-only styled box with 📋 copy button
  - Save button: loading → "Saved ✓" on success
  - Unsaved changes warning if navigating away (optional)

- [ ] ✅ Test: login as admin → approve a doctor → login as that doctor → access /doctor

---

## Phase 4 — Reception Dashboard `/reception`
> **Goal:** Staff can look up patients, issue tokens, and manage the live queue

### 4.1 Backend — Patient & Token Routes
📦 **No new installs**

- [ ] ⚙️ `src/services/token.service.js`
  - `getNextTokenNumber(clinicId)` — counts today's tokens for clinic, returns next number
  - `calculateETA(clinicId, doctorId)` — avg consult time × tokens ahead
  - `recalculatePositions(clinicId)` — after any status change, reorder queue_position
- [ ] ⚙️ `src/controllers/patient.controller.js`
  - `lookupPatient(req, res)` — find patient by phone + clinicId, include active token check
  - `createPatient(req, res)` — new patient registration with consent
- [ ] ⚙️ `src/controllers/token.controller.js`
  - `createToken(req, res)` — create token, call token.service for number + ETA
  - `getTokens(req, res)` — all today's tokens for clinic sorted by queue_position
  - `updateTokenStatus(req, res)` — change status, recalculate positions
  - `deleteToken(req, res)` — cancel/remove token
  - `createEmergencyToken(req, res)` — insert at position 1
  - `pauseQueue(req, res)` / `resumeQueue(req, res)`
- [ ] ⚙️ `src/routes/patient.routes.js`
  ```
  POST /api/patients/lookup     ← staff/admin
  POST /api/patients            ← staff/admin
  GET  /api/patients/:id        ← staff/doctor/admin
  ```
- [ ] ⚙️ `src/routes/token.routes.js`
  ```
  GET    /api/tokens                ← staff/doctor
  POST   /api/tokens                ← staff
  PATCH  /api/tokens/:id/status     ← staff/doctor
  DELETE /api/tokens/:id            ← staff
  POST   /api/tokens/emergency      ← staff
  PATCH  /api/clinic/queue/pause    ← staff/admin
  PATCH  /api/clinic/queue/resume   ← staff/admin
  ```
- [ ] ⚙️ Mount both routes in `index.js`

### 4.2 Frontend — Reception Layout & Stats
📦 **No new installs**

- [ ] 🖥️ `src/layouts/ReceptionLayout.jsx` — topbar only (clinic name, staff name, live indicator, sign out)
- [ ] 🖥️ Stats bar at top: patients in queue, served today, average wait time
- [ ] 🖥️ Two-column layout: left 2/5 = patient lookup panel, right 3/5 = queue board

### 4.3 Frontend — Patient Lookup
- [ ] 🖥️ Phone number input
  - Digits only (strip non-digits on change)
  - Max 10 digits
  - Enter key or search button triggers lookup
  - `POST /api/patients/lookup`
- [ ] 🖥️ **Found state** — Patient card:
  - Avatar circle with initial, name, phone
  - Age, visit count, last visit date, balance due badge
  - "Issue Token" button (disabled if patient already has active token — show "Already in queue")
- [ ] 🖥️ **Not found state:**
  - "No patient found for 9XXXXXXXXX"
  - "Register New Patient" button → expands inline form
- [ ] 🖥️ **New patient inline form:**
  - Phone pre-filled + read-only
  - Name (optional), age (optional)
  - Consent checkbox — required — DPDP compliance
  - "Create Patient & Continue" button → `POST /api/patients` → shows patient card

### 4.4 Frontend — Token Issuance & Queue Board
- [ ] 🖥️ Doctor selector dropdown (shows doctors in clinic from team list)
- [ ] 🖥️ Issue Token button → `POST /api/tokens` → success toast "Token T-23 issued"
- [ ] 🖥️ Queue board
  - Fetches `GET /api/tokens` on mount and every 15 seconds
  - Each row: token number badge, patient name, status badge, wait time, action buttons
  - Status badge colors:
    - Now → crimson background, white text
    - Next → yellow background, dark text
    - Waiting → cream background, body text
    - Lab → sky blue tint
    - Hold/Paused → peach tint
  - Action buttons per status:
    - waiting → "Call Now" button
    - now → "Mark Served" button
    - any → "Hold" button, "Cancel" button
  - Empty queue: centered illustration + "Queue is clear"
- [ ] 🖥️ Emergency token button — opens modal with patient search → inserts at top of queue
- [ ] 🖥️ Pause queue toggle — when paused, queue shows amber "Queue Paused" banner

- [ ] ✅ Test: login as staff → search 10-digit number → issue token → see in queue → mark served

---

## Phase 5 — Doctor Dashboard `/doctor`
> **Goal:** Doctor sees their queue, views patient history, records consultation

### 5.1 Backend — Visit Routes
📦 **No new installs**

- [ ] ⚙️ `src/controllers/visit.controller.js`
  - `createVisit(req, res)` — new visit linked to patient + doctor + clinic
  - `updateVisit(req, res)` — autosave (called every 30s from frontend)
  - `completeVisit(req, res)` — marks visit complete + token served
  - `getPatientVisits(req, res)` — full history for a patient
  - `getPatientProfile(req, res)` — patient details + visit count + last visit
- [ ] ⚙️ `src/routes/visit.routes.js`
  ```
  POST  /api/visits                      ← doctor
  PATCH /api/visits/:id                  ← doctor
  PATCH /api/visits/:id/complete         ← doctor
  GET   /api/patients/:id/visits         ← doctor/admin
  GET   /api/patients/:id/profile        ← doctor/staff/admin
  ```

### 5.2 Frontend — Doctor Layout & Queue
📦 **No new installs**

- [ ] 🖥️ `src/layouts/DoctorLayout.jsx` — sidebar: My Queue, Patients, sign out
- [ ] 🖥️ `src/pages/doctor/DoctorDashboard.jsx`
  - Current patient card (status=now): name, age, complaint (if started)
  - Next patient preview card
  - Queue list below: token number, name, wait time
  - "Call Next" button → marks current as served, next as now
  - Fetches `GET /api/tokens?doctorId=me` every 15 seconds

### 5.3 Frontend — EHR Consultation Form
📦 **Install:** `react-hook-form` (already installed)

- [ ] 🖥️ `src/pages/doctor/ConsultationForm.jsx`
  - Patient header: name, age, phone, total visits, last visit date, "View History" button
  - **Complaint:** textarea + tag chip input (type word, press Enter to add tag)
  - **Vitals** (all optional): BP systolic/diastolic, temperature, weight, height
  - **Diagnosis:** textarea
  - **Prescription builder:** dynamic rows
    - Each row: medicine name, dose, frequency, duration, special instructions
    - Add row button, delete row button
    - Min 1 row when opened
  - **Tests ordered:** chip input (same as complaint tags)
  - **Doctor notes:** textarea (labeled "Private — not visible to patient")
  - **Follow-up date:** date input
  - **Autosave:** `PATCH /api/visits/:id` every 30 seconds → shows "Saved at 2:43 PM"
  - **Complete Consultation** button → `PATCH /api/visits/:id/complete` → form locks, token marked served

### 5.4 Frontend — Patient History Panel
- [ ] 🖥️ `src/components/doctor/PatientHistoryPanel.jsx`
  - Slides in from right as a drawer/panel (not a new page)
  - Fetches `GET /api/patients/:id/visits`
  - Visit timeline: date chip, complaint, diagnosis, prescription pills
  - Click any visit to expand full details
  - Close button

- [ ] ✅ Test: login as doctor → see queue → click patient → fill form → autosave → complete consultation

---

## Phase 6 — Billing
> **Goal:** Staff creates bills, marks payment, generates receipt

### 6.1 Backend — Bill Routes
📦 **Install (PDF):** `puppeteer` or `jspdf` (choose one — Puppeteer for server-side PDF)

- [ ] ⚙️ `src/services/bill.service.js`
  - `calculateTotals(items)` — subtotal, 18% GST, total
  - `generatePDFReceipt(billId)` — HTML template → PDF buffer
- [ ] ⚙️ `src/controllers/bill.controller.js`
  - `createBill(req, res)` — create bill with items array
  - `markPaid(req, res)` — update status=paid, record payment method + paidAt
  - `getBill(req, res)` — return bill with patient + items
  - `getBillPDF(req, res)` — stream PDF as response
- [ ] ⚙️ `src/routes/bill.routes.js`
  ```
  POST /api/bills                  ← staff
  PATCH /api/bills/:id/payment     ← staff
  GET  /api/bills/:id              ← staff/doctor/patient
  GET  /api/bills/:id/pdf          ← staff/doctor/patient
  ```

### 6.2 Frontend — Billing Screen
📦 **No new installs**

- [ ] 🖥️ `src/pages/reception/BillingScreen.jsx`
  - Linked from patient card on reception dashboard ("Create Bill" button)
  - Patient header: name, phone
  - Line items table:
    - Each row: service/item name (text), quantity (number), unit price (number), line total (auto)
    - Add row button, delete row button
  - Summary: subtotal, GST (18%), **total** (bold, large)
  - Payment method: Cash / UPI / Card (3 styled radio buttons)
  - "Mark as Paid" button → `PATCH /api/bills/:id/payment`
  - After paid: receipt preview modal
- [ ] 🖥️ `src/components/billing/ReceiptModal.jsx`
  - Shows bill summary in a clean receipt layout
  - Clinic name, patient name, date, items table, total, payment method
  - Download PDF button → `GET /api/bills/:id/pdf`
  - Resend button (placeholder — connects to messaging in Phase 7)

- [ ] ✅ Test: create bill → add items → totals calculate → mark paid → download PDF

---

## Phase 7 — Messaging Automation
> **Goal:** WhatsApp/SMS/Email sent automatically on key events

### 7.1 Backend — Message Service
📦 **Install:** `axios` (for WhatsApp/SMS API calls — already installed via project) `node-cron` (for scheduled reminders)

- [ ] ⚙️ `src/services/message.service.js`
  - `renderTemplate(templateName, variables)` — replace `{patient_name}` etc with real values
  - `sendEmail(to, subject, html)` — via Nodemailer
  - `sendWhatsApp(phone, message)` — via Meta API or Twilio (use env var to toggle)
  - `sendSMS(phone, message)` — via MSG91 (India DLT)
  - `logMessage(patientId, clinicId, channel, template, status)` — write to MessageLog
- [ ] ⚙️ Message templates (10 from PRD §11) stored in `src/config/messageTemplates.js`:
  - `token_issued` — "Hi {patient_name}, your token {token_number} is confirmed. Queue position: {queue_position}."
  - `two_before_you` — "Hi {patient_name}, 2 patients ahead of you. Get ready!"
  - `your_turn` — "Hi {patient_name}, it's your turn! Please proceed to {clinic_name}."
  - `bill_receipt` — "Hi {patient_name}, your bill of ₹{amount} is paid. Receipt: {receipt_link}"
  - `appointment_confirmed` — "Appointment confirmed for {appointment_time} at {clinic_name}."
  - + 5 more from PRD
- [ ] ⚙️ Sequelize hooks (afterCreate, afterUpdate) on Token model:
  - Token created → trigger `token_issued`
  - Token position becomes 2 → trigger `two_before_you`
  - Token status → now → trigger `your_turn`
- [ ] ⚙️ Sequelize hook on Bill model:
  - Bill status → paid → trigger `bill_receipt`
- [ ] ⚙️ `src/controllers/message.controller.js` — `getMessageLogs(req, res)`
- [ ] ⚙️ `src/routes/message.routes.js` — `GET /api/messages` (admin only)

### 7.2 Frontend — Message Log
- [ ] 🖥️ Message log table in Admin Dashboard
  - Columns: patient name, channel badge (WA/SMS/Email), template name, status badge, sent time
  - Filter by channel
  - Empty state

- [ ] ✅ Test: issue token → check phone/email for real message → check message log in admin

---

## Phase 8 — Patient Portal `/patient`
> **Goal:** Patient can see their queue status, book appointments, view history

### 8.1 Backend — Patient Portal Routes
📦 **No new installs**

- [ ] ⚙️ `src/controllers/patient.controller.js` — add:
  - `getPatientDashboard(req, res)` — active token, last 3 visits, last 3 bills
  - `getPatientToken(req, res)` — current token with live position + ETA
  - `getPatientVisits(req, res)` — full visit history for logged-in patient
  - `getPatientBills(req, res)` — all bills for logged-in patient
- [ ] ⚙️ `src/controllers/appointment.controller.js`
  - `getAvailableSlots(req, res)` — slots for doctor on a date
  - `createAppointment(req, res)` — book slot
  - `cancelAppointment(req, res)` — cancel
- [ ] ⚙️ Add Appointment model to schema:
  ```
  id, patientId, doctorId, clinicId, scheduledTime,
  status ENUM[scheduled,completed,cancelled],
  source ENUM[self,staff], notes
  ```
- [ ] ⚙️ `src/routes/patientPortal.routes.js`
  ```
  GET    /api/patient/dashboard         ← patient only
  GET    /api/patient/token             ← patient only
  GET    /api/patient/visits            ← patient only
  GET    /api/patient/bills             ← patient only
  GET    /api/appointments/slots        ← patient/staff
  POST   /api/appointments              ← patient/staff
  DELETE /api/appointments/:id          ← patient/staff
  ```

### 8.2 Frontend — Patient Portal
📦 **Install:** `date-fns` (for date formatting and slot display)

- [ ] 🖥️ `src/layouts/PatientLayout.jsx`
  - Mobile-first design
  - Bottom navigation bar: Home, Queue, Appointments, History
  - Top bar: ClinicOS logo, patient name, sign out
- [ ] 🖥️ `src/pages/patient/PatientDashboard.jsx`
  - Active token card: large token number, queue position, ETA countdown
  - If no active token: "Join Queue" + "Book Appointment" CTA buttons
  - Last 3 visits: date + complaint summary chips
  - Last 3 bills: amount + paid/unpaid badge
- [ ] 🖥️ `src/pages/patient/QueueTracker.jsx`
  - Full-screen queue position display
  - Large animated position number
  - ETA display: "~18 minutes"
  - Status message: "Waiting" → "You're Next!" → "Your Turn — Please Come In"
  - Polls `GET /api/patient/token` every 20 seconds
- [ ] 🖥️ `src/pages/patient/AppointmentBooking.jsx`
  - Doctor selector (doctors in clinic)
  - Calendar date picker (date-fns for formatting, no library needed for UI)
  - Time slot grid: available=clickable crimson, booked=grey disabled, selected=filled
  - "Confirm Booking" button → `POST /api/appointments`
  - Booking confirmation screen with appointment details
- [ ] 🖥️ `src/pages/patient/VisitHistory.jsx`
  - Timeline of all visits (newest first)
  - Each visit: date, doctor name, complaint, diagnosis
  - Expand to see full prescription + tests + notes
- [ ] 🖥️ `src/pages/patient/BillHistory.jsx`
  - List of all bills: date, amount, status badge, download receipt button

- [ ] ✅ Test: login as patient → see active token → book appointment → view visit history

---

## Phase 9 — Admin Analytics
> **Goal:** Admin sees revenue and performance charts

### 9.1 Backend — Analytics Routes
📦 **No new installs** (Sequelize has aggregate functions built in)

- [ ] ⚙️ `src/controllers/analytics.controller.js`
  - `getOverview(req, res)` — today: patient count, revenue, avg wait, served count
  - `getRevenue(req, res)` — daily revenue totals for a date range (GROUP BY date)
  - `getQueueStats(req, res)` — avg wait time by day, peak hour distribution
  - `getPatientVolume(req, res)` — new vs returning patients by day
- [ ] ⚙️ `src/routes/analytics.routes.js`
  ```
  GET /api/analytics/overview         ← admin
  GET /api/analytics/revenue          ← admin
  GET /api/analytics/queue            ← admin
  GET /api/analytics/patients         ← admin
  ```

### 9.2 Frontend — Analytics Dashboard
📦 **Install:** `recharts`

- [ ] 🖥️ `src/pages/admin/Analytics.jsx`
  - Date range selector: Today / 7 Days / 30 Days / Custom
  - 4 summary stat cards with trend arrows (up/down vs previous period)
  - Revenue bar chart (`BarChart` from Recharts) — x=date, y=₹ revenue
  - Patient volume line chart (`LineChart`) — new vs returning
  - Avg wait time area chart (`AreaChart`)
  - All charts: crimson/cream/teal color theme matching design system
  - Loading skeletons while fetching

- [ ] ✅ Test: login as admin → navigate to analytics → charts render with real data

---

## Phase 10 — Real-time with Socket.IO
> **Goal:** Queue board updates instantly without page refresh

📦 **Install (Backend):** `socket.io`
📦 **Install (Frontend):** `socket.io-client`

### 10.1 Backend
- [ ] ⚙️ Install `socket.io`, attach to HTTP server in `index.js`
- [ ] ⚙️ `src/services/socket.service.js`
  - `initSocket(httpServer)` — creates Socket.IO instance
  - `joinClinicRoom(socket, clinicId)` — socket joins room `clinic_${clinicId}`
  - `emitQueueUpdate(clinicId, tokens)` — broadcast to clinic room
- [ ] ⚙️ Call `emitQueueUpdate` in token.controller after every create/update/delete
- [ ] ⚙️ Events to emit:
  - `token:created` — new token added
  - `token:updated` — status changed
  - `token:removed` — cancelled
  - `queue:paused` / `queue:resumed`

### 10.2 Frontend
- [ ] 🖥️ `src/hooks/useSocket.js` — custom hook: connect to server, join clinic room, listen for events, disconnect on unmount
- [ ] 🖥️ Reception dashboard: remove 15s polling → replace with `useSocket` hook
- [ ] 🖥️ Doctor dashboard: replace polling with socket
- [ ] 🖥️ Patient portal queue tracker: replace polling with socket events

- [ ] ✅ Test: open reception on two browsers → issue token in one → instantly appears in other

---

## Phase 11 — Additional Features

### QR Self Check-in (F21)
📦 **Install:** `qrcode.react`

- [ ] ⚙️ `GET /api/clinic/checkin-url` — returns public URL for this clinic
- [ ] 🖥️ QR code display in reception/admin dashboard using `qrcode.react`
- [ ] 🖥️ Public page `/checkin/:clinicCode`
  - No login required
  - Phone number input → looks up patient → shows "You've been added to the queue"
  - New patient → minimal registration → joins queue

### PWA / Offline (F14)
📦 **Install:** `vite-plugin-pwa`

- [ ] 🖥️ Install + configure `vite-plugin-pwa` in `vite.config.js`
- [ ] 🖥️ Service worker: cache app shell, fonts, static assets
- [ ] 🖥️ Offline banner component: shows when `navigator.onLine === false`
- [ ] 🖥️ Queue reads from last-cached data when offline

### Rate Limiting (F25)
📦 **Install:** `express-rate-limit`

- [ ] ⚙️ `POST /api/auth/login` — max 5 attempts per 15 min per IP
- [ ] ⚙️ `POST /api/auth/send-otp` — max 3 per 10 min per email
- [ ] ⚙️ `POST /api/auth/register` — max 10 per hour per IP

---

## Phase 12 — Security Hardening
📦 **Install:** `helmet` `express-rate-limit`

- [ ] ⚙️ `helmet()` middleware in `index.js` — sets CSP, HSTS, X-Frame-Options
- [ ] ⚙️ RBAC middleware applied to every protected route (not just checking JWT but also role)
- [ ] ⚙️ Input validation on all controllers (Sequelize model-level + controller-level checks)
- [ ] ⚙️ Write to AuditLog on: user approved/rejected, token served, bill paid, login
- [ ] ⚙️ CORS: only allow `process.env.CLIENT_URL`
- [ ] 🖥️ JWT only in localStorage — no passwords, no full user objects with sensitive data
- [ ] 🖥️ Never use `dangerouslySetInnerHTML`
- [ ] 🖥️ All API errors shown as messages to user — no raw error objects shown in UI

---

## Phase 13 — Testing
📦 **Install (Frontend):** `vitest` `@testing-library/react` `@testing-library/jest-dom` `playwright`
📦 **Install (Backend):** `supertest` `jest`

- [ ] ⚙️ Unit tests: `otp.service.js`, `token.service.js`, `bill.service.js`
- [ ] ⚙️ Integration tests (Supertest): register, login, send-otp, verify-otp, create token, mark paid
- [ ] 🖥️ Component tests: LoginPage form validation, OTPInput auto-advance, Queue board renders tokens
- [ ] 🖥️ E2E Playwright tests (from PRD §15):
  - AT-01: Returning patient lookup → token issued in < 20 seconds
  - AT-02: New patient registered + token issued
  - AT-03: Token status flows waiting → now → served
  - AT-04: Doctor views history, records consultation
  - AT-05: Bill created, paid, PDF downloaded
  - AT-06: WhatsApp message sent on token issue
  - AT-07: Patient sees live queue position
- [ ] Both: Test on 375px (mobile), 768px (tablet), 1280px (desktop)

---

## Phase 14 — Deployment

### Backend → Railway
📦 **Tools:** Railway CLI or GitHub integration

- [ ] ⚙️ Create Railway account + new project
- [ ] ⚙️ Add MySQL plugin to Railway project
- [ ] ⚙️ Push `server/` to GitHub, connect repo to Railway
- [ ] ⚙️ Add all `.env` variables in Railway dashboard (never commit `.env`)
- [ ] ⚙️ `sequelize.sync({ alter: true })` runs on deploy — tables auto-updated
- [ ] ✅ Test: `GET https://your-app.railway.app/api/health` returns `{ status: "ok" }`

### Frontend → Vercel
📦 **Tools:** Vercel account + GitHub integration

- [ ] 🖥️ Create Vercel account, import `client/` repo
- [ ] 🖥️ Add environment variable: `VITE_API_URL = https://your-app.railway.app`
- [ ] 🖥️ Update `src/services/api.js` baseURL: `import.meta.env.VITE_API_URL`
- [ ] ✅ Test: full signup → OTP email arrives → login → dashboard loads on live URL

### Post-Deployment Checks
- [ ] Test OTP email delivery from production (Gmail SMTP)
- [ ] Test full patient signup flow on production URL
- [ ] Test admin approving doctor on production
- [ ] Set up uptime monitoring — BetterStack (free tier)
- [ ] Configure custom domain (optional)

---

## Ongoing Rules (Every Phase)

```
Code Quality
  ☐ Every API route returns { success: true, data: {} } or { success: false, error: "message" }
  ☐ Every async controller wrapped in try/catch
  ☐ No console.log left in production code (use proper logging or remove)
  ☐ Meaningful git commit after every working feature

UI/UX Standards
  ☐ Every form: loading spinner while API call in progress
  ☐ Every form: error message shown if API call fails (not just console.log)
  ☐ Every new page: check at 375px mobile width before moving on
  ☐ All money displayed with ₹ symbol and 2 decimal places

Security
  ☐ .env always in .gitignore — never committed
  ☐ Passwords never stored in plain text (always bcrypt)
  ☐ JWT never logged or exposed in UI
  ☐ Patient phone numbers never shown in full in logs
```

---

## Summary

| Phase | What Gets Built | Key New Libraries |
|-------|----------------|-------------------|
| 0 | Project foundation, DB tables, boilerplate | sequelize, mysql2, express, bcryptjs, jsonwebtoken, nodemailer |
| 1 | Public website (done) + navbar updates | — |
| 2 | All 4 signup flows + OTP + login | react-hook-form, zod |
| 3 | Admin dashboard: requests, team, settings | — |
| 4 | Reception: patient lookup, tokens, queue | — |
| 5 | Doctor: consultation form, patient history | — |
| 6 | Billing: create bill, payment, PDF receipt | puppeteer |
| 7 | Messaging: WhatsApp/SMS/Email automation | node-cron |
| 8 | Patient portal: queue tracker, appointments | date-fns |
| 9 | Admin analytics: charts, revenue, stats | recharts |
| 10 | Real-time queue (WebSocket) | socket.io, socket.io-client |
| 11 | QR check-in, PWA offline, rate limiting | qrcode.react, vite-plugin-pwa, express-rate-limit |
| 12 | Security hardening | helmet |
| 13 | Testing | vitest, playwright, supertest |
| 14 | Deployment | Railway, Vercel |

**Total: ~215 tasks · 14 phases · Built page by page, frontend + backend together**
