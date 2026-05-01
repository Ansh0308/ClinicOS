# 🏥 ClinicOS — Interview Mastery Document

> **Confidently explain and defend every engineering decision in this project.**

---

## 1️⃣ Project Summary

### What it Does
**ClinicOS** is a full-stack, real-time **Clinic Management & Patient Engagement Platform** that digitizes daily healthcare operations — from walk-in registration and live queuing to consultations, billing, and automated receipt delivery.

### Who it's For
| Role | What They Do |
|------|-------------|
| **Clinic Admin** | Creates clinic, approves staff join requests, manages team, views analytics |
| **Receptionist (Staff)** | Registers patients, issues queue tokens, creates bills, processes payments |
| **Doctor** | Views live queue, conducts digital consultations, records EMR data |
| **Patient** | Tracks queue position live on phone, views visit history, pays bills online |

### Key Features
- 🔐 **OTP-verified, role-based authentication** (Admin → Doctor → Staff → Patient)
- 📋 **Real-time digital queuing system** with Socket.IO live position updates
- 🩺 **Digital consultations** with vitals, diagnosis, prescriptions, lab orders
- 💰 **Full billing system** with Razorpay online payments (UPI, Card, Netbanking)
- 📧 **Automated notifications** — PDF receipts via Email + WhatsApp (Meta Cloud API)
- 📊 **Analytics dashboard** with revenue, queue stats, doctor performance, complaint trends
- 🏥 **Multi-clinic architecture** with clinic codes for staff/doctor onboarding
- ↩️ **Undo system** for accidental token actions

### Tech Stack at a Glance
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS, React Router v7, Axios, Socket.IO Client |
| **Backend** | Node.js, Express 5, Sequelize ORM, Socket.IO |
| **Database** | MySQL 8 |
| **Auth** | JWT, bcryptjs (12 salt rounds), OTP via Nodemailer |
| **Payments** | Razorpay (orders + HMAC-SHA256 signature verification) |
| **Messaging** | Nodemailer (SMTP), Meta WhatsApp Cloud API, MSG91 SMS |
| **PDF** | PDFKit (in-memory A4 invoice generation) |
| **Validation** | Zod + React Hook Form |
| **Charts** | Recharts |
| **Icons** | Lucide React |

---

## 2️⃣ Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (React 19 + Vite)              │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│   │ Patient  │  │Reception │  │  Doctor  │  │  Admin Dashboard │   │
│   │ Portal   │  │Dashboard │  │Dashboard │  │  + Analytics     │   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│        │              │              │                 │             │
│   ┌────┴──────────────┴──────────────┴─────────────────┴──────┐     │
│   │              Axios HTTP Client + Socket.IO Client          │     │
│   │              (api.js — centralized request layer)          │     │
│   └────┬──────────────────────────────────────┬───────────────┘     │
└────────┼──────────────────────────────────────┼─────────────────────┘
         │ REST API (JSON)                      │ WebSocket
         ▼                                      ▼
┌────────────────────────────────────────────────────────────────────┐
│                      SERVER LAYER (Express 5 + Node.js)            │
│                                                                    │
│   ┌──────────────┐  ┌───────────────┐  ┌───────────────────────┐   │
│   │  Middleware   │  │   Routes (9)  │  │  Socket.IO Server     │   │
│   │  • JWT Auth   │  │  /api/auth    │  │  • join:clinic room   │   │
│   │  • CORS       │  │  /api/tokens  │  │  • join:patient room  │   │
│   │  • Error      │  │  /api/visits  │  │  • queue:updated      │   │
│   │    Handler    │  │  /api/bills   │  │  • token:position     │   │
│   └──────┬───────┘  │  /api/admin   │  │  • bills:updated      │   │
│          │          │  /api/patient  │  └───────────┬───────────┘   │
│          ▼          │  /api/messages │              │               │
│   ┌──────────────┐  │  /api/patients│              │               │
│   │ Controllers  │  │  /api/analytics              │               │
│   │  (9 files)   │◄─┘  └───────────┘               │               │
│   └──────┬───────┘                                  │               │
│          ▼                                          │               │
│   ┌──────────────────────────────────────────────────┐              │
│   │          SERVICES LAYER (Business Logic)          │              │
│   │  • auth.service.js     — register/login           │              │
│   │  • token.service.js    — queue position + ETA     │              │
│   │  • razorpay.service.js — create order + verify    │              │
│   │  • message.service.js  — email/WhatsApp/SMS       │              │
│   │  • socket.service.js   — emit to rooms            │              │
│   │  • queueEmit.service.js — broadcast queue state   │              │
│   │  • otp.service.js      — generate/verify OTP      │              │
│   │  • undo.service.js     — undo last token action   │              │
│   └──────────────────────────┬───────────────────────┘              │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ Sequelize ORM
                               ▼
                    ┌──────────────────────┐
                    │     MySQL 8 DB       │
                    │  10 tables, UUIDs    │
                    │  JSON fields for     │
                    │  vitals/prescriptions│
                    └──────────┬───────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │ Razorpay │   │Nodemailer│   │ Meta WhatsApp│
        │ Gateway  │   │  (SMTP)  │   │  Cloud API   │
        └──────────┘   └──────────┘   └──────────────┘
