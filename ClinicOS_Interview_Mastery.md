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