```

### Frontend Architecture
- **Framework**: React 19 with Vite for lightning-fast HMR and build
- **Routing**: React Router v7 with nested layouts per role (`/admin/*`, `/doctor/*`, `/patient/*`, `/reception`)
- **State Management**: React Context API (`AuthContext`) for global auth state; local `useState` + `useCallback` per component
- **Forms**: React Hook Form + Zod schema validation for type-safe, performant forms
- **HTTP Layer**: Single Axios instance ([api.js](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/services/api.js)) with request interceptor (auto-attach JWT) and response interceptor (auto-redirect on 401)
- **Real-time**: Custom `useSocket` hook wrapping Socket.IO client with reconnection + room-based subscriptions
- **Styling**: Tailwind CSS 3 with custom design tokens (crimson palette, custom fonts)

### Backend Architecture (MVC + Service Layer)
```
server.js (entry point)
  ├── middleware/     ← JWT auth guard, CORS, error handler
  ├── routes/         ← Express route definitions (9 files)
  ├── controllers/    ← Request handlers (thin — delegate to services)
  ├── services/       ← Core business logic (auth, payments, messaging)
  ├── models/         ← Sequelize schema definitions (10 models)
  ├── config/         ← DB config, mailer transporter, message templates
  └── utils/          ← PDF generation, audit logging, JWT helpers
```

### Data Flow: Patient Pays a Bill Online
```
1. Patient clicks "Pay Now" in BillHistory.jsx
2. Frontend → POST /api/patient/bills/:id/razorpay-order
3. Server creates Razorpay order (razorpay.service.js)
4. Server returns { orderId, amount, key } to frontend
5. Frontend opens Razorpay checkout modal (client-side SDK)
6. Patient completes payment (UPI/Card/Netbanking)
7. Razorpay sends { razorpay_payment_id, razorpay_signature } to frontend callback
8. Frontend → POST /api/patient/bills/:id/razorpay-verify
9. Server verifies HMAC-SHA256 signature (razorpay.service.js)
10. Server marks bill as paid, generates PDF receipt (pdfGenerator.js)
11. Server sends email with PDF attachment (message.service.js)
12. Server emits 'bills:updated' via Socket.IO to patient room
13. Server emits 'bill:updated' via Socket.IO to clinic room
14. All dashboards update in real-time without refresh
```

---

## 3️⃣ Tech-Stack Justification

### React 19 + Vite
| Aspect | Detail |
|--------|--------|
| **Why chosen** | Concurrent UI rendering, massive ecosystem, component reusability, virtual DOM efficiency |
| **Why Vite** | 10x faster HMR than CRA/Webpack, native ESM, zero-config setup |
| **Alternatives** | Next.js (overkill for SPA — no SSR needed), Angular (steeper learning curve, heavier), Vue (smaller ecosystem) |
| **Trade-offs** | No SSR/SSG — acceptable since this is a dashboard app, not SEO-critical |

### Node.js + Express 5
| Aspect | Detail |
|--------|--------|
| **Why chosen** | JavaScript full-stack (shared language), non-blocking I/O ideal for real-time Socket.IO, fastest time-to-market |
| **Why Express 5** | Native async/await error handling, stability, largest middleware ecosystem |
| **Alternatives** | Django (Python context-switching), Fastify (less mature ecosystem), NestJS (overkill for project scope) |
| **Trade-offs** | Single-threaded (mitigated by async I/O), no built-in type safety (mitigated by Zod validation on frontend) |

### MySQL 8 + Sequelize ORM
| Aspect | Detail |
|--------|--------|
| **Why MySQL** | Relational data with strict relationships (Clinic → Patient → Visit → Bill), ACID transactions for billing, JSON column support for flexible fields (vitals, prescriptions) |
| **Why Sequelize** | Model-first development with `sync({ alter })` for rapid prototyping, associations API, migration support |
| **Alternatives** | PostgreSQL (equivalent — MySQL chosen for familiarity + hosting availability), MongoDB (wrong fit — our data is inherently relational), Prisma (type-safety nice but less mature ecosystem at project start) |
| **Trade-offs** | ORM overhead for complex queries — mitigated by using raw Sequelize `fn()` and `col()` in analytics |

### Socket.IO
| Aspect | Detail |
|--------|--------|
| **Why chosen** | Bi-directional real-time needed for live queue tracking, automatic reconnection, room-based broadcasting, WebSocket with fallback to polling |
| **Alternatives** | Server-Sent Events (one-directional — patients need to emit "join" events), raw WebSocket (no reconnection/rooms out of box), Pusher (vendor lock-in) |
| **Trade-offs** | Additional server memory per connection; mitigated by room-scoped emissions (only clinic/patient rooms) |

### Razorpay
| Aspect | Detail |
|--------|--------|
| **Why chosen** | India's leading payment gateway, supports UPI natively (85%+ Indian mobile payments), simple SDK, test mode available |
| **Alternatives** | Stripe (poor UPI support in India), PayU (less developer-friendly API), CCAvenue (legacy integration) |
| **Trade-offs** | India-only focus — acceptable for a clinic management system targeting Indian healthcare market |

### JWT + bcryptjs
| Aspect | Detail |
|--------|--------|
| **Why JWT** | Stateless authentication — no server-side session store needed, works well with multi-client (React SPA) |
| **Why bcryptjs** | 12 salt rounds for password hashing — computationally expensive to brute-force |
| **Alternatives** | Session-based auth (requires Redis/store), Passport.js (abstraction overhead), OAuth2 (overkill for internal clinic system) |
| **Trade-offs** | JWT can't be instantly revoked server-side — mitigated by short expiry |

### Tailwind CSS 3
| Aspect | Detail |
|--------|--------|
| **Why chosen** | Utility-first approach, rapid UI development, custom design tokens, purged CSS = tiny production bundle |
| **Alternatives** | Material UI (opinionated, heavy JS), Styled-Components (runtime CSS-in-JS overhead), Bootstrap (generic look) |
| **Trade-offs** | Verbose className strings — mitigated by component extraction |

---

## 4️⃣ Key Features Deep Dive

### 4.1 Real-Time Queue Management System

**What it does:** Receptionist issues numbered tokens to patients. Doctors see a live queue and call patients. Patients track their live position on their phones.

**How it works technically:**
1. Staff creates token → `POST /api/tokens` → `token.controller.js::createToken()`
2. `token.service.js::getNextTokenNumber()` counts today's tokens per clinic and returns `count + 1`
3. `token.service.js::calculateETA()` computes average consultation time from today's served tokens and multiplies by queue position
4. `queueEmit.service.js::emitQueueUpdate()` broadcasts the full queue state via Socket.IO to:
   - `clinic:{clinicId}` room → Reception + Doctor dashboards update
   - `patient:{patientId}` room → Each patient gets private position data
5. Patients 2 positions from being called get an automatic email/WhatsApp "2 before you" notification

**Key files:**
- [controllers/token.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/token.controller.js) — [createToken](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/token.controller.js#71-157), [updateTokenStatus](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/token.controller.js#158-223), [createEmergencyToken](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/token.controller.js#243-280), [pauseQueue](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/token.controller.js#281-319), [resumeQueue](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/token.controller.js#320-359), [undoLastAction](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/token.controller.js#360-389)
- [services/token.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/token.service.js) — [getNextTokenNumber](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/token.service.js#5-19), [calculateETA](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/token.service.js#20-58), [recalculatePositions](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/token.service.js#59-103)
- [services/queueEmit.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/queueEmit.service.js) — shared `emitQueueUpdate` utility
- `pages/reception/ReceptionDashboard.jsx` — Staff view
- `pages/patient/QueueTracker.jsx` — Patient live view

**Token states:** `waiting → now → served` (also `paused`, `lab`, `cancelled`)

---

### 4.2 Digital Consultation (EMR)

**What it does:** When a doctor clicks "Start Consultation," a Visit record is created. The doctor records vitals, complaints, diagnosis, prescriptions, and lab orders. Data autosaves.

**How it works technically:**
1. Doctor clicks "Start Consult" on a token → `POST /api/visits` creates a [Visit](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/services/api.js#73-74) record linked to [Token](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/token.controller.js#13-70)
2. `visit.controller.js::updateVisit()` handles autosave (PATCH endpoint) — nullish coalescing (`??`) ensures partial updates don't erase fields
3. Vitals stored as JSON: `{ bp: '120/80', temp: '98.6', weight: '70', pulse: '72' }`
4. Prescriptions stored as JSON array: `[{ drug, dosage, frequency, duration }]`
5. On "Complete" → marks visit `isComplete: true`, token status → `served`, recalculates queue positions, emits socket update

**Key files:**
- [controllers/visit.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/visit.controller.js) — [createVisit](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/visit.controller.js#7-37), [updateVisit](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/visit.controller.js#38-72), [completeVisit](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/visit.controller.js#73-117)
- [models/visit.model.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/models/visit.model.js) — JSON fields for `vitals`, `prescriptions`, `testsOrdered`, `complaintTags`
- `pages/doctor/ConsultationForm.jsx` — Full consultation UI
- `pages/doctor/DoctorQueue.jsx` — Doctor's live queue

---

### 4.3 Billing & Online Payments (Razorpay)

**What it does:** Staff generates itemized bills with dynamic tax/discount. Patients pay via cash (staff marks paid) or online (Razorpay checkout). PDF receipt auto-sent on payment.

**How it works technically:**
1. Staff creates bill → `POST /api/bills` → stores `items` (JSON), `subtotal`, `tax` (18%), `discountPercent`, `total`
2. **Cash flow:** Staff clicks "Mark Paid" → `PATCH /api/bills/:id/payment` → sets status `paid`
3. **Online flow:**
   - `POST /api/bills/:id/razorpay-order` → `razorpay.service.js::createOrder()` → converts INR to paise, creates Razorpay order
   - Frontend opens Razorpay checkout modal
   - `POST /api/bills/:id/razorpay-verify` → `razorpay.service.js::verifySignature()` → HMAC-SHA256 verification of `orderId|paymentId` against signature
4. On payment: generates PDF via [pdfGenerator.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/utils/pdfGenerator.js) → sends email with PDF attachment via [message.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/message.service.js)

**Key files:**
- [controllers/bill.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/bill.controller.js) — [createBill](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/bill.controller.js#66-118), [markPaid](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/services/api.js#107-108), [createRazorpayOrder](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/services/api.js#79-80), [verifyRazorpayPayment](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/bill.controller.js#315-429)
- [services/razorpay.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/razorpay.service.js) — [createOrder](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/razorpay.service.js#60-84), [verifySignature](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/razorpay.service.js#85-102)
- [utils/pdfGenerator.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/utils/pdfGenerator.js) — [generateBillPDF](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/utils/pdfGenerator.js#3-107) (in-memory PDFKit generation)
- `components/billing/ReceiptModal.jsx` — Staff billing UI

---

### 4.4 Multi-Channel Notification System

**What it does:** Sends templated messages via Email, WhatsApp, and SMS. Logs every message to DB with success/failure tracking.

**How it works technically:**
1. Single entry point: `message.service.js::sendMessage({ patientId, templateName, channels, attachments })`
2. Resolves recipient: prioritizes portal account email (`patient.user.email`) → fallback to staff-entered email (`patient.email`)
3. Dispatches per channel:
   - **Email:** Nodemailer SMTP with branded HTML template
   - **WhatsApp:** Meta Cloud API v18.0 `POST /{phoneId}/messages` with Bearer auth
   - **SMS:** MSG91 Flow API
4. **Opt-out support:** checks `patient.optInMsg` flag before sending
5. Logs every send/failure to `MessageLog` table via [logMessage()](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/message.service.js#91-106)

**Key files:**
- [services/message.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/message.service.js) — [sendMessage](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/message.service.js#107-171), [sendEmail](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/message.service.js#6-34), [sendWhatsApp](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/message.service.js#35-64), [sendSMS](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/message.service.js#65-90)
- [config/messageTemplates.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/config/messageTemplates.js) — Template rendering (`bill_paid`, `two_before_you`, etc.)
- [models/messageLog.model.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/models/messageLog.model.js) — Delivery tracking
- `pages/admin/MessageLogs.jsx` — Admin view of all sent messages

---

### 4.5 Authentication & Onboarding Flow

**What it does:** 4-role authentication with OTP email verification, clinic code joining, and admin approval workflow.

**How it works technically:**
1. **Admin signup:** Creates User + Clinic (generates unique `clinicCode`) → auto-approved
2. **Doctor/Staff signup:** Verifies OTP → creates User with `status: 'pending'` → creates [JoinRequest](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/clinic.controller.js#28-45) → Admin approves/rejects via `/api/admin/join-requests/:id`
3. **Patient signup:** OTP verify → creates User → auto-links to existing walk-in [Patient](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/socket.service.js#45-49) records by phone/email match
4. **Login:** `bcrypt.compare()` → `jwt.sign()` → returns token + user object
5. **Session restore:** On app load, `AuthContext` calls `GET /api/auth/me` to validate stored JWT
6. **Password reset:** Generates `crypto.randomBytes(32)` reset token → stores hashed version with 1-hour expiry → sends branded email link

**Key files:**
- [controllers/auth.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/auth.controller.js) — [sendOTP](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/auth.controller.js#10-36), [verifyOTP](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/otp.service.js#18-37), [register](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/services/api.js#30-31), [login](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/auth.controller.js#78-92), [getMe](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/services/api.js#32-33), [forgotPassword](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/services/api.js#33-34), [resetPassword](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/services/api.js#34-35)
- [services/auth.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/auth.service.js) — [registerUser](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/auth.service.js#6-119), [loginUser](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/auth.service.js#120-152)
- [services/otp.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/otp.service.js) — [generateOTP](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/otp.service.js#5-8), [saveOTP](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/otp.service.js#9-17), [verifyOTP](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/otp.service.js#18-37), [sendOTPEmail](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/otp.service.js#38-64)
- [middleware/auth.middleware.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/middleware/auth.middleware.js) — [protect](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/middleware/auth.middleware.js#9-33) (JWT guard)
- [context/AuthContext.jsx](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/context/AuthContext.jsx) — Frontend auth state management

---

### 4.6 Analytics Dashboard

**What it does:** Comprehensive business intelligence for clinic admins — revenue, patient volume, queue efficiency, doctor performance, and top complaints.

**How it works technically:**
- [analytics.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/analytics.controller.js) has 5 endpoints: [getOverview](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/services/api.js#51-52), [getRevenue](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/analytics.controller.js#283-308), [getQueueStats](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/analytics.controller.js#309-361), [getTopComplaints](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/analytics.controller.js#362-411), [getDoctorStats](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/analytics.controller.js#412-460)
- Supports date range filtering: today, 7d, 30d, 90d, custom range
- Revenue aggregation uses Sequelize `fn('SUM', col('total'))` and `fn('DATE', col('createdAt'))` for daily breakdowns
- Average wait time calculated from `calledAt - issuedAt` on served tokens
- [fillDailySeries()](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/analytics.controller.js#123-146) fills empty dates with zero-value entries for complete graph data

**Key files:**
- [controllers/analytics.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/analytics.controller.js) — All 5 analytics endpoints
- `pages/admin/Analytics.jsx` — Frontend charts (Recharts)
- `pages/admin/AdminOverview.jsx` — Summary cards

---

## 5️⃣ External APIs & Services

### 5.1 Razorpay Payment Gateway
| Aspect | Detail |
|--------|--------|
| **Purpose** | Online bill payments (UPI, Card, Netbanking) |
| **Where used** | [services/razorpay.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/razorpay.service.js), [controllers/bill.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/bill.controller.js), [controllers/patientPortal.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/patientPortal.controller.js) |
| **Endpoints called** | `razorpay.orders.create()` (SDK), client-side [Razorpay()](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/razorpay.service.js#36-59) checkout modal |
| **Auth method** | `key_id` + `key_secret` (server-side), publishable key (client-side) |
| **Verification** | HMAC-SHA256 signature: `crypto.createHmac('sha256', secret).update(orderId + '\|' + paymentId).digest('hex')` |
| **Failure handling** | [parseRazorpayError()](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/razorpay.service.js#36-59) handles ENOTFOUND, ECONNRESET, ETIMEDOUT with user-friendly messages; 503 if credentials not configured |

### 5.2 Nodemailer (SMTP Email)
| Aspect | Detail |
|--------|--------|
| **Purpose** | OTP codes, receipt PDFs, "2 before you" queue alerts, password reset links |
| **Where used** | [services/message.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/message.service.js), [services/otp.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/otp.service.js), [controllers/auth.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/auth.controller.js) |
| **Config** | Gmail SMTP (`smtp.gmail.com:587`) via app password |
| **Auth method** | Username + App Password in [.env](file:///d:/CODES/AWT-Project/clinicOS-Backend/.env) |
| **Failure handling** | try/catch per channel → logs failure to `MessageLog` table → continues to next channel |

### 5.3 Meta WhatsApp Cloud API
| Aspect | Detail |
|--------|--------|
| **Purpose** | Instant notifications to patients (queue alerts, receipts) |
| **Where used** | `services/message.service.js::sendWhatsApp()` |
| **Endpoint** | `POST https://graph.facebook.com/v18.0/{phoneId}/messages` |
| **Auth method** | Bearer token in Authorization header |
| **Failure handling** | Graceful fallback — if credentials not configured, logs to console in dev; errors logged to `MessageLog` |

### 5.4 MSG91 SMS API
| Aspect | Detail |
|--------|--------|
| **Purpose** | SMS fallback for notifications |
| **Where used** | `services/message.service.js::sendSMS()` |
| **Endpoint** | `POST https://api.msg91.com/api/v5/flow/` |
| **Auth method** | `authkey` header |
| **Failure handling** | Same pattern as WhatsApp — logs to console in dev, errors to `MessageLog` |

### 5.5 PDFKit (Server-Side PDF Generation)
| Aspect | Detail |
|--------|--------|
| **Purpose** | Generates A4 invoices/receipts in-memory as Buffer (no temp files) |
| **Where used** | `utils/pdfGenerator.js::generateBillPDF()`, attached via [message.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/message.service.js) |
| **How** | Streams PDF into buffer array → `Buffer.concat()` → attached to Nodemailer email |

---

## 6️⃣ Database & Schema Explanation

### ER Diagram (Text)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Clinic     │◄──┐   │     User     │──────►│  JoinRequest │
│──────────────│   │   │──────────────│       │──────────────│
│ id (UUID PK) │   │   │ id (UUID PK) │       │ id (UUID PK) │
│ name         │   │   │ name         │       │ userId (FK)  │
│ address      │   │   │ email (uniq) │       │ clinicId (FK)│
│ phone        │   │   │ passwordHash │       │ status       │
│ specialty    │   │   │ phone        │       │ reviewedBy   │
│ clinicCode   │   └───│ clinicId (FK)│       │ reviewedAt   │
│ adminId      │       │ role (ENUM)  │       └──────────────┘
│ queuePaused  │       │ status (ENUM)│
└──────┬───────┘       │ emailVerified│
       │               │ resetToken   │
       │               │ resetExpiry  │
       │               └──────────────┘
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       ▼                                             │
┌──────────────┐       ┌──────────────┐              │
│   Patient    │──────►│    Token     │◄─────────────┘
│──────────────│       │──────────────│
│ id (UUID PK) │       │ id (UUID PK) │
│ userId (FK)  │       │ clinicId (FK)│
│ clinicId (FK)│       │ patientId(FK)│
│ phone        │       │ doctorId (FK)│
│ email        │       │ tokenNumber  │
│ name         │       │ status (ENUM)│   waiting/now/paused/lab/served/cancelled
│ dob          │       │ queuePosition│
│ gender       │       │ estimatedWait│
│ optInMsg     │       │ issuedAt     │
└──────┬───────┘       │ calledAt     │
       │               │ servedAt     │
       │               └──────┬───────┘
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│    Visit     │       │     Bill     │
│──────────────│       │──────────────│
│ id (UUID PK) │       │ id (UUID PK) │
│ patientId(FK)│       │ patientId(FK)│
│ doctorId (FK)│       │ clinicId (FK)│
│ clinicId (FK)│       │ visitId (FK) │
│ tokenId (FK) │       │ tokenId (FK) │
│ complaint    │       │ items (JSON) │
│ complaintTags│(JSON) │ subtotal     │
│ vitals (JSON)│       │ tax          │
│ diagnosis    │       │ total        │
│ notes        │       │ paidAmount   │
│ prescriptions│(JSON) │ status (ENUM)│  unpaid/partial/paid/cancelled
│ testsOrdered │(JSON) │ paymentMethod│  cash/upi/card/online
│ followUpDate │       │ paidAt       │
│ isComplete   │       │ discountPct  │
└──────────────┘       │ discountAmt  │
                       │ razorpayPayId│
                       │ razorpayOrdId│
                       └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  MessageLog  │  │   AuditLog   │  │   OtpCode    │
│──────────────│  │──────────────│  │──────────────│
│ patientId(FK)│  │ userId (FK)  │  │ email        │
│ clinicId     │  │ clinicId     │  │ code         │
│ channel      │  │ action       │  │ used         │
│ template     │  │ entity       │  │ expiresAt    │
│ status       │  │ entityId     │  └──────────────┘
│ errorMessage │  │ meta (JSON)  │
└──────────────┘  └──────────────┘
```

### Key Relationships
| Relationship | Type | Description |
|-------------|------|-------------|
| Clinic → User | One-to-Many | A clinic has many staff/doctors |
| Clinic → Patient | One-to-Many | Patients registered at a clinic |
| Patient → Token | One-to-Many | A patient can have multiple tokens (daily visits) |
| Patient → Visit | One-to-Many | Complete visit/consultation history |
| Patient → Bill | One-to-Many | All bills across visits |
| Token → Visit | One-to-One | Each token may produce one consultation |
| Visit → Bill | One-to-Many | A visit may have multiple bills (consult + lab fees) |
| User → JoinRequest | One-to-Many | Doctor/Staff join requests to clinics |

### Unique Constraints
- `User.email` — globally unique
- `Patient (phone + clinicId)` — composite unique (same phone, different clinics = different patient records)
- `Clinic.clinicCode` — unique 6-char alphanumeric code

### Data Validation
- **Model-level:** Sequelize `validate: { isEmail: true }`, `allowNull: false`, `ENUM` constraints
- **Frontend-level:** Zod schemas with React Hook Form for field-level validation
- **UUID primary keys** — all tables use `UUIDV4` for globally unique, non-sequential IDs (prevents enumeration attacks)

---

## 7️⃣ Technical Challenges & Solutions

### Challenge 1: Real-Time Queue Sync Across 3+ Dashboards

| Aspect | Detail |
|--------|--------|
| **Situation** | Staff, Doctors, and Patients all need to see queue changes instantly. Initially, only [token.controller.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/controllers/token.controller.js) had socket emissions — visit completion and bill status changes had zero real-time sync. |
| **Task** | Ensure every state change (token issued, status change, consultation complete, bill created, bill paid) broadcasts to all affected dashboards simultaneously. |
| **Action** | 1. Extracted shared `emitQueueUpdate()` into [queueEmit.service.js](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/queueEmit.service.js) (DRY — was duplicated in 3 controllers). 2. Added socket emissions to `visit.controller.js::completeVisit()` and `bill.controller.js::markPaid()`. 3. Created room-based architecture: `clinic:{id}` for staff/doctors, `patient:{id}` for individual patients. 4. Added `emitBillUpdate()` for patient-specific bill notifications. 5. Built `useAutoRefresh` hook as 30-second polling fallback if WebSocket drops. |
| **Result** | All 5 dashboard views (Reception, Doctor, Patient Dashboard, Queue Tracker, Bill History) update within milliseconds of any action. Fallback polling ensures data consistency even on unstable connections. |

### Challenge 2: Walk-In Patient → Portal Account Linking

| Aspect | Detail |
|--------|--------|
| **Situation** | Patients are first created as walk-in records by reception staff (phone + name). Later, they may sign up for an online account. The two records need to be linked automatically. |
| **Task** | Auto-link a patient's portal account to their existing clinic records without manual intervention, supporting multi-clinic scenarios. |
| **Action** | In `auth.service.js::registerUser()`, when a patient signs up: 1. Query `Patient.findAll({ where: { phone, userId: null } })` — find all unlinked patient records matching the phone. 2. Also check by email: `Patient.findAll({ where: { email, userId: null } })`. 3. Update each found record with `userId`. 4. `patientPortal.controller.js::findPatientForUser()` uses a 3-step resolution: by `userId` → by phone → by email. |
| **Result** | Seamless experience — patients sign up and instantly see their full visit history, bills, and queue tokens from their first walk-in visit. Works across multiple clinics. |

### Challenge 3: Secure Online Payment Flow with Razorpay

| Aspect | Detail |
|--------|--------|
| **Situation** | Accepting online payments for medical bills requires bulletproof security — fake payment confirmations could lead to financial loss. |
| **Task** | Implement a secure 2-step payment flow where the server is the source of truth, not the client. |
| **Action** | 1. Server creates Razorpay order with exact bill amount in paise (`Math.round(amount * 100)`). 2. Frontend opens Razorpay checkout modal. 3. On completion, frontend sends `razorpay_payment_id` + `razorpay_signature` to server. 4. Server performs HMAC-SHA256 verification: `crypto.createHmac('sha256', secret).update(orderId + '\|' + paymentId).digest('hex')` — compares against received signature. 5. Only after verification passes does the server update bill status to `paid`. 6. [parseRazorpayError()](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/razorpay.service.js#36-59) handles network failures, invalid keys, and Razorpay API errors with user-friendly messages. |
| **Result** | Zero possibility of faking payments — the server independently verifies every transaction using cryptographic signatures. |

### Challenge 4: Dynamic Queue Position & ETA Recalculation

| Aspect | Detail |
|--------|--------|
| **Situation** | Queue positions change whenever a token is served, cancelled, or an emergency is added. ETAs need to reflect actual consultation speed, not static estimates. |
| **Task** | Recalculate all queue positions and ETAs after every state change, and notify each affected patient individually. |
| **Action** | 1. [recalculatePositions()](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/token.service.js#59-103) re-queries all `waiting` tokens ordered by `createdAt`, sequentially updates `queuePosition`. 2. [calculateETA()](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/token.service.js#20-58) averages [(servedAt - calledAt)](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/App.jsx#145-152) across today's served tokens → multiplies by waiting count → returns estimated wait minutes. 3. Emergency tokens get `queuePosition: 0` and trigger full recalculation. 4. Each patient gets private `token:position` socket event with their specific `tokensAhead` and `livePosition`. |
| **Result** | Patients see accurate, dynamically updating wait times. Emergency insertions are handled gracefully without breaking the queue order. |

### Challenge 5: PDF Receipt Generation Without Disk I/O

| Aspect | Detail |
|--------|--------|
| **Situation** | Receipts need to be generated server-side and emailed as attachments. Writing temp files to disk is slow, creates cleanup issues, and complicates deployment. |
| **Task** | Generate professional A4 PDF invoices entirely in-memory. |
| **Action** | Used PDFKit with buffer streaming pattern: `doc.on('data', buffers.push.bind(buffers))` → `doc.on('end', () => resolve(Buffer.concat(buffers)))`. Returns a `Promise<Buffer>` directly passed as a Nodemailer attachment. PDF includes branded header, itemized table, discount/tax breakdown, and footer. |
| **Result** | Zero disk I/O, no temp file cleanup needed, instant email delivery with professional PDF receipts. Works in any deployment environment including serverless. |

---

## 8️⃣ Interview Q&A Bank

| Question | Strong Interview Answer |
|----------|----------------------|
| **Hardest part of the project?** | "Getting real-time sync working across all dashboards. Initially only the token controller emitted socket events, so consultation completions and bill payments didn't update other screens. I solved it by extracting a shared `emitQueueUpdate()` service and adding socket emissions to all state-changing controllers. I also added a 30-second polling fallback via `useAutoRefresh` hook." |
| **Why this tech stack?** | "React+Vite for fast development and HMR. Express for full-stack JS and Socket.IO compatibility. MySQL because our data is inherently relational — clinics, patients, visits, bills all have strict relationships. Razorpay because it natively supports UPI, which covers 85%+ of Indian mobile payments." |
| **How does authentication work?** | "OTP-based email verification during signup, then JWT for session management. Passwords are hashed with bcryptjs at 12 salt rounds. The JWT is stored in localStorage and attached to every request via an Axios interceptor. A [protect](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/middleware/auth.middleware.js#9-33) middleware on the server verifies the token and attaches `userId` to the request. Role-based access is enforced by a `ProtectedRoute` wrapper on the frontend." |
| **How would you scale it?** | "1) Horizontal scaling: Move Socket.IO to use Redis adapter for multi-instance broadcasting. 2) Database: Add read replicas for analytics queries. 3) Caching: Redis for patient lookups and queue state. 4) Async processing: Queue email/WhatsApp sends via Bull/Redis to decouple from request lifecycle. 5) CDN: Serve the React app via CloudFront/Vercel." |
| **What would you improve?** | "1) Add TypeScript for full-stack type safety. 2) Implement WebSocket authentication (currently uses rooms but no JWT verification on socket connection). 3) Add Helmet.js and rate limiting. 4) Move to a proper migration system instead of Sequelize alter-sync. 5) Add comprehensive server-side input validation with Zod on Express routes." |
| **What security measures did you implement?** | "bcryptjs password hashing with 12 rounds, JWT authentication, Razorpay HMAC-SHA256 signature verification for payment tamper-proofing, OTP email verification, role-based route guards on both frontend (ProtectedRoute) and backend (protect middleware), CORS whitelisting, and UUID primary keys to prevent ID enumeration." |
| **Performance bottleneck & solution?** | "The queue recalculation was O(n) sequential updates — each waiting token updated individually. For small clinics (50 patients/day) this is fine, but at scale I'd batch-update with a single `UPDATE ... CASE WHEN` query. Also, the analytics endpoint runs multiple parallel DB queries using `Promise.all()` to minimize response time." |
| **How does the real-time system work?** | "Socket.IO with room-based broadcasting. When a user connects, they join either a `clinic:{id}` room (staff/doctors) or `patient:{id}` room. Server emits scoped events like `queue:updated` and `bills:updated` to the relevant rooms. Frontend hooks (`useSocket`) listen for these events and update local state. A 30-second polling fallback ensures data consistency." |
| **Explain your database design decisions.** | "UUIDs for all PKs to prevent enumeration attacks. JSON columns for flexible data like vitals and prescriptions — avoids over-normalization. Composite unique constraint on [(phone, clinicId)](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/App.jsx#145-152) for patients to support multi-clinic scenarios. Sequelize associations enable eager loading — a single query can fetch a patient with their visits and bills." |

---

## 9️⃣ Improvement Roadmap

### 🚀 Performance
- [ ] **Redis caching** for patient lookups and queue state (reduce DB load)
- [ ] **Batch queue recalculation** — single SQL `UPDATE ... CASE WHEN` instead of sequential
- [ ] **Pagination** on visits/bills list APIs (currently returns all records)
- [ ] **Lazy loading** React routes with `React.lazy()` + `Suspense`
- [ ] **Image optimization** — serve WebP assets via CDN

### 🔒 Security
- [ ] **Helmet.js** — HTTP security headers (CSP, X-Frame-Options, etc.)
- [ ] **Rate limiting** — Express rate limiter on auth endpoints (prevent brute-force)
- [ ] **Socket.IO auth** — verify JWT on WebSocket handshake, not just room join
- [ ] **Input sanitization** — server-side Zod validation on all endpoints
- [ ] **HTTPS enforcement** and secure cookie flags in production

### 🎨 UX & Features
- [ ] **Push notifications** — Web Push API for patients (no need to keep tab open)
- [ ] **Multi-language support** (i18n) — Hindi, regional languages for patient portal
- [ ] **Appointment scheduling** — pre-book time slots instead of walk-in only
- [ ] **Digital prescriptions** — PDF export with QR code verification
- [ ] **Dark mode** — already have design tokens, just need toggle
- [ ] **Lab results upload** — doctors can attach test results to visit records

### 🏗️ Infrastructure
- [ ] **CI/CD pipeline** — GitHub Actions for lint → test → build → deploy
- [ ] **Docker** — Containerize backend + MySQL for reproducible environments
- [ ] **Sequelize Migrations** — replace `sync({ alter })` with proper migrations
- [ ] **Structured logging** — Winston/Pino with log levels, request IDs, and ELK integration
- [ ] **Monitoring** — Prometheus + Grafana for API latency, Socket.IO connections, DB query time
- [ ] **TypeScript migration** — full-stack type safety

---

## 🔟 Flash Learning Cards

| # | Front (Question) | Back (Answer) |
|---|-----------------|---------------|
| 1 | What are the 4 user roles? | Admin, Doctor, Staff (Receptionist), Patient |
| 2 | What ORM is used and why? | Sequelize — model-first development, associations API, auto-sync tables |
| 3 | How are passwords secured? | bcryptjs with 12 salt rounds |
| 4 | What are the token statuses? | waiting, now, paused, lab, served, cancelled |
| 5 | How does Razorpay verification work? | HMAC-SHA256: `hash(orderId\|paymentId)` compared to received signature |
| 6 | What Socket.IO rooms exist? | `clinic:{clinicId}` (staff+doctors), `patient:{patientId}` (individual) |
| 7 | How are PDFs generated? | PDFKit in-memory buffer streaming, no disk I/O |
| 8 | What is the Patient linking strategy? | On signup, auto-link unlinked Patient records by phone or email match |
| 9 | What is the composite unique constraint? | [(phone, clinicId)](file:///d:/CODES/AWT-Project/clinicOS-Frontend/src/App.jsx#145-152) on patients table — same phone, different clinics |
| 10 | How does session restore work? | On app load, AuthContext calls `GET /api/auth/me` with stored JWT |
| 11 | What messaging channels are supported? | Email (Nodemailer), WhatsApp (Meta Cloud API), SMS (MSG91) |
| 12 | How is ETA calculated? | Average (servedAt - calledAt) for today's tokens × position in queue |
| 13 | What triggers the "2 before you" alert? | [recalculatePositions()](file:///d:/CODES/AWT-Project/clinicOS-Backend/src/services/token.service.js#59-103) checks if any token reaches `queuePosition === 2` |
| 14 | How is the frontend API layer structured? | Single Axios instance with JWT interceptor + domain-specific API objects (authAPI, tokenAPI, billAPI, etc.) |
| 15 | What happens on 401 response? | Axios interceptor clears localStorage and redirects to `/login` |

---

## 1️⃣1️⃣ 2-Minute Project Pitch

> **"I built ClinicOS — a full-stack, real-time clinic management platform that connects Receptionists, Doctors, and Patients in a single system."**
>
> **The Problem:** Indian clinics still use paper registers and manual queuing. Patients sit in crowded waiting rooms with no visibility into wait times. Bills are handwritten. There's no digital record of prescriptions or vitals.
>
> **The Solution:** ClinicOS digitizes the entire patient flow:
> - Reception issues **numbered digital tokens** — patients track their **live queue position** on their phones via WebSocket (Socket.IO).
> - Doctors conduct **digital consultations** — vitals, diagnosis, prescriptions are all recorded as structured data with autosave.
> - Bills are auto-generated with tax and discount calculations. Patients pay via **Razorpay** (UPI, Card, Netbanking) with HMAC-SHA256 signature verification for security.
> - On payment, the system generates a **PDF receipt in-memory** using PDFKit and delivers it via **Email and WhatsApp** automatically.
>
> **The Stack:** React 19 + Vite frontend, Express 5 + MySQL backend, Socket.IO for real-time, Razorpay for payments, JWT + bcryptjs for auth.
>
> **Key Engineering Decisions:**
> 1. **Room-based Socket.IO architecture** — scoped emissions ensure patients only receive their own updates, while staff see full clinic state.
> 2. **Walk-in to portal linking** — when patients sign up, the system auto-links their existing walk-in records by phone/email match.
> 3. **Server-side payment verification** — the server is the source of truth for payment status, never the client.
>
> **What I'd improve:** TypeScript migration, Redis caching for queue state, proper database migrations, and WebSocket authentication on the handshake level.
>
> **This project taught me production-level thinking** — handling real-time state synchronization across multiple user types, secure payment processing, and building a notification system that gracefully degrades across channels.

---

*Generated from deep analysis of the ClinicOS codebase — every code path, architecture decision, and technical detail is derived from the actual source code.*

---

## 📝 Doubts & Learnings Log

> **Usage:** As you study the project, ask me any doubt and I'll add the Q&A here so you can revise later.

<!-- New doubts will be appended below this line -->

### Q18: Explain the entire Backend end-to-end — architecture, packages, models, middleware, services, and edge cases (Viva Level)

**A:** The ClinicOS backend is a **Node.js + Express REST API** with a **MySQL database** managed via Sequelize ORM and real-time communication via Socket.IO. It follows a strict **MVC + Services** architecture — every layer has one responsibility.

**Tech Stack Summary:**
```
Runtime:     Node.js
Framework:   Express.js
Database:    MySQL (cloud-hosted on Aiven)
ORM:         Sequelize
Auth:        JWT (jsonwebtoken) + bcryptjs
Real-time:   Socket.IO
Email:       Nodemailer (Gmail SMTP)
WhatsApp:    Meta Cloud API (axios)
Payments:    Razorpay SDK
```

**Folder Architecture:**
```
src/
├── config/         → database.js, mailer.js, messageTemplates.js
├── models/         → 10 Sequelize models + index.js (associations)
├── middleware/     → auth.middleware.js, rbac.middleware.js, error.middleware.js
├── controllers/    → one per domain (auth, token, visit, bill, admin, analytics...)
├── routes/         → one per domain, mounts controllers + middleware
├── services/       → business logic + integrations (socket, queue, messages, Razorpay)
└── utils/          → apiResponse.js (standardized response format)
```

---

### 1. CORE NPM PACKAGES (previously unexplained)

| Package | What it is | Why used |
|---|---|---|
| `express` | Web framework for Node.js | Handles HTTP routing, middleware pipeline, req/res lifecycle |
| `sequelize` | ORM for SQL databases | Maps JS objects to MySQL tables; handles queries, associations, migrations |
| `mysql2` | MySQL driver for Node.js | Sequelize needs this as the underlying DB connector (fast, promise-based) |
| `socket.io` | WebSocket library | Bi-directional real-time events between server and all connected clients |
| `cors` | Cross-Origin Resource Sharing | Allows the React frontend (different domain/port) to call the Express API |
| `dotenv` | Environment variable loader | Loads `.env` file into `process.env` — keeps secrets out of source code |
| `helmet` | HTTP security headers | Sets safe defaults for headers like `X-Content-Type-Options`, `X-Frame-Options` |
| `express-rate-limit` | Request throttling | Limits OTP/auth endpoints to prevent brute-force attacks |
| `razorpay` | Official Razorpay Node SDK | Creates payment orders; we also use Node's `crypto` for HMAC verification |
| `nodemailer` | SMTP email client | Sends branded HTML emails (OTP, receipts, reminders) via Gmail |
| `axios` | HTTP client | Used inside `message.service.js` to call Meta's WhatsApp Cloud API |
| `crypto` | Node built-in | HMAC-SHA256 for Razorpay signature verification; `randomBytes` for reset tokens |

---

### 2. `config/database.js` — Sequelize Connection + SSL

```js
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: process.env.DB_HOST, dialect: 'mysql', logging: false,
  dialectOptions: DB_SSL === 'true' ? { ssl: { ca: DB_CA_CERT, rejectUnauthorized: true } } : {},
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
})
```
**`dialect: 'mysql'`** — tells Sequelize to use MySQL syntax and the `mysql2` driver.
**`logging: false`** — disables SQL query printing in console (clutter-free production logs).
**SSL config** — Cloud MySQL providers (like Aiven) require encrypted connections. `DB_SSL=true` enables SSL with a CA certificate from the `.env`. `rejectUnauthorized: true` means it will reject self-signed or untrusted certificates.
**Connection Pool** — instead of creating a new DB connection per request (expensive), Sequelize maintains a pool of up to 10 reusable connections. `acquire: 30000` means "wait up to 30s before giving up". `idle: 10000` means unused connections are closed after 10s.

---

### 3. `models/index.js` — The Relationship Map (11 Models)

All 10 models are imported and their **Sequelize associations** declared here. This is the single source of truth for how all data is linked.

**The 10 Models and what they represent:**
| Model | Table | Represents |
|---|---|---|
| `User` | `users` | Doctors, staff, admins, patients who have accounts |
| `Clinic` | `clinics` | A clinic entity — created by an admin on registration |
| `OtpCode` | `otp_codes` | Temporary OTP records with expiry for email verification |
| `JoinRequest` | `join_requests` | A doctor/staff's pending request to join a clinic |
| `Patient` | `patients` | The clinical patient record (may or may not have a User account) |
| `Token` | `tokens` | A queue token issued per visit — links Patient, Doctor, Clinic |
| `Visit` | `visits` | The medical record created when a consultation starts |
| `Bill` | `bills` | Financial record — line items, total, payment status |
| `MessageLog` | `message_logs` | Every automated message sent (Email/WhatsApp/SMS) |
| `AuditLog` | `audit_logs` | System audit trail — who did what and when |

**Key Associations (declared with `belongsTo` / `hasMany`):**
```js
// One-to-Many: Clinic has many Users (staff/doctors)
User.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' })
Clinic.hasMany(User, { foreignKey: 'clinicId', as: 'members' })

// Token is the central hub — it links Patient + Doctor + Clinic
Token.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' })
Token.belongsTo(User,    { foreignKey: 'doctorId',  as: 'doctor' })
Token.belongsTo(Clinic,  { foreignKey: 'clinicId',  as: 'clinic' })

// Visit is linked to Token (one-to-one relationship)
Token.hasOne(Visit, { foreignKey: 'tokenId', as: 'visit' })
Visit.belongsTo(Token, { foreignKey: 'tokenId', as: 'token' })
```

**Why declare associations?** The `as` alias enables **eager loading**:
```js
Token.findAll({ include: [{ association: 'patient', attributes: ['name', 'phone'] }] })
// → Sequelize auto-JOINs the patients table and returns patient data nested inside each token
```
Without the association, you'd have to write raw SQL JOINs manually every time.

---

### 4. `middleware/auth.middleware.js` — JWT Guard (`protect`)

```js
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]  // "Bearer <token>"
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  req.userId = decoded.userId
  next()
}
```
**What it does:** Runs before every protected route. Extracts the JWT from the `Authorization: Bearer <token>` header, verifies it with `jwt.verify()` (throws if expired or tampered), and attaches `decoded.userId` to `req` for downstream controllers.

**Why not fetch the full user here?** Speed. Every request would hit the DB just to get role/name. Instead, `protect` only sets `req.userId`. Controllers that need the full user call `User.findByPk(req.userId)` themselves. For role-checking, the `rbac` middleware does the DB lookup.

---

### 5. `middleware/rbac.middleware.js` — Role-Based Access Control

```js
const rbac = (allowedRoles) => async (req, res, next) => {
  const user = await User.findByPk(req.userId, { attributes: ['id','role','status','clinicId'] })

  if (user.status === 'suspended') return error(res, 'Account suspended', 403)
  if (['doctor','staff'].includes(user.role) && user.status === 'pending') return error(res, 'Pending approval', 403)
  if (!allowedRoles.includes(user.role)) return error(res, 'Permission denied', 403)

  req.user = user
  next()
}
```

**Usage:**
```js
router.get('/admin/stats', protect, rbac(['admin']), getStats)
router.get('/tokens',      protect, rbac(['admin', 'staff']), getTokens)
```

**3 security layers in one middleware:**
1. **Suspended check** — even if a user has a valid JWT, if admin suspended them, they get 403 immediately. This is critical because JWTs can't be "invalidated" without a server-side check.
2. **Pending check** — doctors/staff who signed up but haven't been approved by admin can't access dashboards.
3. **Role check** — `allowedRoles.includes(user.role)` ensures a doctor can't access admin routes.

**Why a curried function `rbac(['admin'])`?** The `rbac` function returns another function (`async (req, res, next)`). This is the **factory pattern** — it lets us pass the `allowedRoles` array at route-definition time while the actual middleware runs at request time.

---

### 6. `middleware/error.middleware.js` — Global Error Handler

```js
const errorHandler = (err, req, res, next) => {
  if (err.name === 'SequelizeUniqueConstraintError') return error(res, 'Record already exists', 409)
  if (err.name === 'SequelizeValidationError') return error(res, err.errors.map(e => e.message).join(', '), 400)
  return error(res, err.message || 'Internal server error', 500)
}
```
Registered last in `index.js` with `app.use(errorHandler)`. Express identifies error handlers by their **4 parameters** `(err, req, res, next)`. Any `throw` or `next(err)` call anywhere in the app lands here. It handles Sequelize-specific errors with meaningful messages instead of raw stack traces.

---

### 7. `services/socket.service.js` — Socket.IO Engine

```js
let io = null

const initSocket = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: CLIENT_URL }, pingTimeout: 60000, pingInterval: 25000 })

  io.on('connection', (socket) => {
    socket.on('join:clinic',   (clinicId)   => socket.join(`clinic:${clinicId}`))
    socket.on('join:patient',  (patientId)  => socket.join(`patient:${patientId}`))
    socket.on('disconnect', () => console.log('Socket disconnected'))
  })
  return io
}

const emitToClinic  = (clinicId,  event, data) => io.to(`clinic:${clinicId}`).emit(event, data)
const emitToPatient = (patientId, event, data) => io.to(`patient:${patientId}`).emit(event, data)
```
**`let io = null` singleton pattern** — the `io` instance is initialized once at server startup via `initSocket(httpServer)` and stored in the module-level variable. Any other service that calls `emitToClinic()` or `emitToPatient()` uses the same shared `io` instance through the module system.

**Two room types:**
- `clinic:{clinicId}` — All staff, doctors, and admin of one clinic join this room. Queue updates broadcast here.
- `patient:{patientId}` — Each patient joins their private room. Personal notifications (your turn, bill updated) go here.

**`pingTimeout: 60000, pingInterval: 25000`** — Socket.IO pings the client every 25 seconds; if no response in 60 seconds, the connection is considered dead and cleaned up. This handles silent disconnects (phone goes to sleep, network drops, etc.).

---

### 8. `services/queueEmit.service.js` — The Real-Time Broadcast Orchestrator

This is the **most important service** — called after every token status change. It:

**`emitQueueUpdate(clinicId)`:**
1. Fetches ALL today's tokens for the clinic (with patient + doctor data eagerly loaded).
2. Emits `queue:updated` to the **clinic room** — all staff/doctor screens refresh.
3. For every active token (`waiting/now/paused/lab`), calculates `tokensAhead` individually and emits `token:position` to the **patient's private room**.
4. For every `served` token, emits `token:served` to the patient's private room.

**`emitBillUpdate(patientId, clinicId)`:** Fetches updated bill list and emits `bills:updated` to the patient room AND `bill:updated` to the clinic room.

**`emitNewToken(token)`:** Emits `token:new` to the patient's room when reception issues a new token for them — the patient's dashboard home card appears instantly.

---

### 9. `services/token.service.js` — Queue Intelligence

Three utility functions that power the queue's intelligence:

**`getNextTokenNumber(clinicId)`:** Counts tokens created today for this clinic and returns `count + 1`. This means token numbers **reset to T-1 every day** — daily fresh numbering per clinic.

**`calculateETA(clinicId, doctorId)`:**
```js
const avgConsultMins = servedTokens.reduce((sum, t) =>
  sum + (new Date(t.servedAt) - new Date(t.calledAt)) / 60000
, 0) / servedTokens.length || 10  // default 10 min if no history

return waitingCount * avgConsultMins
```
Calculates estimated wait as `tokens ahead × average consultation time`. Average is derived from **actual real completed consultations today** (difference between `calledAt` and `servedAt` timestamps). Defaults to 10 minutes per patient if no data yet.

**`recalculatePositions(clinicId)`:**
- Fetches all waiting tokens sorted by `createdAt` (first-come-first-served).
- Loops and updates `queuePosition` sequentially (1, 2, 3...).
- **Triggers "2 Before You" notification** — if any token is at position 2, `sendMessage()` is called with the `two_before_you` template.

---

### 10. `services/razorpay.service.js` — Payment Security

**`createOrder({ amount })`:**
```js
amount: Math.round(normalizedAmount * 100)  // INR → paise (₹499 → 49900)
```
Razorpay requires amounts in the smallest currency unit (paise). `Math.round()` prevents float precision issues.

**`verifySignature(orderId, paymentId, signature)` — THE MOST CRITICAL SECURITY CHECK:**
```js
const body     = orderId + '|' + paymentId
const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex')
return expected === signature
```
After the patient pays, Razorpay sends back 3 values: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`. The signature is `HMAC-SHA256(orderId + "|" + paymentId, secretKey)`. We recompute it server-side and compare. If they don't match → someone tampered with the payment. This prevents fake payment success callbacks.

---

### 11. `services/message.service.js` — Multi-channel Notification Engine

Sends messages via **3 channels** based on what's configured:
- **Email** via `nodemailer` + Gmail SMTP → branded HTML email with ClinicOS gradient header.
- **WhatsApp** via Meta Cloud API v18.0 → `axios.post('https://graph.facebook.com/...')` with `Bearer` token auth. Falls back to console log in dev if not configured.
- **SMS** → similar pattern (Twilio/MSG91 integration).

**Template system** (`config/messageTemplates.js`): All message content is defined as templates with variable placeholders:
```js
'token_issued': { subject: 'Your Token', body: 'Hi {{patient_name}}, T-{{token_number}} issued.' }
```
`renderTemplate(templateName, variables)` does a simple string replacement. This separates content from delivery logic.

**Logging** — every send attempt writes a `MessageLog` record (`sent` or `failed`) regardless of outcome. This is what the admin's MessageLogs screen reads.

---

### 12. The `protect` + `rbac` Middleware Chain in Practice

```
Request: GET /api/admin/stats
   │
   ▼
protect          → reads JWT → sets req.userId = 42
   │
   ▼
rbac(['admin'])  → fetches User#42 from DB → checks status + role
   │
   ▼
getStats()       → controller runs, reads req.user.clinicId → returns clinic-scoped stats
```

---

### 🚨 Backend Edge Cases & How They're Handled

| Edge Case | How it's handled |
|---|---|
| **Suspended user with valid JWT** | `rbac` fetches live user status — JWT being valid doesn't matter; DB status wins |
| **Pending doctor tries to access dashboard** | `rbac` checks `status === 'pending'` → 403 with explanation |
| **Two requests try to create token at same time** | `getNextTokenNumber` uses `Token.count()` which runs atomic SQL COUNT — race condition safe |
| **No ETA data yet (first patient of day)** | `calculateETA` defaults to 10 min per patient if no `served` tokens exist yet |
| **Razorpay API is down** | `parseRazorpayError` checks `ENOTFOUND/ECONNRESET/ETIMEDOUT` → 502 with friendly message |
| **Payment amount is ₹0** | `createOrder` checks `normalizedAmount <= 0` → throws 400 before hitting Razorpay |
| **Tampered payment response** | `verifySignature` HMAC mismatch → returns `false` → controller rejects with 400 |
| **DB connection drops** | Sequelize connection pool retries within `acquire: 30000` ms timeout |
| **Cloud MySQL requires SSL** | `DB_SSL=true` env var switches on `ssl: { rejectUnauthorized: true }` |
| **WhatsApp not configured** | `sendWhatsApp` checks for `WHATSAPP_API_KEY` → silently logs to console in dev, skips send |
| **Sequelize unique constraint violation** | `errorHandler` catches `SequelizeUniqueConstraintError` → 409 "record already exists" |
| **Unknown Sequelize validation error** | `errorHandler` maps `err.errors.map(e => e.message)` → joins all messages into one string |
| **Socket.IO client goes silent** | `pingTimeout: 60000` — server detects dead connection within 60s and disconnects cleanly |

### Q17: Explain the entire Admin Portal end-to-end — all files, features, libraries, and edge cases (Viva Level)

**A:** The Admin Portal is the **"Command Center" of ClinicOS**. The admin is the clinic owner — they never directly interact with patients, but they control everything behind the scenes: approving who joins their clinic, managing their team, viewing performance analytics, and monitoring every automated message the system sends. It is the **highest-privilege portal** in the entire application.

The portal consists of **6 pages + NO separate layout file** — the admin re-uses `ReceptionLayout.jsx` but renders a different set of navigation links via the `NAV` config defined in `App.jsx` for the `/admin` route group. Pages:
```
/admin              → AdminOverview.jsx     (Dashboard: stats + clinic code)
/admin/join-requests → JoinRequests.jsx    (Approve/reject doctor & staff sign-ups)
/admin/team         → TeamManagement.jsx   (Suspend/reactivate active members)
/admin/analytics    → Analytics.jsx        (Rich charts — revenue, wait, throughput, complaints)
/admin/messages     → MessageLogs.jsx      (All automated messages sent to patients)
/admin/settings     → ClinicSettings.jsx   (Edit clinic name, address, specialty + copy join code)
```

---

### FILE 1: `AdminOverview.jsx` — The Command Dashboard

**What it does:** The admin's home page. Shows 4 quick-stat cards (Doctors, Staff, Total Patients, Pending Requests) and prominently displays the **Clinic Join Code** — the most important piece of information for an admin to share with new staff.

#### 📦 New Import: `adminAPI` from `../../services/api`
A dedicated Axios group for admin-only endpoints, all protected by `role === 'admin'` middleware on the backend:
- **`adminAPI.getStats()`** → `GET /api/admin/stats` — counts of doctors, staff, patients, pending join requests.
- **`adminAPI.getJoinRequests()`** → `GET /api/admin/join-requests` — all pending/approved/rejected requests.
- **`adminAPI.reviewRequest(id, action)`** → `PATCH /api/admin/join-requests/:id` — approves or rejects one request.
- **`adminAPI.getTeam()`** → `GET /api/admin/team` — list of all approved members.
- **`adminAPI.updateMember(id, action)`** → `PATCH /api/admin/members/:id` — suspend or reactivate a member.
- **`adminAPI.getClinic()`** → `GET /api/admin/clinic` — returns clinic details for the settings form.
- **`adminAPI.updateClinic(data)`** → `PATCH /api/admin/clinic` — saves edited clinic details.

#### 🔧 Feature: `navigator.clipboard.writeText()` — One-Click Code Copy (Line 71)
```js
onClick={() => navigator.clipboard.writeText(user.clinicCode)}
```
`navigator.clipboard` is a **Web API** (not React, not a library) built into all modern browsers. `.writeText(text)` writes a string to the system clipboard asynchronously. The admin clicks "Copy Code", the clinic join code is instantly in their clipboard — ready to paste into WhatsApp or email. No external library needed. Note: it requires a **secure context** (HTTPS or localhost) to work.

---

### FILE 2: `JoinRequests.jsx` — The Gatekeeper

**What it does:** When a doctor or staff member signs up with the clinic's join code, they don't get access immediately — a `JoinRequest` record is created with `status: 'pending'`. The admin sees these requests here and can **Approve** or **Reject** each one.

#### 🔧 Feature 1: `ROLE_CONFIG` + `STATUS_CONFIG` dual-lookup maps (Lines 5–14)
Two configuration objects drive all the badge colors and icons on each card:
```js
const ROLE_CONFIG   = { doctor: { icon: Stethoscope, color: '...', bg: '...' }, staff: {...} }
const STATUS_CONFIG = { pending: {...}, approved: {...}, rejected: {...} }
```
For each request `req`, the component does:
```js
const roleConfig   = ROLE_CONFIG[req.user?.role]   || ROLE_CONFIG.staff   // fallback to staff
const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending    // fallback to pending
```
Both role badge and status badge are rendered by just reading from these config objects — no `if/else` chains anywhere in the JSX.

#### 🔧 Feature 2: `handleAction` — Optimistic Local State Update (Lines 32–45)
```js
const handleAction = async (id, action) => {
  setActing(id)                          // shows spinner on ONLY this row's button
  await adminAPI.reviewRequest(id, action)
  setRequests(prev => prev.map(r =>     // ← Optimistic update — no full refetch
    r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
  ))
}
```
After the API call succeeds, instead of re-fetching the entire list, we use `.map()` to find the matching request by `id` and update its `status` in-place. This is an **optimistic state update** — the UI changes instantly without a loading spinner or re-fetch. The `setActing(id)` pattern shows a spinner only on the specific row being acted on, not the entire page.

**Why only show buttons for `pending` requests?** `req.status === 'pending' && (...)` — once approved or rejected, the decision is final. The buttons disappear and the status badge persists as a permanent record.

---

### FILE 3: `TeamManagement.jsx` — The Roster Manager

**What it does:** Shows all **currently approved** team members (doctors + staff). The admin can **Suspend** an active member (blocking their access) or **Reactivate** a suspended one.

#### 🔧 Feature 1: Client-side Filter Tabs — no API per tab (Lines 5, 34–38)
```js
const FILTERS = ['All', 'Doctors', 'Staff']
const filtered = members.filter(m => {
  if (filter === 'Doctors') return m.role === 'doctor'
  if (filter === 'Staff')   return m.role === 'staff'
  return true  // 'All'
})
```
All members are fetched **once** (`adminAPI.getTeam()`). Switching between "All / Doctors / Staff" tabs does **not** trigger a new API call — it just re-filters the already-loaded `members` array in memory. This is a key performance pattern for small datasets.

#### 🔧 Feature 2: Toggle Button — Context-Sensitive Suspend/Reactivate (Lines 108–124)
```js
onClick={() => handleAction(member.id, member.status === 'approved' ? 'suspend' : 'reactivate')}
```
The **same button** changes its label, icon, and color based on the member's current status:
- `approved` → shows `<ShieldOff /> Suspend` in red.
- `suspended` → shows `<ShieldCheck /> Reactivate` in teal.

The same `handleAction` optimistic update pattern from `JoinRequests` is reused here.

---

### FILE 4: `Analytics.jsx` — The Intelligence Dashboard (Most Complex Page)

**What it does:** A rich, interactive analytics dashboard with filterable time ranges, doctor-level filtering, 8 KPI cards, 4 data charts, and a doctor utilization comparison table. Every chart section has a "Export CSV" button.

#### 📦 NEW Library: `recharts` (Lines 2–15)
**What it is:** A composable charting library for React built on top of SVG. Chosen over Chart.js because it uses **React components** natively — you compose charts by nesting JSX elements.

**Chart types used:**
| Component | Type | Used for |
|---|---|---|
| `<BarChart>` + `<Bar>` | Vertical bar chart | Revenue by Day, Top Complaints (horizontal) |
| `<LineChart>` + `<Line>` | Line chart | Average Wait Trend over days |
| `<AreaChart>` + `<Area>` | Area/filled line chart | Patient Throughput by hour |
| `<ResponsiveContainer>` | Wrapper | Makes every chart fill its parent div's width automatically |
| `<CartesianGrid>` | Grid lines | Adds dashed grid for readability |
| `<XAxis>` / `<YAxis>` | Axis labels | Configures tick formatting, font, line visibility |
| `<Tooltip>` | Hover popup | Shows values on hover — customized via `content={<ChartTooltip />}` |
| `<Cell>` | Per-bar coloring | Gives each bar in "Top Complaints" a different color from `COMPLAINT_BAR_COLORS` |

**`<linearGradient>` inside `<defs>`** (Lines 595–599): SVG gradient fill for the AreaChart. The gradient goes from 35% opacity at the top to 4% at the bottom, creating the classic "filled area chart" visual. This is raw SVG inside JSX — no library needed for the gradient itself.

#### 📦 NEW: `analyticsAPI` + `clinicAPI` (Line 29)
Two more API groups:
- **`analyticsAPI.getOverview(params)`** → KPI summary (patients, revenue, avg wait, etc.)
- **`analyticsAPI.getRevenue(params)`** → daily revenue array for bar chart.
- **`analyticsAPI.getQueue(params)`** → avg wait by day + throughput by hour.
- **`analyticsAPI.getComplaints(params)`** → top complaint keywords from visit records.
- **`analyticsAPI.getDoctors(params)`** → per-doctor performance table.
- **`clinicAPI.getDoctors()`** → fetches the doctor list for the filter dropdown.

#### 🔧 Feature 1: `Promise.all` — Parallel API fetching (Lines 263–269)
```js
const [overviewRes, revenueRes, queueRes, complaintsRes, doctorsRes] = await Promise.all([
  analyticsAPI.getOverview(params),
  analyticsAPI.getRevenue(params),
  analyticsAPI.getQueue(params),
  analyticsAPI.getComplaints(params),
  analyticsAPI.getDoctors(params),
])
```
Instead of fetching 5 API endpoints **sequentially** (which would take 5× the round-trip time), `Promise.all` fires all 5 simultaneously and waits for all to complete. Array destructuring then assigns each response to its variable. If any one fails, the entire `.catch()` fires.

#### 🔧 Feature 2: Date Range Selector — 4 modes + Custom Guard (Lines 42–47, 284–288)
```js
const RANGE_OPTIONS = [{ id: 'today' }, { id: '7days' }, { id: '30days' }, { id: 'custom' }]

useEffect(() => {
  if (range !== 'custom' || (customStart && customEnd)) {
    fetchAll()   // only fetch if NOT in custom mode, OR if both custom dates are filled
  }
}, [range, customStart, customEnd, fetchAll])
```
When the admin selects "Custom", two date inputs appear. The `useEffect` guard `(range !== 'custom' || (customStart && customEnd))` prevents API calls while only one date is filled — avoids a broken request with only a start date and no end date.

#### 🔧 Feature 3: RAG (Red-Amber-Green) Queue Health Status (Lines 49–71, 293)
```js
const RAG = {
  green: { label: 'Healthy', note: 'Wait within target' },        // avgWait < 25min
  amber: { label: 'Warning', note: 'Wait above 25 min' },         // avgWait 25-45min
  red:   { label: 'Critical', note: 'Wait above 45 min' },        // avgWait > 45min
}
const queueHealth = RAG[kpis.queueHealth || 'green']
```
The backend calculates which RAG status applies based on `avgWaitMins` and returns the key `'green'`, `'amber'`, or `'red'`. The frontend does a single lookup — one object, one key, full display config. The green dot also has `animate-pulse` applied when status is `'green'` — a small UX detail showing "all is well".

#### 🔧 Feature 4: `Trend` component — TrendingUp/Down/Flat (Lines 117–141)
```js
function Trend({ value }) {
  if (value > 0) return <span><TrendingUp /> +{value}%</span>   // teal
  if (value < 0) return <span><TrendingDown /> {value}%</span>  // coral
  return <span><Minus /> 0%</span>                              // muted
}
```
A tiny pure presentational component that accepts a `value` (percentage change vs previous period) and renders the appropriate icon + color. The backend computes trends by comparing current period to the equivalent prior period.

#### 🔧 Feature 5: `exportCsv` — Pure JS CSV Download (Lines 97–115)
```js
const exportCsv = (rows, filename) => {
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(row => headers.map(h => escape(row[h])).join(','))].join('\n')
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  URL.revokeObjectURL(url)
}
```
No library — pure browser APIs:
- `Object.keys(rows[0])` → extracts column headers from the first data object.
- `Blob` → creates a binary file object in memory with `'\uFEFF'` (BOM prefix) prepended to ensure Excel reads UTF-8 correctly.
- `URL.createObjectURL(blob)` → creates a temporary browser URL pointing to the blob.
- `document.createElement('a')` → creates an invisible `<a>` tag, sets its `href` to the blob URL and `download` to the filename, then programmatically `.click()`s it.
- `URL.revokeObjectURL(url)` → immediately frees the memory after click.

The `escape` function wraps each value in double-quotes and escapes internal quotes (`"` → `""`) — standard CSV encoding.

#### 🔧 Feature 6: `Intl.NumberFormat` for Indian Currency (Lines 82–90)
```js
new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(amount)
```
`Intl.NumberFormat` is a built-in JavaScript internationalization API. `'en-IN'` locale formats numbers in Indian convention — lakhs and crores (1,00,000 not 100,000). `style: 'currency'` with `currency: 'INR'` adds the `₹` symbol. This is zero-dependency professional number formatting.

#### 🔧 Feature 7: Doctor Utilisation Table — Inline RAG colors (Lines 703–713)
```js
className={doctor.avgWaitMins > 45 ? 'text-accent-coral' : doctor.avgWaitMins > 25 ? 'text-amber-600' : 'text-accent-teal'}
```
The same RAG logic is applied inline per-doctor in the table. Each doctor's average wait is color-coded — red if critical, amber if warning, teal if healthy. The admin can instantly spot which doctors have long queues.

---

### FILE 5: `MessageLogs.jsx` — The Communication Audit Trail

**What it does:** Shows every automated message the system sent to patients — token issued, your turn, bill receipts, follow-up reminders, etc. — across Email, WhatsApp, and SMS channels. The admin can filter by channel and status (sent/failed) and see delivery statistics.

#### 🔧 Feature 1: Three-way config maps (Lines 5–28)
```js
const CHANNEL_CONFIG  = { email: { icon: Mail, color: '...' }, whatsapp: {...}, sms: {...} }
const STATUS_CONFIG   = { sent: {...}, delivered: {...}, failed: {...} }
const TEMPLATE_LABELS = { 'token_issued': 'Token Issued', 'your_turn': 'Your Turn', ... }
```
Three lookup maps convert raw database enum values (like `'whatsapp'`, `'failed'`, `'two_before_you'`) into human-readable labels, colors, and icons. `TEMPLATE_LABELS[log.template] || log.template` — falls back to the raw template name if a new template was added but not yet mapped.

#### 🔧 Feature 2: `Promise.all` for simultaneous stats + logs fetch (Lines 44–53)
```js
Promise.all([messageAPI.getLogs(params), messageAPI.getStats()])
  .then(([logsRes, statsRes]) => { setLogs(...); setStats(...) })
```
Stats (total sent / successful / failed / today) and the log list are fetched in parallel. Whenever `filter` or `statusFilter` changes, the `useEffect` re-runs and both are refreshed simultaneously.

#### 🔧 Feature 3: `grid-cols-12` Table Layout (Line 138)
The log table is built with CSS Grid (`grid-cols-12`) rather than an HTML `<table>` element. Each row has 5 columns mapped to 3+3+2+2+2 = 12 grid units. This gives flexible, responsive column widths without managing `<colgroup>` or `colspan` attributes. The header row and each data row both use the same `grid-cols-12 gap-2 px-4` to ensure perfect column alignment.

---

### FILE 6: `ClinicSettings.jsx` — The Clinic Profile Editor

**What it does:** Allows the admin to edit clinic details (name, address, phone, specialty) using a validated form. Also shows the clinic join code with a "Copy" button that provides a 2-second visual confirmation.

#### 🔧 Feature 1: `reset()` from `react-hook-form` to pre-fill form (Lines 33–38)
```js
const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(schema) })

useEffect(() => {
  adminAPI.getClinic().then(res => {
    reset({ name: c.name, address: c.address, phone: c.phone, specialty: c.specialty })
  })
}, [])
```
`reset(values)` from `react-hook-form` programmatically sets all form field values after the async API call returns clinic data. Without `reset`, the inputs would start empty even though data exists. This is the standard pattern for **edit forms** in react-hook-form — call `reset()` inside the `useEffect` after fetching.

#### 🔧 Feature 2: Reusing `Field`, `inputCls`, `ErrorAlert` from `PatientSignup` (Line 7)
```js
import { Field, inputCls, ErrorAlert } from '../auth/PatientSignup'
```
These are utility components and functions originally defined for the patient signup form and **re-exported** for reuse. `Field` wraps a label + input + error message; `inputCls(error)` returns conditional CSS classes (error state vs normal state). This is **component reuse across pages** — a clean architecture decision.

#### 🔧 Feature 3: 2-Second Copy Confirmation (Lines 58–62)
```js
const copyCode = () => {
  navigator.clipboard.writeText(clinicCode)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
// In JSX:
{copied ? <Check size={15} /> : <Copy size={15} />}
{copied ? 'Copied!' : 'Copy'}
```
After copy: icon switches to a checkmark, text changes to "Copied!", then reverts after 2 seconds. Same pattern used in `AdminOverview` but with the 2s timeout for UX confirmation.

---

### 🚨 Edge Cases & How Admin Portal Handles Them

| Edge Case | How it's handled |
|---|---|
| **Admin tries to see other clinic's data** | Backend middleware validates `clinicId` from JWT — all admin queries are scoped to the admin's own clinic |
| **Custom date range with only start date** | `(customStart && customEnd)` guard in `useEffect` — API is not called until both dates are filled |
| **`Promise.all` partial failure in Analytics** | `.catch()` at the end fires for ANY failure — sets `errorMessage` and shows the entire error section |
| **Empty chart data** | `<EmptyChart>` component renders a placeholder with a message instead of a broken chart |
| **`navigator.clipboard` unavailable (HTTP)** | Only fails silently — no try/catch was added; fine since the app is HTTPS in production |
| **Filter tab changes in MessageLogs** | `useEffect` dependency on `[filter, statusFilter]` re-runs both `getLogs` + `getStats` — filter is sent as a query param |
| **Unknown message template key** | `TEMPLATE_LABELS[log.template] || log.template` — shows raw key as fallback |
| **Approve/Reject button state during API call** | `setActing(id)` → both buttons disabled via `disabled={acting === req.id}` — prevents double-click |
| **Clinic code copy on Safari/iOS** | `navigator.clipboard.writeText` is async — it returns a Promise, but the code doesn't await it; Safari may silently fail without user gesture context; acceptable tradeoff |
| **Doctor avg wait color coding** | Three-way ternary in `className` prop — RAG colors applied at render time from the DB value |

### Q16: Explain the entire Patient Portal end-to-end — all files, features, libraries, and edge cases (Viva Level)

**A:** The Patient Portal is the **most consumer-facing part of ClinicOS**. It is what the patient uses on their phone — to see their queue position in real-time, review past prescriptions, track outstanding bills, and pay online. It is deliberately designed like a **mobile app**, not a desktop web page.

The portal consists of **1 layout + 5 pages + 1 custom hook:**
```
/patient              → PatientDashboard.jsx  (Home — queue card + recent visits + bills)
/patient/queue        → QueueTracker.jsx      (Live queue position tracker)
/patient/history      → VisitHistory.jsx      (Full medical history with expandable cards)
/patient/bills        → BillHistory.jsx       (Bill list + online payment via Razorpay)
/patient/profile      → PatientProfile.jsx    (Profile info — name, phone, DOB etc.)
/patient/notifications → NotificationLog.jsx  (Message / notification history)

layouts/PatientLayout.jsx  (Mobile shell — topbar + BOTTOM NAV + Outlet)
hooks/useRazorpay.js       (Custom hook for Razorpay payment gateway)
```

---

### FILE 1: `PatientLayout.jsx` — The Mobile Portal Shell

**What it does:** The patient layout is structured like a **native mobile app**. It has a sticky topbar at the top and a **fixed bottom navigation bar** — exactly like WhatsApp or Google Maps. The sub-pages are injected via `<Outlet />` in the `<main>` block which has `pb-24` (padding bottom of 96px) to prevent content from being hidden behind the bottom nav.

**`max-w-lg mx-auto`** — The entire portal is constrained to 512px max width centered in the browser. This makes it look and feel like a mobile app even on a desktop browser.

#### 🔧 New: Bottom Navigation Bar (Lines 59–78)
```jsx
<nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t ...">
  {NAV.map(({ to, label, icon: Icon, end }) => (
    <NavLink ...>
      {({ isActive }) => (
        <>
          <Icon size={20} className={isActive ? 'text-crimson-500' : 'text-text-muted'} />
          {label}
        </>
      )}
    </NavLink>
  ))}
</nav>
```
`NavLink` here uses the **render prop pattern** — instead of passing a string to `className`, it passes a function to `children` as `{({ isActive }) => ...}`. This is so we can change **both the icon color AND the label color** based on `isActive`, not just the className of the container.

**`fixed bottom-0 left-1/2 -translate-x-1/2`** — This CSS keeps the bottom nav fixed at the bottom of the viewport, centered horizontally, exactly matching the `max-w-lg` content width. The `z-30` ensures it always floats above page content.

---

### FILE 2: `PatientDashboard.jsx` — The Home Screen

**What it does:** A personalized home screen that shows: a greeting, the patient's active queue token (if any), 3 recent visits, and 3 recent bills — all fetched in a single API call.

#### 📦 New Import: `patientPortalAPI` (Line 4)
A dedicated set of Axios-based API functions **exclusively for the patient role**. This is separate from `patientAPI` (used by reception) because the patient portal endpoints are protected by the patient's JWT and return data scoped only to that patient. Key functions:
- **`patientPortalAPI.getDashboard()`** → `GET /api/patient-portal/dashboard` — single endpoint returning `activeToken + recentVisits + recentBills` in one request.
- **`patientPortalAPI.getActiveToken()`** → `GET /api/patient-portal/queue` — used by `QueueTracker`.
- **`patientPortalAPI.getVisits()`** → `GET /api/patient-portal/visits` — full visit history.
- **`patientPortalAPI.getBills()`** → `GET /api/patient-portal/bills` — full bill history.
- **`patientPortalAPI.leaveQueue()`** → `DELETE /api/patient-portal/queue` — cancels the active token.
- **`patientPortalAPI.createRazorpayOrder(billId)`** → creates a Razorpay order for online payment.
- **`patientPortalAPI.verifyPayment(billId, payload)`** → verifies the Razorpay signature server-side.

#### 🔧 Feature 1: `localStorage` for patient ID (Lines 23–25)
```js
if (d.patient?.id) {
  localStorage.setItem('clinicos_patient_id', d.patient.id)
}
```
When the dashboard loads, the patient's `id` is saved to `localStorage` under the key `clinicos_patient_id`. This is then used in `useSocket.js`:
```js
const patientId = localStorage.getItem('clinicos_patient_id')
if (user.role === 'patient' && patientId) {
  socket.emit('join:patient', patientId)
}
```
This joins the patient into their **personal private WebSocket room** on the server. Events like `token:position`, `token:served`, `bill:updated` are then targeted at this room. Without the `localStorage` ID, the patient's socket would never know which queue events to listen to.

#### 🔧 Feature 2: 4 WebSocket Event Listeners (Lines 34–63)
The patient dashboard listens to 4 different socket events simultaneously:
| Event | What it does |
|---|---|
| `onTokenNew` | A new token was issued for this patient — trigger a full dashboard refresh so the active token card appears |
| `onTokenPosition` | Queue position changed — surgically updates only `activeToken` in the `data` state using the spread pattern |
| `onTokenServed` | Doctor completed the consultation — full refresh to clear the active token card |
| `onBillsUpdated` | A new bill was created — updates only `recentBills` slice without a full refresh |

**Surgical state update pattern:**
```js
setData(prev => ({
  ...prev,                              // keep everything else
  activeToken: { ...prev.activeToken, ...tokenData }  // only update changed fields
}))
```
Instead of re-fetching the entire dashboard on every queue update (which would be slow and cause flicker), only the specific fields that changed are updated in-place using the spread operator. This is an optimization for real-time data.

#### 🔧 Feature 3: Active Token Card — Context-Aware Status Display (Lines 93–153)
The active token card dynamically changes its content based on `activeToken.status`:
- `status === 'now'` → `'🎉 Your Turn!'` badge with a pulsing animation.
- `status === 'paused'` → `'On Hold'` message.
- `status === 'lab'` → `'In Lab'` message.
- `status === 'waiting'` → `#X in queue` with estimated wait time.

The card is also fully clickable — `onClick={() => navigate('/patient/queue')}` — taking the patient directly to the live tracker.

---

### FILE 3: `QueueTracker.jsx` — Live Queue Position Screen

**What it does:** A dedicated full-screen view of the patient's current queue token with real-time position tracking, an estimated wait time, a visual "journey" progress timeline, and the ability to leave the queue.

#### 🔧 Feature 1: `STATUS_UI` Map (Lines 7–28)
Similar to the `STATUS` and `STATUS_COLOR` maps in the staff/doctor portals, this maps each token status to a display-friendly UI object:
```js
const STATUS_UI = {
  waiting: { emoji: '⏳', label: 'Waiting', message: 'Please wait...', color: '...', bg: '...' },
  now:     { emoji: '🎉', label: 'Your Turn!', message: 'Please proceed...', ... },
  paused:  { emoji: '⏸️', label: 'On Hold', ... },
  lab:     { emoji: '🔬', label: 'In Lab', ... },
}
```
`const ui = STATUS_UI[tokenData.status]` — one lookup replaces a chain of `if/else` blocks.

#### 🔧 Feature 2: `onTokenPosition` — Surgical Real-time Update (Lines 61–73)
```js
onTokenPosition: (data) => {
  setTokenData(prev => {
    if (!prev || prev.id !== data.tokenId) return prev  // guard: only update MY token
    return { ...prev, status: data.status, queuePosition: data.queuePosition,
             estimatedWait: data.estimatedWait, tokensAhead: data.tokensAhead }
  })
}
```
**The `prev.id !== data.tokenId` guard** is critical — the socket broadcasts position updates for all tokens in the clinic. Without this check, updates for other patients' tokens would overwrite this patient's data. The comparison ensures only updates matching the currently displayed `tokenId` are applied.

#### 🔧 Feature 3: Visual "Patients Ahead" Progress Dots (Lines 165–186)
```js
Array.from({ length: Math.min(tokenData.tokensAhead + 1, 10) }).map((_, i) => (
  <div className={i < tokenData.tokensAhead ? 'bg-cream-300' : 'bg-crimson-500 scale-125'} />
))
```
`Array.from({ length: N })` creates an array of `N` empty slots, then `.map()` renders a small circle for each. Grey circles = patients ahead; the last crimson circle (scaled up slightly) = the patient themselves. Capped at 10 dots for visual clarity — `+X more` text is shown if more than 9 patients are ahead.

#### 🔧 Feature 4: The Journey Progress Timeline (Lines 219–244)
A data-driven progress tracker rendered from an array of steps:
```js
[
  { icon: CheckCircle, label: 'Token issued',        done: true },
  { icon: Clock,       label: 'Waiting in queue',    done: ..., active: status === 'waiting' },
  { icon: Activity,    label: 'Called by doctor',    done: ..., active: status === 'now' },
  { icon: FlaskConical,label: 'Lab tests (if ordered)', active: status === 'lab' },
  { icon: CheckCircle, label: 'Consultation complete', done: status === 'served' },
]
```
Each step gets a circle icon that is: teal (done), pulsing crimson (active/current step), or grey (upcoming). The `line-through` CSS style is applied to completed step labels. This gives the patient a visual sense of progress without them needing to understand queue jargon.

#### 🔧 Feature 5: Connection Status Indicator (Lines 260–264)
```jsx
<span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-accent-teal' : 'bg-accent-coral'}`} />
{connected ? 'Live' : 'Reconnecting...'} · Updated {lastUpdated.toLocaleTimeString(...)}
```
A tiny coloured dot + text at the bottom of the screen tells the patient whether their data is live (WebSocket connected → green dot) or reconnecting (orange dot). Last updated time is shown in `HH:MM:SS` format using `Date.toLocaleTimeString()` with `en-IN` locale.

---

### FILE 4: `VisitHistory.jsx` — Expandable Medical Records

**What it does:** Shows the patient's complete consultation history as a list of collapsible/expandable cards. Each card shows the complaint, doctor name, and date — click it to expand and see the full diagnosis, prescriptions, tests ordered, vitals, and follow-up date.

#### 🔧 Feature: Accordion Expand/Collapse — Single `expanded` state (Lines 8, 57)
```js
const [expanded, setExpanded] = useState(null)  // holds the ID of the open card (or null)
onClick={() => setExpanded(expanded === visit.id ? null : visit.id)}
```
Only **one visit ID** is stored in state. Clicking a card that is already open (`expanded === visit.id`) collapses it by setting `null`. Clicking any other card opens it and automatically collapses the previously open one. This is the standard accordion pattern — zero extra libraries.

**Vitals filtering** (Line 159): `Object.values(visit.vitals).some(Boolean)` checks if AT LEAST ONE vital was recorded before rendering the section. `Object.entries().filter(([,v]) => v)` uses a destructuring shorthand — the `[,v]` skips the key and only binds the value, then filters out falsy (empty) vitals.

---

### FILE 5: `BillHistory.jsx` — Bills + Online Payment via Razorpay

**What it does:** Shows all bills (split into Unpaid vs Paid sections). For unpaid bills, a "Pay Now" button opens a **bottom sheet modal** where the patient can choose UPI, Card, or Cash and pay online via Razorpay.

#### 📦 New Import: `useRazorpay` custom hook (Line 3)
**What it is:** A custom hook defined in `hooks/useRazorpay.js` that wraps the **Razorpay checkout modal** into a clean `openCheckout(orderData, onSuccess, onFailure)` function.

**How Razorpay works (3-step flow):**
```
Step 1 (Backend): patientPortalAPI.createRazorpayOrder(billId)
       → Backend calls Razorpay API → creates an order → returns { orderId, amount, currency, keyId }

Step 2 (Frontend): openCheckout(order, onSuccess, onFailure)
       → new window.Razorpay(options) → rzp.open()
       → Razorpay's own checkout modal appears (their hosted UI — bank cards, UPI, etc.)
       → Patient completes payment → Razorpay calls `handler(response)` with payment ID + signature

Step 3 (Backend verification): patientPortalAPI.verifyPayment(billId, { razorpay_payment_id, razorpay_order_id, razorpay_signature })
       → Backend uses HMAC-SHA256 to verify the signature is authentic → marks bill as 'paid'
```
**Why 3 steps?** The payment amount and order are created on the **backend** so the patient cannot manipulate the price. The signature verification is also on the backend so a hacker cannot simply send a fake success response.

**`window.Razorpay` check** (Line 7): The Razorpay JS SDK is loaded via a `<script>` tag in `index.html`. If the script fails to load (network issue), `window.Razorpay` is undefined — the hook detects this and calls `onFailure` with a user-friendly error.

#### 🔧 Feature: Payment Bottom Sheet (Lines 165–256)
When the patient clicks "Pay Now":
- `setPayingBill(bill)` → state holds the selected bill.
- The bottom sheet slides up via `fixed inset-0 bg-black/50` overlay + `items-end` flexbox alignment.
- Inside: bill summary → payment method selector (UPI/Card/Cash) → Pay button.
- If `paymentMethod === 'cash'` → `handlePayCash()` marks it paid immediately (for patients who prefer paying in person but acknowledging it via the app).
- If UPI or Card → `handlePayOnline()` → Razorpay flow.

#### 🔧 Feature: `onBillsUpdated` Socket Listener (Lines 34–38)
When the receptionist marks a bill as paid from their screen, a `bills:updated` WebSocket event is emitted. `BillHistory` listens to this and updates `setBills(data.bills)` — so if a patient is looking at their bills screen when the receptionist marks it paid, the screen automatically updates from "Unpaid" to "Paid" with no page reload.

---

### 🚨 Edge Cases & How Patient Portal Handles Them

| Edge Case | How it's handled |
|---|---|
| **Patient has no active token** | Dashboard shows a dashed placeholder card; QueueTracker shows "No Active Token" empty state |
| **`onTokenPosition` event for another patient's token** | `prev.id !== data.tokenId` guard — silently ignores events not matching the current token |
| **Razorpay JS fails to load** | `window.Razorpay` check → calls `onFailure` with user-friendly message |
| **Payment verification fails** | `verifyPayment` error → `setErrorMsg('Payment verification failed. Contact support.')` shown in bottom sheet |
| **Patient cancels the Razorpay modal** | `modal.ondismiss` callback → `onFailure(new Error('Payment cancelled by user'))` |
| **Patient clicks "Leave Queue"** | `window.confirm()` → calls `patientPortalAPI.leaveQueue()` → redirects to `/patient` home |
| **More than 9 patients ahead** | Progress dots capped at 10; `+X more` text shown |
| **Vitals section with all empty fields** | `Object.values(vitals).some(Boolean)` check → section not rendered at all |
| **Socket disconnected** | `connected` state → orange "Reconnecting..." dot in QueueTracker; `useAutoRefresh` polls every 30s |
| **Patient navigates directly to /patient/queue with no token** | `!tokenData` check after loading → "No Active Token" empty state with explanation |
| **Bill list with >2 items** | `bill.items.slice(0, 2)` + `+N more` text — keeps bill card compact |

### Q15: Explain the entire Doctor Portal end-to-end — all files, features, libraries, and edge cases (Viva Level)

**A:** The Doctor Portal is what the physician uses throughout the clinic day. It is a **3-screen system** for managing their personal patient queue, conducting and recording consultations, and viewing patient history. It is designed around one principle: **a doctor should spend zero time managing software and 100% time with their patient**.

The portal consists of **1 layout + 3 pages:**
```
/doctor            → DoctorQueue.jsx       (Personal live queue)
/doctor/consult/:tokenId → ConsultationForm.jsx  (Full medical record + prescriptions)
/doctor/patients   → DoctorPatients.jsx    (Coming soon — patient directory)

layouts/DoctorLayout.jsx  (Shared topbar + navigation shell)
```

---

### FILE 1: `DoctorLayout.jsx` — The Portal Shell

**What it does:** Every page inside the doctor portal shares a common `DoctorLayout` — a sticky dark topbar with the ClinicOS branding, navigation links, and the doctor's name + logout button. Sub-pages are injected via `<Outlet />`.

#### 📦 New Import: `NavLink` from `react-router-dom` (Line 1)
**What it is:** Like `<Link>`, but **smarter**. It automatically detects if the current URL matches the `to` prop and applies an `isActive` state.
**How it works here:**
```jsx
className={({ isActive }) =>
  isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
}
```
NavLink passes an object to the `className` function with `isActive: true/false`. The active link (currently selected page) gets a white background pill, while inactive links are dimmed. No manual state needed.

**`end={true}` prop on "My Queue":** Without `end`, `/doctor` would also be "active" when on `/doctor/patients` because `/doctor/patients` **starts with** `/doctor`. The `end` prop makes it match only when the path is **exactly** `/doctor`.

#### 📦 New Import: `Outlet` from `react-router-dom` (Line 1)
**What it is:** A placeholder component that React Router fills with whichever **child route** matches the current URL.

**How it works in this project:**
```
In App.jsx:
<Route path="/doctor" element={<DoctorLayout />}>         ← parent
  <Route index element={<DoctorQueue />} />               ← child 1
  <Route path="consult/:tokenId" element={<ConsultationForm />} /> ← child 2
  <Route path="patients" element={<DoctorPatients />} />  ← child 3
</Route>

In DoctorLayout.jsx:
<main>
  <Outlet />   ← DoctorQueue or ConsultationForm renders here
</main>
```
The topbar always stays visible. Only the content inside `<main>` changes when the doctor navigates between pages.

---

### FILE 2: `DoctorQueue.jsx` — The Doctor's Personal Queue

**What it does:** Shows only the tokens assigned **to this specific doctor** in `waiting`, `now`, `paused`, or `lab` state. The doctor can call the next patient, open a consultation, and see queue stats at a glance.

#### 🔧 Feature 1: Doctor-Filtered Queue from WebSocket (Lines 22–30)
```js
const { connected } = useSocket({
  onQueueUpdate: (data) => {
    const mine = data.tokens.filter(t =>
      t.doctorId === user?.id &&
      ['waiting', 'now', 'paused', 'lab'].includes(t.status)
    )
    setTokens(mine)
  },
})
```
The `queue:updated` WebSocket event broadcasts **all tokens** for the entire clinic. But the doctor only cares about their own. The `.filter()` here runs `t.doctorId === user?.id` to extract only tokens assigned to the logged-in doctor. This client-side filtering means no extra API endpoint was needed.

#### 🔧 Feature 2: Smart Derived State — No Extra `useState` (Lines 51–53)
```js
const currentPatient = tokens.find(t => t.status === 'now')
const nextPatient    = tokens.find(t => t.status === 'waiting')
const waitingCount   = tokens.filter(t => t.status === 'waiting').length
```
Three pieces of important information are **computed from `tokens`** on every render using `.find()` and `.filter()`. There is no `currentPatientState` or `waitingCountState` — derived data doesn't need its own `useState`, which avoids keeping two pieces of state in sync.

#### 🔧 Feature 3: `handleCallNext` — The "Call Next" Button Logic (Lines 55–70)
This is the most important action in the doctor's portal:
1. `setCalling(nextPatient.id)` → shows a spinner on the button, disables it.
2. **If a patient is currently consulting** (`currentPatient` exists) → marks them as `served` first via `tokenAPI.updateStatus(currentPatient.id, 'served')`.
3. **Calls the next patient** → `tokenAPI.updateStatus(nextPatient.id, 'now')`.
4. Both status changes emit a `queue:updated` WebSocket event → Reception dashboard also instantly updates.
5. `fetchMyQueue()` always runs in `finally` to guarantee fresh state even if the WebSocket is delayed.

**Why mark current as served automatically?** This is a UX decision — doctors shouldn't have to do two clicks ("serve current → call next"). "Call Next" handles both in one action.

#### 🔧 Feature 4: `handleStartConsultation` — Navigation with State (Lines 72–79)
```js
navigate(`/doctor/consult/${token.id}`, {
  state: { token, patient: token.patient }
})
```
Navigates to the ConsultationForm page and **passes the token and patient data via navigation state**. This means the consultation form doesn't need to make an API call to fetch the patient — it reads from `useLocation().state` immediately, resulting in an instant page load with no spinner.

---

### FILE 3: `ConsultationForm.jsx` — The Medical Record System

**What it does:** This is the core clinical tool. It is a rich, structured medical form where the doctor records everything about a patient visit — complaint, vitals, diagnosis, prescriptions, tests, notes, and follow-up date. The form **auto-saves every 30 seconds** and creates a permanent `Visit` record in the database.

#### 📦 New Import: `visitAPI` from `../../services/api` (Line 3)
An Axios-based API group for the `Visit` model:
- **`visitAPI.create({ patientId, tokenId })`** → `POST /api/visits` — creates a blank `Visit` record in the DB the moment the doctor opens the form.
- **`visitAPI.update(visitId, data)`** → `PATCH /api/visits/:id` — saves the form data (used by both autosave and manual save).
- **`visitAPI.complete(visitId)`** → `POST /api/visits/:id/complete` — marks the visit as complete, locking it. This is irreversible.

#### 🔧 Feature 1: Visit Created on Mount — The "Eager Creation" Pattern (Lines 149–162)
```js
useEffect(() => {
  visitAPI.create({ patientId: patient.id, tokenId })
    .then(res => setVisitId(res.data.data.visit.id))
    .catch(err => setVisitError(...))
}, [patient?.id, tokenId])
```
The moment the doctor opens the consultation form, a **blank Visit record is immediately created in the database** and its ID is stored in `visitId` state. This is called **"eager creation"** — the record exists in the DB before the doctor types a single character. This ensures:
1. If the browser crashes, the visit record still exists (even if empty).
2. Autosave has a valid `visitId` to `PATCH` against.
3. There is no "save for the first time" vs "update" logic split.

#### 🔧 Feature 2: Autosave Every 30 Seconds (Lines 176–193)
```js
useEffect(() => {
  if (!visitId || isComplete) return
  const interval = setInterval(async () => {
    await visitAPI.update(visitId, getFormData())
    setSavedAt(new Date())
  }, 30000)
  return () => clearInterval(interval)
}, [visitId, isComplete, getFormData])
```
A `setInterval` runs every 30 seconds while the form is active and not yet completed. It silently saves all form fields to the database in the background. The `savedAt` state stores the timestamp, and "Saved 02:34 PM" appears in the header as confirmation. If it fails, `saveError` shows an alert icon. The `return () => clearInterval(interval)` cleanup ensures the interval stops if the doctor navigates away.

**`isComplete` guard:** Once the consultation is marked complete, autosave is disabled. Closed visits are immutable.

#### 🔧 Feature 3: `getFormData` wrapped in `useCallback` (Lines 165–174)
```js
const getFormData = useCallback(() => ({
  complaint, complaintTags, vitals, diagnosis,
  notes, prescriptions: prescriptions.filter(rx => rx.name),
  testsOrdered, followUpDate: followUpDate || null,
}), [complaint, complaintTags, vitals, diagnosis, notes, prescriptions, testsOrdered, followUpDate])
```
`getFormData` collects all form fields into one object. It is wrapped in `useCallback` with all form fields as dependencies. This is critical: the autosave `useEffect` has `getFormData` in its dependency array. If `getFormData` were not memoized, it would be recreated on every render, causing the `useEffect` to restart the interval on every keystroke, which would trigger rapid DB saves.

Note that `prescriptions.filter(rx => rx.name)` strips out any prescription rows where the doctor hasn't typed a medicine name yet — preventing empty prescription entries in the DB.

#### 🔧 Feature 4: `handleComplete` — The Irreversible Completion (Lines 211–228)
1. `window.confirm()` → forces the doctor to consciously confirm — mistakes here are irreversible.
2. `visitAPI.update(visitId, getFormData())` → saves ALL current data one final time first.
3. `visitAPI.complete(visitId)` → marks the visit `complete` in the DB. Backend may also mark the token as `served`.
4. `setIsComplete(true)` → renders the green completion banner + disables all form fields.
5. `setTimeout(() => navigate('/doctor'), 1500)` → after 1.5 seconds (enough for the doctor to see the confirmation banner), automatically redirects back to the queue.

#### 🔧 Feature 5: `TagInput` — Custom Chip/Tag Input Component (Lines 11–42)
**What it is:** A custom multi-value tag input component built from scratch. Used for "Complaint Tags" (fever, cough) and "Tests Ordered" (CBC, X-Ray).
**How it works:**
- Renders existing tags as colored pill chips with an `×` remove button.
- Typing in the embedded text `<input>` and pressing **Enter or comma** calls `addTag()`.
- `onBlur={addTag}` ensures even if the doctor clicks elsewhere, the last typed tag is saved.
- Duplicate tags are blocked: `if (val && !tags.includes(val))`.
- The component is fully controlled via `tags` prop and `onChange` callback — it owns no state of its own (except the current text input).

#### 🔧 Feature 6: `PrescriptionRow` — Dynamic Prescription Builder (Lines 45–81)
A structured 4-column row for one prescription entry: Medicine Name | Dose | Frequency | Duration. The doctor can add rows (`addRx`), edit any field (`updateRx`), or delete a row (`removeRx`). The `id: Date.now()` trick generates a unique ID for each row using the current timestamp — simple and dependency-free.

#### 🔧 Feature 7: Vitals Grid — Data-Driven Rendering (Lines 368–384)
Instead of writing 4 separate `<input>` blocks for BP, Temperature, Weight, Height, an array of metadata objects is mapped over:
```js
[{ key: 'bp', label: 'BP', placeholder: '120/80 mmHg' }, ...]
.map(({ key, label, placeholder }) => (
  <Input value={vitals[key]} onChange={e => setVitals(v => ({ ...v, [key]: e.target.value }))} />
))
```
The `setVitals(v => ({ ...v, [key]: e.target.value }))` uses **computed property names** (`[key]`) to update only the changed vital in the object without touching the others. Clean and DRY.

#### 🔧 Feature 8: `PatientHistoryPanel` — Slide-in History Drawer
A "History" button in the header sets `showHistory: true`, which renders the `PatientHistoryPanel` component (a right-side drawer) showing all past visits for this patient. This lets the doctor see previous diagnoses, prescriptions, and complaints without leaving the current consultation form.

---

### FILE 4: `DoctorPatients.jsx` — Planned Feature (Placeholder)
Currently a "Coming Soon" placeholder screen for Phase 5.5 of the project. It will eventually be a searchable patient directory showing all patients the doctor has ever seen. Honest project planning — it's acknowledged as unbuilt in the UI itself.

---

### 🚨 Edge Cases & How Doctor Portal Handles Them

| Edge Case | How it's handled |
|---|---|
| **Doctor visits `/doctor/consult/:id` directly (no state)** | `if (!patient) return` → shows "No patient data. Go back to queue." fallback screen |
| **Visit creation fails on mount** | `visitError` state → full error screen with "Back to Queue" button — never leaves the doctor stuck |
| **Autosave fails** | `saveError` state → shows alert icon + "Autosave failed" in header — doctor is warned, data still in state |
| **Doctor accidentally completes** | `window.confirm()` → requires explicit confirmation before calling `complete` API |
| **Auto-redirect after completion** | `setTimeout(1500)` → gives doctor time to read the success banner before redirecting |
| **Duplicate complaint/test tags** | `!tags.includes(val)` check in `TagInput.addTag()` — silently ignores duplicates |
| **Empty prescription rows in payload** | `prescriptions.filter(rx => rx.name)` — strips unnamed rows before saving |
| **Follow-up date in the past** | `min={new Date().toISOString().split('T')[0]}` on the date input — browser prevents past dates |
| **Wrong doctor seeing tokens** | `.filter(t => t.doctorId === user?.id)` — each doctor only sees their own assigned tokens |
| **Queue updates while on consultation form** | Socket listeners are inactive on ConsultationForm — doctor won't be distracted by queue events |

### Q14: Explain the entire Staff Portal end-to-end — all files, features, libraries, and edge cases (Viva Level)

**A:** The Staff Portal (also called the Reception Portal) is the **"Control Room"** of ClinicOS. It is what the receptionist/front desk staff uses all day to register patients, issue queue tokens, manage the live queue, and create bills. It is the busiest and most complex portal in the entire system.

The portal consists of **2 main pages + 2 custom hooks:**
```
/reception    →  ReceptionDashboard.jsx   (Main hub — patient lookup + live queue)
/billing/:id  →  BillingScreen.jsx        (Bill creation + payment recording)

hooks/
  useSocket.js       (Real-time WebSocket connection)
  useAutoRefresh.js  (Polling fallback — refreshes every 30 seconds)
```

---

### FILE 1: `ReceptionDashboard.jsx` — The Main Hub

This is the largest and most feature-rich file in the entire project (921 lines). It is a **split-panel layout**: the LEFT panel handles patient lookup and controls; the RIGHT panel shows the live token queue.

---

#### 📦 New Import: `useCallback` (Line 1)
`useCallback` is a React hook that **memoizes a function** — it creates the function once and returns the same reference on every re-render, unless its dependencies change. It is used here for `fetchTokens`, `fetchDoctors`, and `fetchAnalyticsSummary`. This is important because these functions are passed into `useEffect` dependency arrays and `useAutoRefresh`. Without `useCallback`, a new function reference would be created on every render, causing infinite re-fetch loops.

---

#### 📦 New Import: `useRef` (Line 1)
`useRef` creates a mutable reference container that persists across renders **without causing a re-render when changed**. Used in two places:
- `phoneInputRef` → holds a reference to the phone input DOM element. On mount, `phoneInputRef.current?.focus()` automatically puts the cursor in the phone field so staff don't have to click it.
- `undoIntervalRef` → holds the `setInterval` ID for the Undo countdown so it can be cleared (`clearInterval`) if the user clicks Undo before it expires or if the component unmounts.

---

#### 📦 New Import: Custom API modules — `patientAPI`, `tokenAPI`, `clinicAPI`, `analyticsAPI` (Line 4)
These are pre-built Axios-based function groups from `services/api.js`. Each group talks to a specific backend controller:
- **`patientAPI.lookup(phone)`** → `GET /api/patients/lookup?phone=...` — searches for an existing patient by phone number.
- **`patientAPI.create({...})`** → `POST /api/patients` — creates a new walk-in patient record.
- **`tokenAPI.create({...})`** → `POST /api/tokens` — issues a new queue token.
- **`tokenAPI.updateStatus(id, status)`** → `PATCH /api/tokens/:id/status` — changes a token's status (now/served/paused/lab).
- **`tokenAPI.emergency({...})`** → `POST /api/tokens/emergency` — issues a token that jumps to the front of the queue.
- **`tokenAPI.undo()`** → `POST /api/tokens/undo` — reverts the last status change.
- **`tokenAPI.pause()` / `tokenAPI.resume()`** → pauses/resumes the whole clinic queue.
- **`analyticsAPI.getOverview()`** → fetches today's KPIs (patients seen, avg wait time, queue health).

---

#### 📦 New Import: `useSocket` custom hook (Line 5)
**What it is:** A custom hook defined in `hooks/useSocket.js` that manages a **WebSocket connection using `socket.io-client`**.

**Why it's needed:** The queue is a live, real-time system. If Doctor calls a patient (status → `now`), the receptionist's screen must update **instantly** without them pressing Refresh. This is impossible with regular HTTP requests. WebSockets maintain a persistent two-way connection between the frontend and backend.

**How it works:**
```js
const socketInstance = io(serverUrl, { withCredentials: true, transports: ['websocket', 'polling'] })
socket.emit('join:clinic', user.clinicId)  // joins the clinic's private "room"
socket.on('queue:updated', handler)        // listens for backend events
```
When the receptionist's `useSocket` initializes, it connects to the Node.js Socket.IO server and emits `join:clinic` with the clinic's ID to join a **private room** (so Clinic A's events don't leak to Clinic B). When any action updates the queue (from any connected device — doctor's screen or reception screen), the backend emits `queue:updated` to the entire clinic room, and all connected clients update their `tokens` and `stats` state simultaneously.

The `handlersRef` pattern stores the latest event handler functions in a `useRef` without re-running the `useEffect` (which would disconnect and reconnect the socket). This is an advanced React pattern to avoid stale closure bugs.

**`transports: ['websocket', 'polling']`** — tries WebSocket first (fastest), falls back to HTTP long-polling if the environment doesn't support WebSockets (e.g., some corporate firewalls).

---

#### 📦 New Import: `useAutoRefresh` custom hook (Line 6)
```js
export function useAutoRefresh(fetchFn, intervalSeconds = 30) {
  useEffect(() => {
    const interval = setInterval(fetchFn, intervalSeconds * 1000)
    return () => clearInterval(interval)
  }, [fetchFn, intervalSeconds])
}
```
**What it is:** A tiny 9-line custom hook that calls `setInterval` to re-fetch the queue every 30 seconds automatically.
**Why it's needed:** WebSockets can disconnect due to network issues. The auto-refresh is a **fallback safety net** — even if the real-time socket drops, the queue data will still refresh every 30 seconds from the REST API. The `return () => clearInterval(interval)` is the **cleanup function** that cancels the interval when the component unmounts (prevents memory leaks).

---

### 🔧 Feature 1: Custom Toast Notification System (Lines 23–58)
Instead of using `alert()` (which blocks the UI) or an external library, a **mini toast system** is built from scratch:
- `useToast()` hook manages a `toasts` array state.
- `addToast(message, type)` appends a new toast object with a unique `id = Date.now()`, then uses `setTimeout(3500ms)` to remove it automatically.
- `ToastContainer` component renders all active toasts in the bottom-right corner with CSS slide-up animations.
- Toast types: `success` (teal), `error` (coral), `info` (sky).

---

### 🔧 Feature 2: The Undo System (Lines 78–107)
After any token status change (e.g., marking a token "served"), a 10-second Undo window opens:
1. `startUndoWindow()` sets `undoAvailable: true` and starts a `setInterval` countdown from 10.
2. An "Undo Last Action" button appears at the bottom of Queue Controls.
3. If clicked → `tokenAPI.undo()` → backend reverts the most recent status change for that clinic.
4. If not clicked → countdown hits 0 → `clearInterval` + `setUndoAvailable(false)` → button disappears.
The `undoIntervalRef` (useRef) stores the interval ID so it can be cleared from multiple places without causing state issues.

---

### 🔧 Feature 3: The STATUS map (Line 14–21)
```js
const STATUS = {
  now:     { label: 'Now', bg: 'bg-crimson-500', ... },
  waiting: { label: 'Waiting', bg: 'bg-cream-200', ... },
  ...
}
```
A lookup object that maps each token status string to its full set of visual styles (badge color, row background, border). The `TokenRow` component does `STATUS[token.status]` to get all styling in one line. This is the **single source of truth** for all token status styles — changing a color here changes it everywhere.

---

### 🔧 Feature 4: Patient Lookup & Registration Flow (Lines 181–219)
1. Staff types a 10-digit phone number.
2. `handleSearch()` → `patientAPI.lookup(phone)` → backend queries the `Patient` table by phone within the clinic.
3. **Found:** Patient card appears showing name, visit count, outstanding balance, and messaging opt-in toggle.
4. **Not found:** A "Register New Patient" button appears → `showNewForm` state becomes `true` → an inline form slides in.
5. `handleCreatePatient()` → `patientAPI.create({phone, name, gender, email, optInMsg})` → creates a walk-in `Patient` record in the database.

**Outstanding Balance badge:** If `patient.outstandingBalance > 0`, a red "₹X due" badge appears on the patient card to alert the staff that the patient has pending unpaid bills.

**`optInMsg` consent checkbox:** Required (`disabled={!newPatient.optInMsg}`). The patient must explicitly consent to data storage and WhatsApp/SMS notifications before being registered. This is a compliance design decision.

---

### 🔧 Feature 5: Token Issuing & Doctor Assignment (Lines 238–257)
After finding/creating a patient:
1. If the clinic has multiple doctors, a `<select>` dropdown appears to optionally assign the token to a specific doctor.
2. `handleIssueToken()` → `tokenAPI.create({ patientId, doctorId })` → backend creates a `Token` record in the DB, assigns the next token number in sequence, and emits a `queue:updated` WebSocket event.
3. All connected screens (doctor's portal, patient's phone) instantly see the new token appear.

**`hasActiveToken` guard:** If `patient.hasActiveToken` is `true` (they're already in queue), the "Issue Token" button is hidden and replaced with a warning — preventing duplicate tokens for the same patient.

---

### 🔧 Feature 6: Token Status Management — The `TokenRow` (Lines 818–892)
Each token row has context-aware action buttons that change based on the current status:
| Current Status | Available Actions |
|---|---|
| `waiting` | Call Now (→ `now`), Send to Lab (→ `lab`), Hold (→ `paused`), Cancel |
| `now` | Mark Served (→ `served`), Send to Lab, Hold, Cancel |
| `paused` | Resume (→ `waiting`), Cancel |
| `lab` | Back to Queue (→ `waiting`), Cancel |
| `served` | Show "Create Bill" button (or Paid/Pending badge) |

The `handleStatusChange(tokenId, newStatus)` function calls `tokenAPI.updateStatus()` then starts the 10-second undo window.

---

### 🔧 Feature 7: Emergency Token System (Lines 302–334)
A special modal triggered by the red "Emergency Token" button:
1. Staff searches for the patient by phone.
2. `tokenAPI.emergency({patientId, doctorId})` → backend creates a new token **with `tokenNumber = 0`** (or re-orders all existing `waiting` tokens), placing this patient at the absolute front.
3. A `queue:updated` WebSocket event is emitted — all connected screens instantly reflect the new order.

---

### 🔧 Feature 8: Queue Pause / Resume (Lines 282–300)
`handleTogglePause()` calls `tokenAPI.pause()` or `tokenAPI.resume()`. The backend sets a flag on the clinic's record. When paused:
- A yellow banner appears at the top of the dashboard.
- The doctor's portal respects this flag and stops auto-calling.
- A `queue:paused` WebSocket event is emitted to all connected clients so every screen shows the paused state instantly.

---

### 🔧 Feature 9: Analytics Summary Cards (Lines 165–172)
Three summary cards at the top of the dashboard fetched from `analyticsAPI.getOverview({ range: 'today' })`:
- **Patients Today** — count of unique patients seen.
- **Average Wait** — mean time from token issuance to being called (`status: 'now'`).
- **Queue Health** — `green/amber/red` computed by the backend based on queue length and wait times.

---

### FILE 2: `BillingScreen.jsx` — Bill Creation + Payment

**Route:** `/billing/:patientId` — Protected to `staff` and `admin` roles.

#### 🔧 New Import: `useParams` & `useLocation` (Line 2)
- **`useParams()`** → extracts `:patientId` from the URL (e.g., `/billing/42` → `patientId = "42"`).
- **`useLocation()`** → reads navigation state passed from `ReceptionDashboard` via `navigate('/billing/42', { state: { patient, tokenId } })`. This allows the billing screen to know which patient AND which token this bill is for, without an extra API call.

#### 🔧 Feature 1: Smart Patient Data Loading (Lines 32–54)
```js
const [patient, setPatient] = useState(location.state?.patient || null)
const [loadingPatient, setLoadingPatient] = useState(!location.state?.patient)
```
If the patient data was passed via navigation state → use it directly (no API call needed). If the user somehow navigates directly to `/billing/42` without state (e.g., by typing the URL) → the `useEffect` fetches the patient from the API as a fallback. This is a clean **performance + resilience** design pattern.

#### 🔧 Feature 2: Dynamic Line Items with `<datalist>` (Lines 57–75)
`items` is an array of objects: `{ id, name, quantity, unitPrice }`. 
- `addItem()` pushes a new empty row.
- `updateItem(id, field, value)` uses `.map()` to update only the changed field of the matching item.
- `removeItem(id)` uses `.filter()` with a guard to keep at least one row.
A native HTML `<datalist id="services">` is used for autocomplete suggestions (e.g., "Consultation Fee", "ECG", "X-Ray") — a browser-native feature that needs no library.

#### 🔧 Feature 3: Real-time Financial Calculations (Lines 77–84)
Calculated live on every render using `.reduce()`:
```js
subtotal = Σ(quantity × unitPrice)
discountAmt = subtotal × (discount% / 100)
tax = (subtotal - discountAmt) × 0.18   // 18% GST
total = subtotal - discountAmt + tax
```
`Math.round(...* 100) / 100` is used to avoid JavaScript floating-point precision errors (e.g., preventing `₹100.00000001`).

#### 🔧 Feature 4: Two-Step Billing Flow — Create then Pay (Lines 87–128)
The billing is intentionally split into 2 steps:
1. **Step 1 — Generate Bill:** `billAPI.create({...items, discountPercent})` → backend creates an `unpaid` bill record in the DB with all line items stored. The bill ID is saved in `bill` state.
2. **Step 2 — Mark Paid:** `billAPI.markPaid(bill.id, paymentMethod)` → backend marks the bill `paid` and records cash/UPI/card as `paymentMethod`. Then `billAPI.get(bill.id)` fetches the full bill with clinic + patient details. `setShowReceipt(true)` opens the `ReceiptModal`.

This 2-step flow means a bill can be created ("generated") and the patient can pay later — the unpaid bill stays in the system and contributes to the patient's `outstandingBalance`.

#### 🔧 Feature 5: The `ReceiptModal` component
After payment, a full-page modal opens showing a formatted receipt (bill number, clinic name, items, GST breakdown, total, payment method). It has a "Print" button that uses `window.print()` to trigger the browser's native print dialog.

---

### 🚨 Edge Cases & How Staff Portal Handles Them

| Edge Case | How it's handled |
|---|---|
| **Patient already in queue** | `hasActiveToken` check → hides Issue Token button, shows warning |
| **Phone input — non-digits** | `e.target.value.replace(/\D/g,'').slice(0,10)` — strips non-digits, limits to 10 chars |
| **Socket disconnects** | `useAutoRefresh` polls every 30 seconds as HTTP fallback; socket auto-reconnects (10 attempts, 1s delay) |
| **Bill with no items / zero price** | `validItems.filter(i => i.name && i.unitPrice > 0)` — validates before creating |
| **Removing last billing row** | `if (items.length === 1) return` — at least one row always stays |
| **Float precision errors in billing** | `Math.round(... * 100) / 100` — prevents ₹0.00000001 rounding bugs |
| **Staff navigates directly to /billing/:id** | Falls back to `patientAPI.get(patientId)` if no navigation state was passed |
| **Accidental token cancel** | `window.confirm('Cancel this token?')` — native browser confirm dialog prevents accidental taps |
| **Wrong status undo** | 10-second undo window → `tokenAPI.undo()` reverts last status change at DB level |
| **Outstanding balance display** | Red `₹X due` badge shown on patient card on every lookup, alerting staff immediately |
| **OTP message opt-in compliance** | `optInMsg` checkbox required before registration — button disabled until checked |

### Q13: Explain the complete end-to-end Registration Process in ClinicOS (Viva Level)

**A:** The registration process in ClinicOS is a **3-phase pipeline** that spans the frontend, backend controller, backend service, database, and external email service. It is designed with security and role-based logic baked in at every step.

---

#### 🗺️ The Full End-to-End Map

```
FRONTEND                    BACKEND                      DATABASE / EXTERNAL
─────────────────────────────────────────────────────────────────────────────
PatientSignup.jsx
  Step 1: Fill form
  → authAPI.sendOTP()   →  POST /api/auth/send-otp
                              auth.controller → sendOTP()
                              otp.service → generateOTP()
                                           → saveOTP()       →  OtpCode table (MySQL)
                                           → sendOTPEmail()  →  Nodemailer (Gmail SMTP)
  ← Returns success

  Step 2: Enter OTP
  → authAPI.verifyOTP() →  POST /api/auth/verify-otp
                              otp.service → verifyOTP()       →  OtpCode table (lookup)
  ← Returns success

  → authAPI.register()  →  POST /api/auth/register
                              auth.controller → register()
                              auth.service → registerUser()
                                → bcrypt.hash(password, 12)
                                → User.create()              →  User table (MySQL)
                                → Patient.findAll() + link   →  Patient table (MySQL)
                                → [Admin] Clinic.create()    →  Clinic table (MySQL)
                                → [Doctor/Staff] JoinRequest →  JoinRequest table
                                → generateToken(user.id)     →  JWT (in memory)
  ← Returns { user, token }

  login(user, token)    →  localStorage + AuthContext state
  navigate('/patient')  →  User is now logged in!
```

---

### PHASE 1: OTP Generation & Email Delivery

**Files:** `otp.service.js`, `auth.controller.js::sendOTP`, Nodemailer config

#### 🔧 `generateOTP()` — How the 6-digit code is made
```js
return Math.floor(100000 + Math.random() * 900000).toString()
```
`Math.random()` gives a float between 0–1. Multiplied by `900000` and floored, it guarantees a number between `100000` and `999999` — always exactly 6 digits. `.toString()` converts it to a string for easy comparison later.

#### 🔧 `saveOTP()` — Storing the code in the database
```js
await OtpCode.destroy({ where: { email } })   // delete old OTPs first
await OtpCode.create({ email, code, expiresAt })
```
Two important things happen here:
1. **Delete old OTPs first** — If a user clicks "Send OTP" multiple times, old codes are wiped. This prevents a hacker from using an old code that was never entered.
2. **`expiresAt = Date.now() + 10 minutes`** — The OTP is only valid for 10 minutes. The expiry is stored in the DB as a timestamp.

#### 🔧 `sendOTPEmail()` — Sending via Nodemailer
Uses the pre-configured SMTP `transporter` (Gmail via `smtp.gmail.com:587`) to send a branded HTML email with the 6-digit code in large bold text. The `from` address, SMTP credentials, and Gmail App Password all come from the `.env` file — never hardcoded.

**📦 Package: `nodemailer`** — A Node.js library for sending emails via SMTP. The `transporter` object is created once in `config/mailer.js` and reused across the app.

---

### PHASE 2: OTP Verification

**Files:** `otp.service.js::verifyOTP`, `auth.controller.js::verifyOTPHandler`

#### 🔧 `verifyOTP()` — The 3-check security gate
```js
const otp = await OtpCode.findOne({ where: { email, code, used: false } })
if (!otp) return false                              // Check 1: Does it exist?
if (new Date() > new Date(otp.expiresAt)) return false  // Check 2: Is it expired?
await otp.update({ used: true })                    // Mark as used
return true
```
Three checks in sequence:
1. **Existence check:** Does a record with this exact `email + code + used:false` exist in the DB? If not → invalid.
2. **Expiry check:** Has the current time passed the stored `expiresAt` timestamp? If yes → expired.
3. **Mark as used:** Sets `used: true` so the same 6-digit code can **never be reused** even if someone intercepts it.

---

### PHASE 3: The Actual Registration — `registerUser()` in `auth.service.js`

This is the core business logic function. It handles 4 completely different flows based on the `role` value.

#### 🔧 Step A: Duplicate Email Check
```js
const existing = await User.findOne({ where: { email } })
if (existing) throw new Error('An account with this email already exists')
```
A second duplicate check at the service level (even though the controller also checked). This is a **defense-in-depth** approach — the OTP send-step checks for duplicates early (to give instant feedback), and the register step checks again as a final safety net.

#### 🔧 Step B: Password Hashing with `bcryptjs`
```js
const passwordHash = await bcrypt.hash(password, 12)
```
**📦 Package: `bcryptjs`** — A pure JavaScript implementation of the bcrypt password hashing algorithm. The `12` is the **salt rounds** — it means the hashing algorithm runs `2^12 = 4096` iterations. This makes brute-force attacks computationally expensive. The plaintext password is **never stored** anywhere in the database — only the hash.

#### 🔧 Step C: Determining `status` based on Role
```js
const status = ['admin', 'patient'].includes(role) ? 'approved' : 'pending'
```
- **Admin & Patient** → `status: 'approved'` immediately. They can use the app right away.
- **Doctor & Staff** → `status: 'pending'`. They must wait for the clinic admin to approve their `JoinRequest`. This is the approval workflow.

#### 🔧 Step D: Creating the User in MySQL
```js
await User.create({ name, email, passwordHash, phone, role, status, emailVerified: true })
```
`emailVerified: true` is set directly because the OTP was verified in Phase 2 **before** `register()` was even called. The frontend guarantees this ordering — it calls `/verify-otp` first and only calls `/register` on success.

#### 🔧 Step E: Auto-Linking Walk-In Patient Records (Patient role only)
```js
const byPhone = await Patient.findAll({ where: { phone, userId: null } })
for (const p of byPhone) { await p.update({ userId: user.id }) }

const byEmail = await Patient.findAll({ where: { email, userId: null } })
for (const p of byEmail) { await p.update({ userId: user.id }) }
```
This is a smart feature. When a patient walks into a clinic for the first time, the receptionist creates a walk-in `Patient` record (name + phone). The `userId` field is `null` at this point because the patient has no account yet. When the patient later signs up for an online account using the same phone/email, this code **automatically finds all their existing walk-in records** across all clinics and links them by setting `userId`. Result: the patient instantly sees their full medical history and bills from Day 1.

#### 🔧 Step F: Role-Specific Branching

**For Admin role:**
```js
let code; let unique = false;
while (!unique) {
  code = generateClinicCode()  // random 6-char alphanumeric e.g. "KL9X2M"
  const exists = await Clinic.findOne({ where: { clinicCode: code } })
  unique = !exists
}
await Clinic.create({ name, address, phone, specialty, clinicCode: code, adminId: user.id })
await user.update({ clinicId: clinic.id })
```
A `while` loop keeps generating codes until a **globally unique** one is found. This handles the extremely rare collision case. The clinic is created and immediately linked to the admin user.

**For Doctor/Staff role:**
```js
const clinic = await Clinic.findOne({ where: { clinicCode } })
if (!clinic) throw new Error('Clinic code not found...')
await JoinRequest.create({ userId: user.id, clinicId: clinic.id })
await user.update({ clinicId: clinic.id })
```
The user enters the clinic's 6-character `clinicCode` during signup. The backend verifies it exists, creates a `JoinRequest` row, and links the user to that clinic. The clinic admin then approves or rejects this request via the Admin dashboard.

#### 🔧 Step G: JWT Generation
```js
const token = generateToken(user.id)
```
**📦 Package: `jsonwebtoken` (inside `generateToken` util)** — Creates a signed JWT (JSON Web Token) containing the `userId` as the payload. The token is signed with the `JWT_SECRET` from `.env`. The backend returns this token to the frontend, which stores it in `localStorage` and attaches it to every future API request via the Axios interceptor.

---

### 🚨 Edge Cases & How They Are Handled

| Edge Case | Where it happens | How it's handled |
|---|---|---|
| **Email already registered** | `sendOTP` controller + `registerUser` service | Two-layer check: early check at OTP send (409 conflict) + final check at register. User gets a clear message to "sign in instead." |
| **OTP expired (>10 min)** | `verifyOTP` service | Timestamp comparison `new Date() > otp.expiresAt` → returns false → frontend shows "Invalid or expired OTP" |
| **OTP reuse attempt** | `verifyOTP` service | `used: true` is set after first use. Query includes `used: false` so used OTPs are never found again |
| **Multiple OTP requests (spam)** | `saveOTP` service | `OtpCode.destroy({ where: { email } })` deletes all old codes first — only the latest OTP works |
| **OTP resend too fast** | `PatientSignup.jsx` | 60-second `resendTimer` state disables the "Resend OTP" button for 60 seconds |
| **Invalid clinic code** | `registerUser` service | `Clinic.findOne()` returns null → `throw new Error('Clinic code not found')` → 404 response |
| **Clinic code collision** | `registerUser` service (admin path) | `while (!unique)` loop regenerates until a unique code is found |
| **Passwords don't match** | `PatientSignup.jsx` Zod `.refine()` | Client-side cross-field validation catches this before the form even submits — zero network requests wasted |
| **Invalid phone format** | `PatientSignup.jsx` Zod `.regex()` | `/^\d{10}$/` regex enforced client-side — must be exactly 10 digits |
| **Doctor/Staff still pending** | `LoginPage.jsx::onSubmit` | After login, checks `user.status === 'pending'` → redirects to `/pending` page instead of dashboard |
| **Account rejected** | `LoginPage.jsx::onSubmit` | `user.status === 'rejected'` → shows error message on screen, does not navigate |

### Q12: Explain the entire Signup Flow — `RoleSelector.jsx`, `PatientSignup.jsx`, `SignupLayout.jsx` (Viva Level)

**A:** The signup flow in ClinicOS is NOT a single page. It is a **3-file pipeline** that guides a new user through: picking their role → filling their details → verifying their email via OTP → getting an account created and being logged in automatically.

---

#### 🗺️ The Big Picture Flow
```
/signup  →  RoleSelector.jsx       (Step 0: Pick your role)
              ↓ user clicks "Patient"
/signup/patient  →  PatientSignup.jsx  (Step 1: Fill info + Step 2: Verify OTP)
              ↓ OTP verified
auto-navigates to  /patient  (Logged in!)
```

---

### FILE 1: `RoleSelector.jsx` — The Role Picker Screen (`/signup`)

**What it does:** It is the first screen a new user sees when they click "Sign Up." It shows 4 role cards (Patient, Admin, Doctor, Staff) and navigates to the correct signup form when a card is clicked.

#### 🔧 Feature 1: The `ROLES` array (Lines 6–43)
Instead of hardcoding 4 separate buttons in JSX, the data for each role card (icon, label, description, color, border style) is stored in a JavaScript array of objects. Then `.map()` loops over it to render all 4 cards dynamically. This is clean, maintainable, and follows the **DRY (Don't Repeat Yourself)** principle. Adding a 5th role later means just adding one object to this array.

#### 🔧 Feature 2: Guard using `useEffect` (Lines 50–55)
```js
useEffect(() => {
  if (user) {
    navigate(routes[user.role] || '/', { replace: true })
  }
}, [user, navigate])
```
If an already-logged-in user somehow navigates to `/signup`, this `useEffect` immediately redirects them to their dashboard. The `{ replace: true }` option replaces the current history entry so the user cannot press the browser's Back button to return to `/signup`. This is a security/UX guard.

#### 🔧 Feature 3: `navigate(\`/signup/${id}\`)` on card click (Line 78)
A template literal builds the correct URL based on the role id. Clicking "Patient" calls `navigate('/signup/patient')`. Clicking "Doctor" calls `navigate('/signup/doctor')`. Clean and dynamic — no if/else chains needed.

---

### FILE 2: `PatientSignup.jsx` — The 2-Step Signup Form (`/signup/patient`)

**What it does:** This is the most complex auth page. It is a **multi-step form** with OTP verification built in. It handles: collecting user info → sending OTP → verifying OTP → registering the account → auto-login → redirect.

#### 📦 New Import: `StepIndicator` & `OTPInput` (Lines 10–11)
- **`StepIndicator`**: A small UI component that shows the progress bar at the top (e.g., "Step 1 of 2 — Your Info"). It receives `steps={STEPS}` (the array `['Your Info', 'Verify Email']`) and `currentStep={step}` (the current step number) as props.
- **`OTPInput`**: A custom 6-box OTP input component. Instead of one `<input>`, it renders 6 individual boxes that auto-advance focus when a digit is typed. It receives `value={otp}` and `onChange={setOtp}` as props.

#### 🔧 Feature 1: Advanced Zod Schema with Cross-Field Validation (Lines 15–24)
```js
const schema = z.object({...})
.refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
```
The `.refine()` call adds a **cross-field validation rule** that plain `z.string()` can't do. It checks: "Does the `password` field equal the `confirmPassword` field?" If not, it puts the error message on the `confirmPassword` field. The phone field uses `.regex(/^\d{10}$/)` to strictly enforce a 10-digit Indian mobile number format.

#### 🔧 Feature 2: The `step` state — conditional UI rendering (Line 27)
```js
const [step, setStep] = useState(1)
...
{step === 1 && <> ...Step 1 JSX... </>}
{step === 2 && <> ...Step 2 JSX... </>}
```
A single number controls which "screen" is shown. This is called **conditional rendering** — React shows the Step 1 form when `step === 1` and the OTP screen when `step === 2`. No routing, no page reload — just a state change.

#### 🔧 Feature 3: `formData` state — data bridging between steps (Line 34)
```js
const [formData, setFormData] = useState(null)
```
When Step 1 is submitted, the validated form data (name, email, phone, password) is saved into `formData` state. When Step 2 verifies the OTP, it reads `formData.email` to pass to the register API. This bridges data between the two steps without using a URL parameter or global store.

#### 🔧 Feature 4: `onSubmitStep1` — Step 1 flow (Lines 44–57)
1. Calls `authAPI.sendOTP(data.email)` → backend generates a 6-digit code and sends it to the user's email via Nodemailer.
2. Saves the form data into `formData` state.
3. Calls `setStep(2)` → UI switches to the OTP screen.
4. Calls `startResendTimer()` → begins the 60-second countdown.

#### 🔧 Feature 5: `onVerifyOTP` — Step 2 flow (Lines 60–87)
1. Guards against short OTPs: `if (otp.length < 6) return`.
2. `authAPI.verifyOTP(formData.email, otp)` → backend checks if the code matches and hasn't expired.
3. If valid → immediately calls `authAPI.register({...formData, role: 'patient'})` → creates the User record in MySQL.
4. Gets back `{ user, token }` from the backend.
5. Calls `login(user, token)` from `AuthContext` → saves token to `localStorage`, sets global user state.
6. `navigate('/patient')` → the user is now logged in and on their dashboard.

#### 🔧 Feature 6: `startResendTimer` — The Resend Countdown (Lines 89–97)
```js
setResendTimer(60)
const interval = setInterval(() => {
  setResendTimer(t => { if (t <= 1) { clearInterval(interval); return 0 } return t - 1 })
}, 1000)
```
Uses `setInterval` to decrement `resendTimer` by 1 every 1000ms (1 second). The functional form `setResendTimer(t => t - 1)` is used to always operate on the freshest state value (important for intervals). When it hits 0, the interval is cleared and the "Resend OTP" button becomes visible. This prevents OTP spamming.

---

### FILE 3: `SignupLayout.jsx` — The Shared Visual Wrapper

**What it does:** A reusable layout component that wraps every auth form (Login, all Signup pages). It provides the consistent visual shell: full-screen background, centered ClinicOS logo, and the card container.

#### 🔧 Feature 1: `children` prop — Content Injection
```jsx
<div className="card p-8">
  {children}
</div>
```
`children` is a special React prop. Whatever JSX you put *between* the opening and closing `<SignupLayout>` tags gets injected here. This is what allows `LoginPage`, `PatientSignup`, `AdminSignup` etc. to all reuse the same outer shell without duplicating the logo and background code.

#### 🔧 Feature 2: `showBack` prop with default value (Line 4)
```jsx
function SignupLayout({ children, showBack = true }) {
```
A boolean prop with a **default value of `true`**. By default, all signup pages show a "← Back" button (which calls `navigate(-1)` to go to the previous page). `LoginPage` passes `showBack={false}` to hide it, since there is no "previous page" concept on login.

#### 🔧 Feature 3: `navigate(-1)` — Browser History Back (Line 24)
`navigate(-1)` is the React Router equivalent of clicking the browser's back button. It goes to the previous entry in the browser's navigation history. Used on the "← Back" button so a user on `/signup/patient` can easily return to `/signup` (the role selector).

---

### 🧩 Shared Sub-components (Bottom of `PatientSignup.jsx`, Lines 195–224)
These are defined in `PatientSignup.jsx` but **exported** so other files like `LoginPage.jsx` can import and reuse them without duplication:

| Component | What it does |
|---|---|
| `Field` | Renders a label + input slot + red error message below the field |
| `inputCls(error)` | A function that returns the correct CSS classes for an input — normal border when no error, red border + ring when there is an error |
| `ErrorAlert` | Renders a styled red box with an alert icon for API-level errors (like "User already exists") |
| `Spinner` | A tiny spinning CSS animation shown on the button while an API call is in progress |

### Q11: Explain the entire `LoginPage.jsx` — imports, features, and their role (Viva Level)

**A:** `LoginPage.jsx` is the **"Entry Gate"** of the entire ClinicOS system. It is the form where all four roles (Admin, Doctor, Staff, Patient) type their email and password to get in. On a successful login, the user is intelligently redirected to their role-specific dashboard.

---

#### 📦 Import 1: `react-hook-form` — `useForm` (Line 3)
**Package:** `react-hook-form`
**What it does:** A library for managing form state. Instead of manually creating a `useState` for every field (`emailState`, `passwordState`), `useForm` handles all field values, change tracking, and submission in one go.
In this file, it gives us three things via destructuring:
- `register` → connects an input field to the form. `{...register('email')}` wires the email input so the form knows about it.
- `handleSubmit` → wraps our `onSubmit` function. It first runs validation, and only if validation passes does it call `onSubmit` with the clean data.
- `formState: { errors }` → an object containing validation error messages for each field. e.g., `errors.email?.message` has the string `"Enter a valid email"` if the user typed a bad email.

---

#### 📦 Import 2: `zod` + `@hookform/resolvers/zod` — Schema Validation (Lines 4–5)
**Package:** `zod`
**What it does:** Zod is a schema declaration and validation library. You define the exact shape and rules your data must follow.
```js
const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password required'),
})
```
This schema says: email must be a valid email format, password must be at least 6 characters. If either rule is broken, the form will NOT submit and will instead show the error message below the field.
`zodResolver` is the bridge/adapter that connects Zod's validation rules to `react-hook-form`. `useForm({ resolver: zodResolver(schema) })` means: "Use Zod to validate this form."

---

#### 📦 Import 3: `lucide-react` — `Eye` & `EyeOff` (Line 6)
**Package:** `lucide-react`
**What it does:** A library of clean SVG icons. `Eye` and `EyeOff` are used for the **"Show/Hide Password"** toggle button on the password field. The `showPass` state variable (initialized with `useState(false)`) controls which icon is shown and whether the input type is `"password"` (dots) or `"text"` (visible characters).

---

#### 📦 Import 4: `Link` + `useNavigate` from `react-router-dom` (Line 2)
*(Note: `BrowserRouter`, `Routes`, `Route` were explained in App.jsx — skipping those.)*
- **`Link`**: Used for the "Create account" and "Forgot password?" clickable text at the bottom of the form. It changes the URL without a full page reload (unlike a plain `<a href>` tag which would reload the page).
- **`useNavigate`**: A hook that returns a `navigate()` function. Used in the `onSubmit` function to programmatically redirect the user after login, e.g., `navigate('/admin')`.

---

#### 📦 Import 5: `authAPI` from `../../services/api` (Line 8)
An object containing the pre-built Axios HTTP request functions. `authAPI.login(email, password)` sends a `POST /api/auth/login` request to the backend with the credentials.

---

#### 📦 Import 6: Shared UI helpers from `PatientSignup` (Line 10)
`Field`, `inputCls`, `ErrorAlert`, `Spinner` are small reusable UI components defined in `PatientSignup.jsx` and imported here to avoid code duplication. e.g., `<ErrorAlert message={apiError} />` shows a red error box when the API returns an error like "Invalid credentials."

---

#### 🔧 Feature 1: The `DASHBOARD` map (Line 17)
```js
const DASHBOARD = { patient: '/patient', admin: '/admin', doctor: '/doctor', staff: '/reception' }
```
A lookup object similar to `getDashboardRoute()` in `App.jsx`. After login, it runs `navigate(DASHBOARD[user.role])` to send the user to their correct dashboard in one line.

---

#### 🔧 Feature 2: Three `useState` variables (Lines 25–27)
| Variable | Purpose |
|---|---|
| `showPass` | Toggles the password field between hidden (dots) and readable text |
| `loading` | `true` while the API call is in progress — disables the button and shows a spinner to prevent double-submits |
| `apiError` | Stores any error message returned from the backend (e.g., "Invalid email or password"), displayed in the red `<ErrorAlert>` box |

---

#### 🔧 Feature 3: The `onSubmit` function — The Core Login Flow (Lines 36–62)
This is the most important function in the file. It runs only after Zod validation passes:
1. `setLoading(true)` → disables the button, shows spinner.
2. `await authAPI.login(email, password)` → sends the credentials to the Node.js backend.
3. Backend returns `{ user, token }` on success.
4. `login(user, token)` → calls the `login` function from `AuthContext`. This saves the token to `localStorage` and sets the `user` state globally across the entire app.
5. **Pending check:** If the user is a doctor/staff with `status: 'pending'`, they get redirected to `/pending` (approval waiting screen), not their dashboard.
6. **Rejected check:** If `status: 'rejected'`, an API error is shown on screen.
7. `navigate(DASHBOARD[user.role])` → sends the approved user to their correct dashboard.
8. **Catch block:** If the backend returns an error (wrong password, user not found), `setApiError()` stores the message and displays it in the `<ErrorAlert>` component.
9. **Finally block:** Always runs — `setLoading(false)` re-enables the button.

---

#### 🔧 Feature 4: The Form UI (Lines 64–126)
- `<SignupLayout>` → a pre-built wrapper component that gives the form a centered card design with the ClinicOS branding. `showBack={false}` hides the "← Back" button that is shown on signup pages.
- `<form onSubmit={handleSubmit(onSubmit)}>` → `handleSubmit` intercepts the native form submit, runs Zod validation, and only calls `onSubmit` if all fields pass.
- `{...register('email')}` → spreads all the necessary props (`onChange`, `onBlur`, `name`, `ref`) onto the input so `react-hook-form` can track it.
- `type={showPass ? 'text' : 'password'}` → toggles between visible/hidden password based on the `showPass` state, controlled by the Eye icon button.
- `disabled={loading}` → prevents the user from clicking "Sign In" multiple times while a request is already in flight.
- `<Link to="/signup">` and `<Link to="/forgot-password">` → client-side navigation links at the bottom, no full page reload.

### Q8: What does `location.pathname.startsWith(r)` do, and how does it help hide the Navbar?
**A:** Let's break it word by word:
- `location` → the object returned by `useLocation()`. It represents the current URL.
- `location.pathname` → the path portion of the URL. e.g., if the full URL is `http://localhost:5173/pending`, then `location.pathname` is the string `"/pending"`.
- `.startsWith(r)` → a plain JavaScript string method. It checks: *"Does this string start with the given value?"* Returns `true` or `false`.

**In context:**
```js
const HIDE_NAV_ROUTES = ['/pending', '/unauthorized']
const isAuthPage = HIDE_NAV_ROUTES.some(r => location.pathname.startsWith(r))
```
`.some()` loops through the array and returns `true` if **at least one** element matches. So:
- URL is `/pending`     → `"/pending".startsWith("/pending")` → `true` → hide Navbar ✅
- URL is `/admin`       → `"/admin".startsWith("/pending")`   → `false`, `"/admin".startsWith("/unauthorized")` → `false` → show Navbar ✅
- URL is `/unauthorized/page` → `startsWith("/unauthorized")` → `true` → hide Navbar ✅ (this is the benefit of `startsWith` over strict equality — it catches sub-paths too)

---

### Q9: What is the difference between Routing and Navigating?
**A:** Simply put:
- **Routing** = *defining the map*. You are telling the app: "If the URL is `/login`, show `LoginPage`. If it is `/admin`, show `AdminDashboard`." This is done statically in `App.jsx` using `<Route>` components. It is the rule book.
- **Navigating** = *moving on the map*. This is the act of actually changing the URL to go somewhere. It can happen in two ways:
  - **Programmatic navigation** (in code): using the `<Navigate>` component or the `useNavigate()` hook. e.g., after a successful login, the code runs `navigate('/admin')` to send the user there.
  - **User navigation** (clicking): using a `<Link to="/admin">` component, which changes the URL without a page reload.

**Analogy:** Routing is like building the roads and road signs of a city. Navigating is like actually driving your car on those roads.

---

### Q10: What does "using `useLocation` legally inside `BrowserRouter`" mean?
**A:** React Router hooks like `useLocation()`, `useNavigate()`, and `useParams()` only work inside a component that is **a descendant of `<BrowserRouter>`**. If you try to call them outside of it, React throws an error: *"useLocation() may only be used in the context of a Router component."*

In `App.jsx`, the structure is:
```
App()              ← BrowserRouter lives here
  └── <BrowserRouter>
        └── <AppContent />   ← useLocation() is called HERE
```
`AppContent` is rendered *inside* `<BrowserRouter>`, so it is legally a "descendant" of the router. It can safely call `useLocation()`.

**Why not just call `useLocation()` directly inside `App()`?**
Because `BrowserRouter` is also defined inside `App()` — by the time React processes `App()`, the router hasn't been "set up" yet. You'd be calling a router hook before the router even exists. By splitting into `AppContent`, we guarantee the router is ready *before* `useLocation()` is called. This is a standard and widely-used React Router pattern.

### Q7: Explain the entire `App.jsx` — imports, features, and their role in the project (Viva Level)

**A:** `App.jsx` is the **"Traffic Controller"** or the **"Central Routing Map"** of the entire ClinicOS frontend. It does NOT contain any UI like buttons or forms. Its one and only job is to decide: *"For this URL, which page/component should be shown, and who is allowed to see it?"*

---

#### 📦 Import 1: `react-router-dom` (Line 1)
**Package:** `react-router-dom`
**What it does:** This is the official library for handling navigation/routing in a React app. Without it, navigating to `/admin` or clicking "Go to Dashboard" would reload the entire page like a traditional website. With it, React swaps components instantly without any page reload — this is called a **Single Page Application (SPA)**.

The specific things imported from it:
- **`BrowserRouter`**: Wraps the whole app and activates the routing system. It reads the URL from the browser's address bar (e.g., `http://localhost:5173/admin`) and makes routing decisions based on it.
- **`Routes`**: A container that holds all your `<Route>` definitions. It looks at the current URL and renders only the ONE matching route.
- **`Route`**: Defines a single URL pattern and maps it to a component. e.g., `<Route path="/login" element={<LoginPage />} />` means: "When the URL is `/login`, show `LoginPage`."
- **`Navigate`**: A special component that acts like an automatic redirect. e.g., if a logged-in user visits `/login`, `Navigate` instantly sends them to their dashboard instead.
- **`useLocation`**: A hook that gives you the current URL path the user is on (e.g., `/admin/analytics`). Used here to decide whether to show or hide the public `Navbar` and `Footer`.

---

#### 📦 Import 2: `useAuth` from `AuthContext` (Line 2)
**What it does:** This pulls the `user` object from the global `AuthContext`. The `user` object contains the logged-in user's `role` (admin, doctor, staff, patient). This is used to make smart routing decisions — e.g., redirect logged-in users away from the login page, or protect an admin route from a patient.

---

#### 📦 Import 3: Layout & Page Components (Lines 3–39)
These are all the **UI Page files** for every portal in the app. They are imported here so that `App.jsx` can map each URL to the correct page. Key ones to note:
- **`Navbar` / `Footer`**: The public landing page's top and bottom bar. These are smartly hidden inside dashboards so they don't appear there.
- **`ProtectedRoute`**: A custom component (a "guard") that checks if the user is logged in AND has the correct role before allowing access to a page. If not, it redirects to `/login` or `/unauthorized`.
- **`AdminLayout` / `DoctorLayout` / `PatientLayout`**: These are wrapper layouts for each portal. They render the portal's own sidebar/header, and then render the active sub-page inside them using `<Outlet />` (a react-router concept).

---

#### 🔧 Feature 1: `HIDE_NAV_ROUTES` constant (Line 42)
```js
const HIDE_NAV_ROUTES = ['/pending', '/unauthorized']
```
A simple list of URL paths where the public `Navbar` should be hidden (e.g., the "Pending Approval" page doesn't need a public nav). This is checked using `location.pathname.startsWith(r)`.

---

#### 🔧 Feature 2: `ComingSoon` component (Line 47)
A small placeholder component that displays a styled "Coming in next phase" message. Used for features that are planned but not yet built, so the route doesn't crash.

---

#### 🔧 Feature 3: `getDashboardRoute(role)` function (Line 56)
```js
function getDashboardRoute(role) {
  const routes = { staff:'/reception', doctor:'/doctor', admin:'/admin', patient:'/patient' }
  return routes[role] || '/'
}
```
A helper function that takes the user's `role` string and returns the correct dashboard URL for that role. It is used on the `/login` route — if a logged-in admin accidentally visits `/login`, they get redirected to `/admin` instead of seeing the login form.

---

#### 🔧 Feature 4: `AppContent` component & Smart Navbar Logic (Line 62)
This is a **separate inner component** (not the default export). It exists because `useLocation()` only works *inside* a `BrowserRouter`. Since `BrowserRouter` is in the outer `App()` function, `AppContent` is placed inside it so it can legally call `useLocation()`.

The three lines of logic:
```js
const isAuthPage      = HIDE_NAV_ROUTES.some(r => location.pathname.startsWith(r))
const isDashboardPage = user !== null
const showPublicNav   = !isAuthPage && !isDashboardPage
```
- If you are on `/pending` or `/unauthorized` → hide Navbar.
- If `user` is not `null` (i.e., you are logged in) → hide Navbar (dashboards have their own nav).
- Only show public `Navbar` + `Footer` to guests on public pages like the landing page.

---

#### 🔧 Feature 5: The Routes System (Lines 75–138)
All routes are organized into 3 categories:

**Public Routes** (anyone can access):
- `/` → `HomePage` (Landing page)
- `/login` → `LoginPage` (but redirects logged-in users to their dashboard)
- `/signup`, `/signup/patient`, `/signup/admin` etc. → Role-specific signup flows
- `/forgot-password`, `/reset-password` → Password recovery

**Protected Dashboards** (require login + correct role via `ProtectedRoute`):
- `/reception` → `ReceptionDashboard` (only `staff` or `admin` role)
- `/billing/:patientId` → `BillingScreen` (only `staff` or `admin`, with a dynamic URL using `:patientId`)
- `/doctor/*` → Nested routes inside `DoctorLayout` (only `doctor` role)
  - `/doctor` → `DoctorQueue`
  - `/doctor/consult/:tokenId` → `ConsultationForm`
  - `/doctor/patients` → `DoctorPatients`
- `/admin/*` → Nested routes inside `AdminLayout` (only `admin` role)
- `/patient/*` → Nested routes inside `PatientLayout` (only `patient` role)

**Catch-All Route** (Line 137):
```jsx
<Route path="*" element={<Navigate to="/" replace />} />
```
If a user visits any URL that doesn't exist (e.g., `/xyz`), they are automatically redirected back to the homepage. The `*` wildcard means "match everything else."

---

#### 🔧 Feature 6: The outer `App()` function (Line 145)
```jsx
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
```
This is the **default export** used by `main.jsx`. It simply wraps `AppContent` in `BrowserRouter` to activate the routing system. `BrowserRouter` is kept here (separate from `AppContent`) specifically so that `AppContent` can call `useLocation()` legally inside it.

### Q6: Can you explain the step-by-step flow of what happens in `AuthContext` when `AuthProvider` is rendered from `main.jsx`?
**A:** Yes! When you first open the URL or refresh the page, the browser runs `main.jsx`, which renders `<AuthProvider>`. Here is the exact chronological flow of what happens inside `AuthContext.jsx`:

1.  **Initial Render (State Setup):** `AuthProvider` starts running top-to-bottom. It hits the `useState` hooks. It sets `user` to `null` and `loading` to `true`.
2.  **The Spinner Renders:** Because `loading` is `true`, the code hits the `if (loading)` block at the bottom of the component. It **pauses rendering the rest of the app** and instantly prints the "Loading..." spinner to the screen. (Notice that `{children}`, which represents `<App />`, is not rendered yet!).
3.  **`useEffect` Fires:** Immediately after that first render, React fires the `useEffect` hook (because it has an empty `[]` dependency array, meaning "run on mount"). Inside, it executes the `restoreSession` function.
4.  **Checking LocalStorage:** `restoreSession` looks inside the browser's `localStorage` for a saved string called `'clinicos_token'`.
    *   **Scenario A (First-time visitor):** There is no token. It skips the API call, runs `setLoading(false)`, and jumps to Step 7.
    *   **Scenario B (Returning user):** A token is found! It moves to Step 5.
5.  **The Network Request:** It uses `await authAPI.getMe()` to call the Node.js backend. This acts as a security check: *"Here is a token I found. Is it still valid, or did it expire?"*
6.  **The Result:**
    *   **Success:** The backend confirms the token is valid and sends back the user's database record (Name, Role, Clinic Code). The code calls `setUser(res.data.data.user)`.
    *   **Failure (Catch block):** The backend says the token expired. The `catch` block runs, wiping the dead token from `localStorage` so it doesn't cause future errors.
7.  **Loading Finishes:** The `finally` block runs, calling `setLoading(false)`.
8.  **The Second Render (The App appears):** Because a state variable (`loading`) just changed, React re-runs the `AuthProvider` component. This time, `if (loading)` is `false`. The spinner disappears. The code finally reaches the `return` statement and renders `<AuthContext.Provider>`. It injects the `user`, `login`, and `logout` variables into the "pipe", and finally renders `{children}` — which is your actual `<App />`.

**Result:** The user sees the main application either already logged in (if the token was valid) or sees the login page (if they are a guest), with absolutely no UI flickering!
### Q4: What does `AuthContext.jsx` do, and what is `AuthProvider`?
**A:** `AuthContext.jsx` acts as the **"Global Authentication Manager"** for your entire React app. Instead of every individual page (Dashboard, Profile, etc.) having to figure out if a user is logged in, this single file manages it. 

The `AuthProvider` is the actual React Component exported from this file that "wraps" around your app (which you saw in `main.jsx`). Its job is to hold the actual state variables (like `user` and `loading`) and provide functions like `login()` and `logout()`. It acts as a powerful broadcast tower: any component sitting inside the `AuthProvider` can tune in to this broadcast and instantly access those variables and functions without needing them passed down as props.

### Q5: Break down the imports in `AuthContext.jsx` — what is each one used for?
**A:** Let's look at the tools imported at the top of the file:

**From React:**
- `createContext`: A React function used to create the empty Context object (`AuthContext`). Think of this as laying down the empty pipe that will carry the data.
- `useContext`: A hook that allows other components to "consume" or read the data from that pipe. In this file, `useAuth()` is a custom hook that wraps `useContext(AuthContext)` to make it easier for other files to grab the data.
- `useState`: A hook used to create variables that tell React to re-render the UI when they change. Used here for `user` (to store the logged-in user's data) and `loading` (to show a spinner while checking the session).
- `useEffect`: A hook that tells React to run a specific piece of code automatically. Here, it is used with an empty dependency array `[]` so that it runs **exactly once** when the app first loads. It checks `localStorage` to see if the user has an old token stored from a previous visit.

**From your own project:**
- `authAPI` (imported from `../services/api`): This is an object containing functions that make actual HTTP requests to your Node.js backend. The `useEffect` calls `authAPI.getMe()` to ask the backend: *"Hey, I found this saved token. Is this user still valid, or did their session expire?"*
### Q3: Why do we use `<React.StrictMode>` in `main.jsx`?
**A:** `StrictMode` is a built-in React tool used **only during development** to help you find potential bugs and warn you about problematic code (like using old, deprecated React features). 
The most noticeable thing it does is **intentionally double-execute** your components and `useEffect` hooks in development mode. It does this on purpose to ensure your components are "pure" and don't have unexpected side-effects (e.g., if a component breaks when rendered twice, it indicates a flaw in its logic). 

*Important Note:* It does **not** affect or slow down your production build at all. It's strictly a developer helper!
### Q1: Why is `AuthContext` saved in a folder named `context`? What does it mean?
**A:** In React, **Context** (`React.createContext`) is a built-in feature used to share data (like the currently logged-in user) across the entire application without having to pass it down manually as "props" from parent to child through every single component. 
We save it in a folder named `context/` purely for **organization/architecture**. It keeps our global state management separate from our UI components (like buttons), pages (like Dashboard), and API services.

### Q2: Why is `App.jsx` wrapped inside `AuthContext` (specifically `<AuthProvider>`) in `main.jsx` before rendering?
**A:** By wrapping the entire `<App />` component inside `<AuthProvider>`, we make sure that **every single screen and component** inside the app has access to the authentication state. 
This means whether you are deep inside the `PatientDashboard` or the `ReceiptModal`, any component can simply call `const { user, login, logout } = useAuth();` to instantly get the user's details or log them out. If we didn't wrap the whole app, components outside the provider wouldn't be able to access the logged-in user's data.
