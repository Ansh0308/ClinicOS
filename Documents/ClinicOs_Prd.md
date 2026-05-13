# ClinicOS

### Clinic Management & Patient Experience Platform

#### Product Requirements Document

```
Version 3.0 · Final · Confidential
26 February 2026
```
**# Section Coverage**

1 Project Overview & Goals Summary, problem statement, solution, MVP definition,
strategic goals

2 Target Audience 4 primary roles, 3 secondary roles, constraints

3 Complete Site Map 26 pages — components, roles, priority for every page

4 Feature Overview Table 19 core + 6 additional features with priority

5 Features F1–F7 P0 Must-have features — full specs with tech reqs & success
criteria

6 Features F8–F13 Should-have features — full specs

7 Features F14–F19 Additional features — offline, kiosk, payments, labs, multi-clinic,
tele

8 Features F20–F25 New additions: Rx library, QR check-in, shift handover,
referrals, 2FA, rate-limiting

9 Data Model 8 core entities with full field schemas

10 API Reference REST endpoints — patients, queue, visits, messaging, billing,
analytics

11 Messaging Templates 10 templates + variables + opt-out rules

12 Privacy & Consent DPDP compliance, consent flow, PHI rules

13 Success Metrics / KPIs Operational + business + system KPIs with targets

14 Tech Stack Frontend, backend, integrations, infra

15 Acceptance Tests 7 formal test cases (AT-01 to AT-07)

16 Developer Handoff Checklist 35 - item sign-off list

17 Phased Roadmap Phase 0–3 with sprint suggestions


```
# Section Coverage
```
```
18 Non-functional Requirements Performance, security, scalability, a11y
```
```
19 Risks & Mitigations 7 risks with severity and mitigation
20 Next Steps 10 actions with owners and deadlines
```
## 1. Project Overview & Goals

#### 1.1 Executive Summary

ClinicOS is an all-in-one clinic management platform that digitizes the complete patient lifecycle —
from appointment booking and queue management to billing, visit history, and automated multi-
channel communication. It eliminates paper-based processes, reduces wait times, and gives every
role in a clinic (patient, doctor, staff, admin) a tailored, fast, and intuitive interface.

#### 1.2 Problem Statement

- Patients wait 45–90 minutes with zero visibility into queue status or realistic ETAs
- Doctors cannot recall last visit details, medications, or complaints without paper files
- Front-desk staff manually manage tokens on whiteboards, leading to errors and queue chaos
- Bills are printed on paper — no digital trail, no audit history, no easy resending
- No automated communication; patients miss turns or arrive far too early
- Clinic owners have no real-time visibility into revenue, throughput, or wait performance

#### 1.3 MVP Outcome

```
MVP Definition
A working web app where staff can register/look up patients by phone, create and serve tokens,
doctors can view history and record consultations, and the system sends automated
WhatsApp/SMS/Email
messages and records bills and visit history — accessible via role-based dashboards.
```
#### 1.4 Strategic Goals

- Reduce front-desk check-in to < 20 seconds for returning patients
- Replace manual token boards with automated real-time queue with ETA
- Give doctors full patient history in < 5 seconds
- Automate 100% of routine patient communications (WhatsApp / SMS / Email)


- Automate billing receipt delivery for all paid bills
- Provide clinic owners live financial and operational dashboards
- Achieve 40% reduction in average patient wait time within 3 months

## 2. Target Audience

#### 2.1 Primary Users

```
Role Profile Primary Goal Key Pain Today
Receptionist /
Staff
```
```
Daily operator, 30– 100
patients/day, low training
tolerance
```
```
Register patients in <
20s, manage queue,
create bills
```
```
Paper tokens, manual
lookups, no notification
system
```
```
Doctor /
Practitioner
```
```
Time-constrained
clinician, tech-moderate
```
```
Full patient history
instantly, record
consultation, control line
```
```
Cannot recall last
medications without
hunting paper files
Clinic Admin /
Owner
```
```
Business operator, tracks
clinic performance
```
```
Live revenue, patients,
wait-time metrics
```
```
No real-time visibility;
relies on verbal staff
updates
Patient Age 18–70, smartphone
user, 1–6 visits/year
```
```
Book, track queue, get
notified, view bills
```
```
Long unpredictable
waits; no digital receipts
```
#### 2.2 Secondary Users

- Lab Technicians — receive lab orders, push patient back to queue after test
- Accountants / Managers — export financial reports and compliance audits
- Pharmacists — view and print prescriptions dispensed at clinic

#### 2.3 Environment & Constraints

- Single or multi-doctor clinics (MVP: single doctor; v2: multi-doctor)
- Low training tolerance — core actions must complete in ≤ 3 taps
- Connectivity may be intermittent — offline resilience desirable for critical flows
- Primary devices: staff on desktop/tablet, doctors on tablet, patients on mobile
- India-first deployment: supports INR, GST, DLT-registered SMS, DPDP Act 2023 compliance


## 3. Complete Site Map (26 Pages)

Every page below lists: purpose, key UI components, user roles that access it, and priority (Must-
have / Should-have / Nice-to-have).

#### 3.1 Public / Marketing (no login required)

**P- 1** (^) **Landing / Home** ⬤ **Should-have**
Purpose: explain ClinicOS value proposition and drive sign-ups or contact.

- Components: hero section, feature summary cards, role CTA buttons (Patient / Doctor /
    Staff), pricing tiers, testimonials, footer (privacy, terms, contact)
- Roles: Public (unauthenticated)
- SEO-optimised with Next.js SSR; load time < 2s on 4G

**P- 2** (^) **Services (public list)** ⬤ **Should-have**
Purpose: list clinic services, expected durations, and prices visible before login.

- Components: service cards with icon/price/duration, search + filter bar, service detail modal,
    'Book Now' CTA
- Roles: Public / Patient

**P- 3** (^) **Pricing / Plans (SaaS)** ⬤ **Should-have**
Purpose: SaaS subscription tiers with feature comparison and contact/trial CTA.

- Components: pricing table, feature comparison matrix, FAQ accordion, contact form
- Roles: Public (clinic owners evaluating the product)

**P- 4** (^) **Login / Signup / OTP** ⬤ **Must-have**
Purpose: secure role-based authentication and onboarding.

- Components: role selector (Patient / Doctor / Staff / Admin), email+password form, OTP
    input, forgot-password flow, Google SSO (Phase 2)
- Roles: All
- 2FA via SMS/Email OTP; brute-force lockout after 5 failed attempts

**P- 5** (^) **Forgot Password / Reset** ⬤ **Must-have**


Purpose: self-service password reset via OTP verification.

- Components: phone/email input, OTP step, new password form, confirmation
- Roles: All

##### P- 6 Help / FAQ / Contact / About ⬤ Should-have

Purpose: support documentation, company info, and contact channel.

- Components: searchable FAQ, tutorial videos, live chat widget, contact form, changelog
- Roles: All

#### 3.2 Patient Portal (/patient/)

##### PT- 1 Patient Dashboard ⬤ Must-have

Purpose: single view for upcoming appointment, active token status, and quick actions.

- Components: upcoming appointment card, current token + ETA countdown, 'Join Queue' /
    'Book Appointment' CTA, recent invoices list, visit history snapshot (last 3 visits)
- Roles: Patient
- Real-time ETA updates via WebSocket; mobile-first layout

**PT- 2** (^) **Book Appointment / Services** ⬤ **Must-have**
Purpose: patient self-books appointment choosing service, doctor, date, and time.

- Components: service category selector, doctor cards with availability, calendar picker,
    available slot grid, booking summary, payment (optional), confirmation + message trigger
- Roles: Patient
- Conflict detection prevents double-booking; slot reservation has 5-minute hold before expiry

##### PT- 3 Live Queue Tracker ⬤ Must-have

Purpose: patient joins queue remotely or on-site and tracks live position.

- Components: token position indicator, tokens-ahead timeline, live ETA countdown, 'Notify me
    at 2-before' toggle, 'Leave Queue' button, doctor status badge
- Roles: Patient
- WebSocket updates; sharable link for family members to track patient's position


**PT- 4** (^) **Visit History / Medical Records** ⬤ **Must-have**
Purpose: chronological view of all past visits with prescriptions, diagnoses, and attachments.

- Components: timeline view, per-visit accordion (complaint, diagnosis, medicines, tests),
    prescription PDF download, lab result viewer, date and doctor filters
- Roles: Patient
- Patients see only their own data; doctor notes marked 'private' are hidden

**PT- 5** (^) **Bills & Payments** ⬤ **Must-have**
Purpose: view, pay, and download all invoices.

- Components: bill list (with status badges: pending / paid / partial), invoice detail + PDF
    viewer, online payment button (Razorpay), receipt download
- Roles: Patient

**PT- 6** (^) **Profile & Notification Preferences** ⬤ **Must-have**
Purpose: manage personal details, consent, and communication preferences.

- Components: personal info form (name, DOB, gender, email, address), messaging consent
    toggle (per channel: WhatsApp / SMS / Email), language preference, delete account request
- Roles: Patient

##### PT- 7 Notifications Log ⬤ Should-have

Purpose: full log of all WhatsApp/SMS/Email messages sent to the patient.

- Components: message history list with channel icon, timestamp, delivery status, template
    name, body preview
- Roles: Patient

#### 3.3 Staff / Reception Portal (/staff/)

**ST- 1** (^) **Reception Dashboard** ⬤ **Must-have**
Purpose: central hub for patient intake, queue overview, and daily snapshot.

- Components: phone lookup input (autofocus on page load), 'New Patient' quick-add button,
    create token action, today's appointments list, queue summary widget (now/next/waiting
    count), mini stats (patients today, revenue today)
- Roles: Receptionist / Staff


- Keyboard-optimised: Enter on phone number triggers lookup; all core actions ≤ 3 keystrokes

**ST- 2** (^) **Patient Detail Page (staff)** ⬤ **Must-have**
Purpose: full patient record with quick actions for staff.

- Components: demographics, contact info, last visit notes summary, upcoming appointments,
    outstanding balance, action buttons (issue token, create bill, attach file, edit demographics)
- Roles: Receptionist / Staff

##### ST- 3 Queue Management Console ⬤ Must-have

Purpose: visual queue board with full one-tap operational controls.

- Components: draggable queue rows (token#, patient name, status badge, ETA, wait time,
    service/doctor), action icon bar (pause/resume, emergency, send-to-lab, bring-back, mark
    served), doctor status header, queue health indicator
- Roles: Receptionist / Staff / Doctor
- Real-time updates via WebSocket; undo last action within 10 seconds

**ST- 4** (^) **Billing & Payments** ⬤ **Must-have**
Purpose: create itemized bills, record payment, send receipts.

- Components: service line-item selector (from catalog), quantity + price editor, discount field,
    tax auto-calculation, total display, payment method selection (cash/card/UPI/online), 'Send
    Receipt' button, reprint option
- Roles: Receptionist / Staff

**ST- 5** (^) **Messaging Templates & Logs** ⬤ **Should-have**
Purpose: manage message templates, consent list, and delivery logs.

- Components: template editor (variables dropdown, preview pane, test-send), consent/opt-out
    patient list, message history table (channel, status, timestamp, patient name, template)
- Roles: Staff Admin / Admin

**ST- 6** (^) **Patient Directory** ⬤ **Should-have**
Purpose: browse and search all patients registered at the clinic.

- Components: search bar (name / phone / ID), filter by date registered, doctor, status; result
    table with quick-action column (view, new token, new bill)
- Roles: Staff


#### 3.4 Doctor Portal (/doctor/)

**D- 1** (^) **Doctor Dashboard** ⬤ **Must-have**
Purpose: current patient, queue preview, quick stats, and status controls.

- Components: current patient card (name, token, complaint preview, last visit date), 'Open
    Consultation' CTA, next 3 tokens snapshot, patients-seen-today count, doctor status toggle
    (available / on lunch / on break), quick access to last 5 patient histories
- Roles: Doctor

**D- 2** (^) **Consultation / EHR Page** ⬤ **Must-have**
Purpose: structured form to capture every detail of a patient consultation.

- Components: complaint input (text + tag autocomplete), vitals section (BP, pulse, temp,
    weight, height), diagnosis field (with ICD code lookup optional), prescription builder (medicine
    search from library, dose/freq/duration), test orders section, follow-up date picker, file
    attachment, doctor notes (private), autosave indicator, 'Save & Sign' button with audit entry
- Roles: Doctor
- Autosave every 30 seconds; previous visit panel on right for context

**D- 3** (^) **Patient Timeline / History (doctor)** ⬤ **Must-have**
Purpose: longitudinal view of all visits with search and filter.

- Components: chronological timeline, per-visit accordion, prescription history, lab results,
    complaint trend tags, date/doctor filter, keyword search across notes
- Roles: Doctor

**D- 4** (^) **Schedule / Availability** ⬤ **Should-have**
Purpose: manage working hours, breaks, and days off synced with booking.

- Components: weekly schedule grid, break slots, holiday/leave blocks, avg. consult time
    setting (used for ETA), Google Calendar / Outlook sync toggle
- Roles: Doctor

#### 3.5 Admin Portal (/admin/)


**A- 1** (^) **Admin Overview Dashboard** ⬤ **Must-have**
Purpose: real-time KPIs for clinic-wide performance.

- Components: patients today, revenue today/week/month, avg wait time (line chart), complaint
    count, token throughput, doctor utilisation, queue health RAG indicator, no-show rate
- Roles: Admin / Owner

**A- 2** (^) **Reports & Exports** ⬤ **Should-have**
Purpose: generate financial, operational, and compliance reports.

- Components: report type selector (financial / operational / compliance), date range,
    doctor/service filter, preview pane, export CSV/PDF, scheduled report setup (weekly email)
- Roles: Admin

**A- 3** (^) **Users & Roles Management** ⬤ **Must-have**
Purpose: add staff accounts, assign roles, and manage permissions.

- Components: user table, invite by email/phone, role selector (Doctor / Staff / Admin),
    permission matrix, deactivate / re-activate, audit log link per user
- Roles: Admin

**A- 4** (^) **Services & Pricing Management** ⬤ **Should-have**
Purpose: CRUD for clinic services and pricing rules.

- Components: service list with active/inactive toggle, add/edit service form (name, category,
    price, duration, GST applicability), bulk price update
- Roles: Admin

**A- 5** (^) **Integrations & Settings** ⬤ **Must-have**
Purpose: configure all external integrations and global clinic settings.

- Components: WhatsApp provider config (API key, phone number ID), SMS gateway, SMTP
    setup, payment gateway keys, clinic profile (name, logo, address, tax number), working
    hours, tax rules, token prefix/numbering style
- Roles: Admin

**A- 6** (^) **Audit Logs & Data Retention** ⬤ **Should-have**


Purpose: view change history and configure compliance settings.

- Components: log table (user, action, resource, timestamp, IP), action-type filter, user filter,
    date filter, CSV export, retention policy settings, backup status display
- Roles: Admin

#### 3.6 System & Legal Pages

```
Page Path Priority Notes
```
```
Token Display / Kiosk /kiosk Nice-to-have Public display board, no PHI, auto-
refresh
Privacy Policy /privacy Must-have DPDP Act + GDPR-aligned
```
```
Terms of Use /terms Must-have Clinic SaaS and patient usage
terms
```
```
Help / Docs / Tutorials /help Should-have Searchable FAQ, embedded
tutorial videos
```
```
404 Not Found /404 Must-have With navigation recovery links
```
```
500 Server Error /500 Must-have With status page link and support
contact
```
## 4. Feature Overview (25 Features)

Complete feature registry with priority, module assignment, and section reference. Features F20–
F25 are additions beyond both reference PRDs.

```
# Feature Name Priority Module Section
```
```
F1 Smart Patient Entry — Phone Lookup
& Quick Registration
```
```
Must-have Staff / All §
```
```
F2 Queue & Token Management — Live
Line Tracking
```
```
Must-have Staff / Doctor §
```
```
F3 Messaging Automation — WhatsApp /
SMS / Email Triggers
```
```
Must-have System §
```
```
F4 Visit / EHR Persistence — Doctor
Remembers Everything
```
```
Must-have Doctor §
```
```
F5 One-Tap Operational Controls —
Pause, Lab, Emergency
```
```
Must-have Doctor / Staff §
```
```
F6 Billing & Digital Receipts Must-have Staff §
```

```
# Feature Name Priority Module Section
```
```
F7 Clinic Statistics & Analytics Dashboard Must-have Admin / Staff §
```
```
F8 Appointment Booking & Calendar
Integration
```
```
Should-
have
```
```
Patient / Staff §
```
```
F9 Messaging Template Editor & Consent
Management
```
```
Should-
have
```
```
Admin §
```
```
F10 Global Search & Patient Directory Should-
have
```
```
Staff / Doctor §
```
```
F11 Audit Logs & Compliance (Security) Must-have Admin / System §
F12 Reports & Exports (Financial +
Operational)
```
```
Should-
have
```
```
Admin §
```
```
F13 Role-based Access Control (RBAC) Must-have System / Admin §
F14 Payments & Refunds Integration Should-
have
```
```
Patient / Staff §
```
```
F15 Lab Orders & Results Integration Should-
have
```
```
Doctor / Staff §
```
```
F16 Multi-clinic / Multi-location Support Nice-to-
have
```
```
Admin §
```
```
F17 Offline Resilience & Background Sync Nice-to-
have
```
```
All §
```
```
F18 Kiosk Mode & Token Display Board Nice-to-
have
```
```
Staff §
```
```
F19 Telemedicine / Video Consult Nice-to-
have
```
```
Doctor / Patient §
```
```
F20 Prescription Template Library Should-
have
```
```
Doctor §
```
```
F21 Patient QR Self-Check-in Should-
have
```
```
Patient / Staff §
```
```
F22 Staff Shift Handover & Clinic Notes Should-
have
```
```
Staff §
```
```
F23 Patient Referral Tracking Should-
have
```
```
Doctor §
```
```
F24 Two-Factor Authentication (2FA) Must-have System / Auth §
```
```
F25 API Rate Limiting & Abuse Prevention Must-have System / DevOps §
```
## 5. Must-Have Features (F1 – F7)


All features in this section are P0 Must-have and must be completed in Phase 1 (MVP). Every
feature includes: detailed description, user interaction flow, technical requirements, and success
criteria.

```
F
```
##### Smart Patient Entry — Phone Lookup &

##### Quick Registration

```
⬤ Must-have
```
###### Description

Receptionist (or kiosk) types a phone number → the system performs an immediate lookup. If the
phone exists, the UI pre-fills patient name, last visit date, outstanding balance, and a history
preview. If not found, a minimal quick-create form appears (phone auto-filled, optional
name/gender/DOB, consent toggles). This feature is the single highest-impact time-saver for front-
desk operations — the entire check-in experience hinges on it.

###### User Interaction Flow

- Receptionist opens Reception Dashboard → keyboard autofocuses on the phone lookup
    field.
- Types phone number → instant match suggestions appear (debounced, 300ms).
- One match found → patient card auto-populates (name, last visit, balance); 'Issue Token'
    button activates.
- Multiple matches (rare) → modal list shows name + last visit date; receptionist picks one.
- No match → quick-create modal with phone pre-filled; minimal fields (name optional, DOB
    optional, consent toggle); 'Create' → new patient card returned immediately.
- After patient selected/created → receptionist selects service/doctor → issues token →
    WhatsApp/SMS sent automatically.

###### Technical Requirements

- Indexed DB search on phone field; API POST /api/patients/lookup returns match in ≤ 500ms
    under expected load.
- Redis caching for recent lookups (last 500 phone lookups per clinic per day).
- Phone normalization: strip country codes, whitespace, dashes before lookup (e.g. +91- 98765 -
    43210 → 9876543210).
- Fuzzy match for common formatting variations; unique constraint on normalized phone +
    clinic_id.
- Idempotent create path: upsert pattern prevents duplicate creation on double-submit.
- Consent capture at creation: opt_in_messaging boolean + consent_timestamp + source
    ('staff').
- Optimistic UI rendering: patient card appears instantly while server confirms; graceful error on
    offline.
- Logging of lookup results (match rate analytics: matched vs new vs multiple).


###### Success Criteria

- ≥ 90% of returning patients auto-identified within 1 second of phone entry.
- Lookup API P50 response time < 500ms; P99 < 1 second under load.
- Time from phone entry to token issued: < 30 seconds for new patient; < 20 seconds for
    returning.
- Zero duplicate patient records created under concurrent registration attempts.
- 100% of new patients created with consent flag recorded.

```
F
```
##### Queue & Token Management — Live Line

##### Tracking

```
⬤ Must-have
```
###### Description

Tokens created for walk-ins and appointments, displayed on an interactive real-time queue board
visible across all connected devices. Queue shows 'now' (in-consult), 'next', and 'waiting' statuses
with estimated wait time per token, token source (walk-in / appointment / emergency), and doctor
assignment. Supports multi-doctor queues and service-based queues.

###### User Interaction Flow

- Receptionist creates token from patient card → token appears at end of designated queue
    within 1 second on all dashboards.
- Queue board shows each row: Token # | Patient Name | Status | Source | ETA | Doctor.
- Doctor dashboard shows 'Current Patient' card, next token, and the full queue snapshot.
- Patient portal shows only their own position and ETA (not other patients' names).
- Staff can reorder tokens by drag-and-drop or use one-tap actions (emergency, pause, lab).
- ETA recalculates automatically after every status change, reorder, or pause/resume.
- When doctor marks current patient 'served', queue advances automatically; next patient
    receives WhatsApp.

###### Technical Requirements

- WebSocket (Socket.IO) for real-time sync — queue changes broadcast to all connected
    clients within 1 second.
- Persistent queue state stored in PostgreSQL (source of truth) + Redis (hot cache for fast
    reads).
- Optimistic locking + DB transactions for reorder and status changes (prevent race conditions
    and lost tokens).
- ETA engine: moving average of last 10 consult durations per doctor; configurable
    floor/ceiling.
- Audit log entry for every token status change and reorder (user, timestamp, before/after
    state).


- Multi-tenant: queues are fully isolated per clinic; multi-doctor: separate queue per doctor
    within a clinic.
- Token printing / kiosk output format: PDF slip or thermal print (80mm format) via browser print
    API.
- Queue state persistence: on server restart, queue is reconstructed from DB so no tokens are
    lost.

###### Success Criteria

- Token creation reflected on all dashboards within ≤ 1 second of creation.
- Reorder and status-change operations complete without conflicts in 99.9% of attempts.
- ETA error: abs(estimated – actual wait) median < 15 minutes for clinics with avg consult > 15
    min; < 40% relative error for short consults.
- Queue board loads within 2 seconds on 4G mobile for queues up to 100 tokens.
- Zero lost tokens during concurrent operations (validated by load test).

```
F
```
##### Messaging Automation — WhatsApp / SMS

##### / Email Triggers

```
⬤ Must-have
```
###### Description

Fully configurable templates with event-driven automatic triggers. Core triggers: token issued, two-
patients-before reminder, your-turn, queue pause/resume, bill sent, appointment
confirmed/reminder, lab return. WhatsApp Business API is the primary channel; SMS and Email are
parallel or fallback channels. All sends are queued, logged, retried on failure, and respect patient
opt-out.

###### User Interaction Flow

- System event fires (e.g. token created) → messaging service evaluates rules and checks
    patient consent.
- If consented → selects channel (WhatsApp primary; SMS fallback after 5-min failure; Email
    parallel).
- Message rendered with template variables (name, token#, ETA, clinic, doctor, amount) →
    enqueued.
- Provider sends message → delivery webhook received → status updated in MessageLog
    (queued/sent/delivered/failed).
- Staff can view delivery log per patient; admin can view aggregate delivery stats in settings.
- Patient receives opt-out link (email) or can reply STOP (SMS); system updates
    opt_in_messaging = false.

###### Technical Requirements


- Integration with Meta WhatsApp Business API or Twilio WhatsApp Sandbox; abstraction layer
    for provider switch.
- Message broker (RabbitMQ or AWS SQS) with exponential back-off retry (3 attempts) and
    dead-letter queue.
- Provider webhook endpoint to receive delivery receipts and update MessageLog status.
- Template engine: variable substitution, conditional blocks (e.g. if estimate > 0 show ETA),
    Unicode support.
- Opt-out handling: SMS STOP detection, WhatsApp opt-out link, email unsubscribe link — all
    update consent flag.
- Throttling and cost controls: daily message cap per patient (configurable); rate-limit per
    provider account.
- SMS DLT registration (India): all SMS templates pre-registered; sender ID configured.
- Message delivery dashboard: per-channel success rate, failure reasons, cost estimate per
    day.

###### Success Criteria

- Message send success rate ≥ 95% across provider delivery reports.
- Trigger-to-send latency P50 < 10 seconds; P95 < 30 seconds.
- Retry mechanism reduces transient send failures by ≥ 70% on first reattempt.
- 100% of sends respect opt-out (zero messages sent to opted-out patients).
- Templates editable with live preview and test-send functionality in admin UI.

```
F
```
##### Visit / EHR Persistence — Doctor

##### Remembers Everything

```
⬤ Must-have
```
###### Description

Complete structured electronic health record for each consultation: complaint, vitals, diagnosis,
investigations ordered, prescriptions with dosage details, follow-up instructions, file attachments
(lab reports, images), and billing linkage. Every entry is auditable — who saved it, when, and what
changed.

###### User Interaction Flow

- Doctor clicks 'Open Consultation' for current token → structured form loads with patient
    history in right panel.
- Doctor fills: complaint (free text + tag autocomplete), vitals (BP/pulse/temp/weight/height),
    diagnosis, notes.
- Doctor builds prescription using medicine search (library with autocomplete): name → dose
    → freq → duration → instructions.
- Doctor orders lab tests; optionally creates a lab order slip.
- Doctor attaches files (drag-and-drop; up to 10MB per file).
- Form autosaves every 30 seconds; doctor taps 'Save & Sign' → visit locked with audit entry.


- Reception receives notification that consultation is complete and can generate bill.
- Previous visit panel shows last 5 visits collapsed; 'Full History' opens timeline.

###### Technical Requirements

- Normalized data model: Visit → Prescription[], TestOrder[], Attachment[] (see §9 Data
    Model).
- WYSIWYG/structured form with autosave and optimistic save; versioned edits (immutable
    primary + amendable notes).
- Attachments stored in S3-compatible storage (encrypted); access via pre-signed URLs with
    24h expiry.
- Audit trail: every save records (user_id, timestamp, JSON diff); visible in admin audit log.
- Full-text search across complaint, diagnosis, and notes fields (Postgres tsvector or
    Elasticsearch).
- PDF export: printable prescription template with clinic letterhead, doctor signature block, QR
    to digital record.
- Medicine library: searchable drug database (generic + brand names); expandable by admin.
- Role-based visibility: doctor notes (private) hidden from patient portal; attachments visible to
    patient.

###### Success Criteria

- Doctor retrieves full patient history within ≤ 5 seconds for 95% of requests.
- 100% of visits saved with complete audit metadata (user, timestamp).
- File attachments upload ≤ 10MB with progress indicator; accessible from patient timeline.
- Search returns relevant visits for name/complaint keyword queries with > 85% recall.
- Zero data loss on autosave (validated by disconnection test scenarios).

##### F5 One-Tap Operational Controls —^ Pause,

##### Lab, Emergency, Bring-back

```
⬤ Must-have
```
###### Description

Single-click controls for managing operational irregularities that happen constantly in real clinics:
pausing the queue for a doctor break, sending a patient for lab tests, bringing them back with
priority, and emergency push-to-front. Each action is atomic, auditable, and can optionally trigger a
patient notification.

###### User Interaction Flow

- Pause Line: staff clicks 'Pause' on queue header → confirmation pop-up → queue status =
    paused; all ETAs frozen; optional bulk WhatsApp to next 3 patients ('doctor on break'); pause
    banner shown on all dashboards.


- Resume: same button → queue resumes; ETAs recalculate from current time;
    queue_resumed message sent.
- Send to Lab: staff clicks 'Lab' icon on token row → select lab test(s) → token status =
    on_hold; patient's position held; patient receives 'proceed to lab, your place is saved'
    WhatsApp.
- Bring Back: staff opens on-hold list → clicks 'Return' on patient → option: next-available or
    front of queue → patient re-inserted; patient receives 'your turn is coming, please return'
    WhatsApp.
- Emergency: staff clicks 'Emergency' on patient card → confirm → token inserted at position
    1; all downstream tokens shift down; doctor receives in-app alert; affected patients receive
    ETA update.
- Undo: all one-tap actions show a 10-second undo toast (except emergency, which requires
    re-confirmation to reverse).

###### Technical Requirements

- All queue state changes are atomic DB transactions; no partial updates possible.
- UI confirmations before destructive actions; undo capability via event sourcing (queue state
    snapshots).
- Business rules: maximum 3 emergency promotions per hour per queue (configurable;
    prevents abuse).
- Each one-tap action creates an audit log entry: action type, user, token_id, before/after queue
    state.
- Hooks into messaging engine: each action can optionally fire a notification template.
- Pause/resume state persisted in DB (not just Redis) so a server restart does not lose paused
    state.

###### Success Criteria

- Pause/resume updates queue state and all downstream ETAs within ≤ 2 seconds.
- Send-to-lab and bring-back operations execute without losing token order in 99.9% of
    attempts.
- Emergency promotion moves patient to immediate next slot within ≤ 1 second of confirmation.
- Undo successfully reverts action in 95% of attempts within the 10-second window.
- All one-tap actions produce audit entries (100% coverage, verified by test suite).

**F6** (^) **Billing & Digital Receipts** ⬤ **Must-have**

###### Description

Create and manage itemized bills linked to a visit. Supports configurable tax rules (GST), discounts,
multiple payment modes (cash/card/UPI/online), partial payments, refunds, and generates a
branded PDF receipt with clinic letterhead and QR code linking to the digital receipt. Receipts are
sent automatically via the messaging engine.


###### User Interaction Flow

- After consultation, receptionist clicks 'Create Bill' on patient visit card.
- Adds services and medicines from catalog (searchable dropdown); quantities auto-fill from
    prescription.
- System auto-calculates tax (GST rate from clinic settings), discounts, and total.
- Receptionist selects payment method (cash/card/UPI) and records payment amount.
- Bill status updates to 'paid'; PDF generated with clinic branding (< 5 seconds).
- WhatsApp + Email sent automatically with receipt link and PDF attachment.
- Patient can download receipt from patient portal (/patient/bills) without expiry.
- Admin can view full billing history and export financial reports per date range.

###### Technical Requirements

- Financial rules engine: configurable GST rates per service category, discount type
    (flat/percentage), rounding rules.
- PDF pipeline: Puppeteer or PDFKit with Handlebars template (clinic logo, GST number, QR
    code).
- Idempotent billing: unique constraint on visit_id + bill prevents duplicate bills.
- Payment gateway webhook handling (Razorpay/Stripe): mark invoice paid within 30s of
    webhook.
- Partial payment support: bill_paid_amount tracked; status = 'partial' until fully settled.
- Refund flow: admin/staff initiates refund via provider API; revenue reports reflect refund within
    24h.
- Compliance: bills retained for ≥ 5 years (configurable); export for GST filing.

###### Success Criteria

- Bill creation (open form → PDF generated): < 2 minutes end-to-end.
- Receipts sent for 100% of bills where patient has opted in for messaging.
- PDF generation ≤ 5 seconds for standard bills (< 20 line items).
- Payment reconciliation accuracy 100% (invoice total = sum of payments recorded).
- Refunds processed and reflected in revenue reports within 24 hours.

**F7** (^) **Clinic Statistics & Analytics Dashboard** ⬤ **Must-have**

###### Description

Real-time and historical KPIs: patients today, revenue, average wait time, token throughput, no-
shows, top complaints/services, doctor utilisation, and message delivery stats. Interactive
visualizations with date/doctor filters, drilldowns, and scheduled exports.


###### User Interaction Flow

- Admin opens Analytics Dashboard → default view: today's KPIs + 7-day trend charts.
- Admin filters by date range, doctor, service, or clinic location (multi-clinic phase).
- Charts: revenue (bar by day), avg wait (line trend), complaints (horizontal bar, top 10),
    throughput (area by hour).
- Drilldown: click on a KPI card → underlying data table (e.g., list of visits contributing to avg
    wait).
- Export: CSV or PDF of current view; scheduled weekly report emailed automatically.
- Staff dashboard shows simplified version: patients today, revenue today, queue health.

###### Technical Requirements

- Aggregation pipeline: materialized views refreshed every 5 minutes for real-time feel; full
    recalculation on export.
- Time-series charts via Recharts / Chart.js; responsive for tablet view.
- Scheduled reports: cron job triggers PDF generation + email on configured schedule (e.g.
    Monday 8AM).
- Role-based visibility: revenue metrics restricted to Admin; staff sees patient counts and
    queue stats only.
- Data retention: historical data stored for minimum 3 years; archival after 5 years.
- Drilldown tables paginated (50 rows/page); searchable and sortable.

###### Success Criteria

- Dashboard loads within ≤ 3 seconds for 7– 30 - day date ranges.
- KPI calculations correct per defined business rules (validated by unit test suite on
    aggregation logic).
- Scheduled reports delivered on time with ≥ 95% success rate.
- Export CSV/PDF generation completes within 30 seconds for up to 1 year of data.
- Revenue figures match billing records to the rupee (reconciliation test).

## 6. Should-Have Features (F8 – F13)

```
F
```
##### Appointment Booking & Calendar

##### Integration

```
⬤ Should-have
```
###### Description


Patients book appointments online by selecting service, doctor, and available time slot.
Receptionists can also create, reschedule, and cancel appointments. System prevents double-
booking, sends confirmation and reminder notifications, and optionally syncs to the doctor's external
calendar (Google / Outlook).

###### User Interaction Flow

- Patient selects service category → available doctors and their slots display in calendar grid.
- Patient selects a slot → 5-minute hold placed on that slot (prevents racing bookings).
- Patient enters phone number → returning patient auto-fills; new patient completes minimal
    form.
- Patient confirms → appointment record created; confirmation WhatsApp + Email sent;
    optional calendar invite generated.
- 24 hours before appointment → automated reminder sent (WhatsApp + Email).
- 1 hour before → second reminder sent.
- Receptionist can reschedule from staff dashboard → automated rescheduling notification
    sent.
- On appointment day → patient checks in at reception → token issued from appointment →
    normal queue flow begins.

###### Technical Requirements

- Availability engine: doctor schedule (weekly template) minus existing appointments minus
    breaks.
- Transactional slot reservation with 5-minute TTL hold using Redis; released on timeout or
    cancellation.
- Conflict detection: DB-level unique constraint on (doctor_id, scheduled_time, status ≠
    'cancelled').
- Calendar OAuth integration: Google Calendar API + Microsoft Graph API for doctor calendar
    sync.
- Appointment reminder scheduler: cron jobs fire 24h and 1h before each booked appointment.
- Webhook handlers for calendar sync conflicts (external event blocks a slot; auto-notify
    patient).

###### Success Criteria

- Booking success rate > 99% — zero double-bookings under normal load.
- 24h and 1h reminders delivered with ≥ 95% success rate.
- Calendar sync adds event to doctor calendar within 30 seconds of booking.
- Slot hold released reliably within 5 minutes of abandonment (no phantom reservations).

##### F9 Messaging Template Editor & Consent

##### Management

```
⬤ Should-have
```

###### Description

Admin and staff can create, edit, test, and version message templates for all channels. Consent
management provides a full view of patient opt-in/opt-out status per channel, with bulk tools and
opt-out handling fully integrated with the messaging engine.

###### User Interaction Flow

- Admin navigates to Templates page → sees all templates listed with channel, trigger event,
    and last-edited date.
- Admin edits a template: WYSIWYG editor with variable placeholders from a dropdown;
    preview pane shows rendered message with sample values.
- Admin taps 'Test Send' → enters own phone/email → receives test message.
- Admin saves → new template version created; previous version archived (rollback available).
- Consent page: table of all patients with per-channel opt-in status; filter opted-out; bulk re-
    consent tool.
- Patient opts out via STOP/unsubscribe → status updates in real time; no further messages
    sent.

###### Technical Requirements

- Template versioning: each save creates immutable version record; rollback restores previous
    without downtime.
- Variable validation: UI warns if unsupported variables are used; required variables
    highlighted.
- Opt-out webhook handlers: SMS STOP keyword, WhatsApp opt-out callback, Email
    unsubscribe link all update opt_in_messaging.
- Consent audit: every consent change logged with timestamp, source, and user (or patient
    self).
- Template engine supports conditional blocks (e.g. {if est_wait > 0}Your wait is {est_wait}
    min{/if}).

###### Success Criteria

- Templates editable and deployable within admin UI with working preview and test-send.
- 100% of sends respect opt-out status at time of send.
- Template rollback tested: previous version activates within 60 seconds of rollback action.
- Consent changes reflected in messaging engine within 5 seconds.

**F10** (^) **Global Search & Patient Directory** ⬤ **Should-have**

###### Description


Global search across patients, visits, bills, tokens, and appointments. Supports searching by phone,
name, token number, bill ID, and free-text in notes (with PHI access controls). Patient directory
provides browsable, filterable list for staff and doctors.

###### User Interaction Flow

- Staff types query in global search bar (top navigation) → instant suggestions appear
    categorised (Patients, Visits, Bills).
- Staff clicks result → navigates to relevant page with quick actions (open profile, issue token,
    create bill).
- Patient Directory page: table of all patients with search bar (name/phone/ID) and filters
    (registered date, doctor, active/inactive).
- Doctor can search by complaint keyword within visit notes for their own patients.

###### Technical Requirements

- Full-text search index on patient name, phone, complaint text, diagnosis (Postgres tsvector or
    Elasticsearch).
- Autocomplete via Redis-backed sorted set of recent/frequent search terms per clinic.
- Permission enforcement: staff cannot search doctor-private notes; patients cannot search
    other patients.
- Search analytics: log top searched terms for UX improvement.
- Pagination: 20 results per page; lazy-load on scroll.

###### Success Criteria

- Search latency P50 < 300ms; P99 < 800ms for typical datasets.
- Name/phone query recall > 95% in production dataset.
- Role-based filters prevent PHI exposure across all search result types (zero leaks in security
    audit).
- Autocomplete suggestions appear within 200ms of keystroke.

**F11** (^) **Audit Logs & Compliance** ⬤ **Must-have**

###### Description

Immutable append-only log of all critical system actions: patient creation/edits, visit saves and
amendments, bill generation/edits, token reorders, template changes, role changes, login/logout
events. Supports compliance exports and forensic investigation.

###### User Interaction Flow

- Every critical action in the system automatically creates an audit entry (no user action
    required).


- Admin navigates to Audit Logs → table with: timestamp, user, action type, resource type + ID,
    IP address.
- Admin filters by user, action type, date range, or resource ID.
- Admin clicks a log entry → detail view with full metadata and link to the affected record.
- Admin exports filtered log to CSV for legal / compliance teams.

###### Technical Requirements

- Append-only log table: INSERT only, no UPDATE or DELETE permitted (enforced by DB
    trigger or separate log DB).
- All audit entries include: user_id, session_id, IP address, action, resource_type, resource_id,
    before/after JSON snapshot, timestamp.
- Retention policy: configurable (default 5 years); archival to cold storage after retention period.
- Optional: cryptographic signing of log batches for tamper evidence (HMAC or Merkle chain).
- RBAC for log access: only Admin role can view; Super Admin for export.
- Correlate logs with API request IDs for end-to-end request tracing.

###### Success Criteria

- 100% of defined critical actions produce an audit entry (validated by integration tests).
- Audit logs accessible to authorized admins; exports generated within 30 seconds for up to 1
    year.
- Logs retained per retention policy with zero modification possible (tamper test passes).
- Log query performance: 1-year filtered query returns in < 5 seconds.

**F12** (^) **Reports & Financial Exports** ⬤ **Should-have**

###### Description

Generate financial, operational, and compliance reports with date/doctor/service filters. Reports are
viewable in-app and exportable as PDF or CSV. Scheduled report delivery by email on a weekly or
monthly cadence.

###### User Interaction Flow

- Admin opens Reports page → selects report type: Financial / Operational / Compliance /
    Custom.
- Sets date range, optional doctor/service filter → 'Generate' → preview loads in < 3 seconds.
- Admin exports as PDF (formatted, branded) or CSV (raw data for Excel).
- Admin sets up scheduled report: select report type + frequency (daily/weekly/monthly) +
    recipient emails → saves.
- Cron fires on schedule → report generated → emailed as PDF attachment.


###### Technical Requirements

- Aggregation queries optimized with materialized views and/or indexes; EXPLAIN ANALYZE
    reviewed for long queries.
- PDF reports use branded template (clinic logo, report title, date range, page numbers).
- Scheduled report engine: cron-based job queue (not in-process cron); retry on failure.
- CSV exports: UTF-8 with BOM for Excel compatibility; large exports streamed (not buffered in
    memory).
- Report access logged in audit trail.

###### Success Criteria

- Report generation and preview loads within 3 seconds for 30-day range.
- Scheduled reports delivered at configured time with ≥ 95% on-time delivery.
- Revenue totals in reports match billing records to the rupee (reconciliation tested).
- CSV exports import cleanly into Excel without encoding issues.

##### F13 Role-Based Access Control (RBAC) ⬤ Must-have

###### Description

Comprehensive permission system ensuring each user role can access only the data and actions
appropriate to their function. RBAC is enforced at both the API layer and UI layer, with every access
attempt logged.

###### User Interaction Flow

- Admin creates user → assigns role (Patient / Doctor / Staff / Admin) → permissions take
    effect immediately.
- Doctor logs in → sees only Doctor Portal; cannot access Admin or Billing pages.
- Patient logs in → sees only their own data (visits, bills, queue position); cannot see other
    patients.
- Staff logs in → can manage queue and billing but cannot edit clinical notes or access admin
    settings.
- Admin can promote/demote roles; role changes take effect on next login (or within 5 minutes
    via session invalidation).

###### Technical Requirements

- RBAC matrix: role × resource × action (create/read/update/delete/admin) defined in code as
    policy.
- Middleware enforces permissions on every API route; UI hides inaccessible navigation items.
- JWT claims carry role; role changes invalidate existing JWT within 5 minutes (Redis-backed
    token blocklist).


- Row-level security: patient data queries automatically scoped to clinic_id and patient_id (no
    cross-tenant or cross-patient leaks).
- Permission violations logged as audit events with severity = WARN.

###### Success Criteria

- Zero cross-role data exposure in security audit (penetration test).
- Role changes take effect within 5 minutes of assignment.
- Permission check latency < 5ms added per request (middleware overhead).
- 100% of API routes protected by role middleware (verified by route coverage test).

## 7. Additional Features (F14 – F19)

##### F14 Payments & Refunds Integration ⬤ Should-have

###### Description

Support online payments for appointment booking and bill settlement via integrated payment
gateway (Razorpay / Stripe). Handles webhook confirmation, generates receipts, supports partial
payments, and processes refunds reflected in revenue reports.

###### User Interaction Flow

- Patient clicks 'Pay Online' on bill → redirected to payment gateway checkout (hosted or
    embedded).
- Patient completes payment → gateway sends webhook → invoice marked paid; receipt
    generated and sent.
- Partial payment: patient pays partial amount → bill status = 'partial'; remaining balance
    shown.
- Admin initiates refund from billing page → refund sent via gateway API → revenue report
    updated.

###### Technical Requirements

- Payment gateway SDK integration (Razorpay Orders API / Stripe Payment Intents) with
    idempotency keys.
- Webhook signature verification to prevent spoofed payment confirmations.
- PCI-DSS compliance via gateway tokenization: no raw card data touches ClinicOS servers.
- Idempotency on webhook processing: duplicate webhooks do not create duplicate payments.


- Refund API call + internal bill status update in same DB transaction.

###### Success Criteria

- Payment confirmation processed and invoice updated within 30 seconds of webhook receipt.
- Payment success rate > 98% (gateway-dependent).
- Refunds reconciled in revenue reports within 24 hours.
- Zero duplicate charges from duplicate webhook delivery.

**F15** (^) **Lab Orders & Results Integration** ⬤ **Should-have**

###### Description

Create lab orders from the consultation UI, track sample collection and processing status, and
attach results to the patient's visit record. Supports both integrated labs (HL7/FHIR API) and
manual result upload for non-integrated labs.

###### User Interaction Flow

- Doctor orders tests during consultation → lab order created with test codes and urgency.
- Staff prints lab order slip or sends to integrated lab via API.
- Lab updates sample status (collected → processing → resulted).
- When result available: file attached to visit; patient notified via WhatsApp; token 'return from
    lab' flow triggered.
- Staff can also manually upload result PDF for non-integrated labs.

###### Technical Requirements

- HL7 FHIR R4 ServiceRequest and DiagnosticReport resources for lab integration (Phase 3).
- File upload: secure multipart upload to S3; virus scan on upload; accessible via pre-signed
    URL.
- Lab order lifecycle tracked in DB: order_status ENUM (ordered / collected / processing /
    resulted / cancelled).
- Notification hook: result_ready message template fires when status changes to 'resulted'.
- Test code mapping table: links test names to billable service items.

###### Success Criteria

- Automated lab result attachments reduce manual uploads by ≥ 70% for integrated labs.
- Lab order status updates reflected in system within < 5 minutes for integrated partners.
- Manual PDF upload completes within 30 seconds for files up to 10MB.
- 100% of lab results linked to the correct patient visit (validated by integration tests).


**F16** (^) **Multi-clinic / Multi-location Support** ⬤ **Nice-to-have**

###### Description

Single admin account manages multiple clinic branches with shared staff (optional), per-location
reporting, and centralized billing. Each branch has its own queue, patients, and services while
sharing global configuration.

###### User Interaction Flow

- Admin creates additional clinic branch → configures services, staff, doctors, and settings per
    branch.
- Staff assigned to specific branch(es); cannot access data from other branches unless
    granted.
- Reports can be viewed per-branch or aggregated across all branches.
- Patient records are shared across branches if patient is seen at multiple locations.

###### Technical Requirements

- Multi-tenant schema: clinic_id foreign key on every patient-facing resource; query scoping at
    ORM level.
- RBAC extension: branch-level permissions (staff can be granted access to specific
    clinic_ids).
- Aggregation layer for cross-branch KPIs in admin dashboard.
- Patient record sharing: patient is globally unique by phone; visits are scoped to clinic_id.

###### Success Criteria

- Multi-branch reports accurately aggregate or break down metrics per site (reconciliation test).
- Role assignment prevents cross-branch data access (zero leaks in security test).
- Cross-branch patient lookup (by phone) returns visits from all branches visible to that admin.

##### F17 Offline Resilience & Background Sync ⬤ Nice-to-have

###### Description

Critical operations continue briefly when connectivity is poor: patient lookup from cache, new token
creation (queued locally), and visit note drafting. Background sync resumes once connectivity
returns with conflict resolution.


###### User Interaction Flow

- Reception uses web app; network drops → app shows 'Offline Mode' banner.
- Reception can look up recent patients from local cache (last 200 patients indexed locally).
- Reception creates token → stored in IndexedDB queue → synced to server when online.
- If conflict detected on sync (another staff created same token) → staff receives resolution
    prompt.

###### Technical Requirements

- Service Worker for caching app shell, static assets, and recent patient data.
- IndexedDB for queued offline mutations (token creations, note drafts).
- Sync queue: processes pending mutations on reconnect; idempotent server endpoints
    prevent duplicates.
- Conflict resolution strategy: last-write-wins for demographics; staff-confirmation for queue
    position.

###### Success Criteria

- App functions for core operations during offline periods up to 30 minutes.
- Offline tokens sync to server without data loss in ≥ 95% of sync attempts.
- Conflict prompts appear within 5 seconds of reconnection when conflicts exist.

**F18** (^) **Kiosk Mode & In-Clinic Token Display** ⬤ **Nice-to-have**

###### Description

Public-facing display (TV or tablet) shows current token being served, next tokens, estimated wait
times, and a clinic notice board. Optionally supports self-service token printing for walk-in patients.

###### User Interaction Flow

- Staff opens /kiosk URL on a dedicated display device → full-screen token board auto-
    refreshes.
- Board shows: currently serving token, next 3 tokens, estimated waits, doctor name, clinic
    announcements.
- Optional: kiosk allows patient to enter phone → self-register or join queue → prints token slip.
- Token slips: 80mm thermal format with token number, ETA, clinic name, and QR code linking
    to queue tracker.

###### Technical Requirements

- Kiosk endpoint is read-only and public (no auth required); exposes only token numbers and
    status (no PHI).


- Auto-refresh via Server-Sent Events (SSE) or polling every 3 seconds.
- Configurable display templates: clinic logo, colour scheme, font size for visibility from a
    distance.
- Thermal printer integration via Web USB API or local print server (CUPS on Linux).

###### Success Criteria

- Kiosk display updates within 2 seconds of queue changes.
- Printed tokens are human-readable with correct token number and current ETA.
- Kiosk never exposes patient names or PHI (security audit pass).

**F19** (^) **Telemedicine / Video Consult** ⬤ **Nice-to-have**

###### Description

Host secure video consultations integrated into the doctor workflow. Tele-consults appear as a
distinct appointment type; doctors conduct the video call from within the Doctor Dashboard; EHR
and billing flows remain identical.

###### User Interaction Flow

- Patient books 'Tele-consult' appointment type → receives secure meeting link via WhatsApp
    + Email.
- At appointment time → doctor clicks 'Start Video Call' on doctor dashboard → video call
    opens in browser.
- Doctor conducts consultation; notes, prescriptions, and tests are recorded as normal.
- After call → billing and EHR flow is identical to in-person visit.

###### Technical Requirements

- WebRTC via Twilio Video SDK or self-hosted Jitsi (E2EE for sensitive consultations).
- Secure, time-limited meeting links (expires 15 min after appointment slot ends).
- Consent for recording captured at booking; recording stored encrypted with patient-controlled
    access.
- Network check on page load: falls back to audio-only if video bandwidth insufficient.

###### Success Criteria

- Successful video connections in ≥ 90% of attempts on typical 4G connection.
- Meeting links expire correctly (tested: expired link returns 403 after appointment window).
- End-to-end call latency < 300ms P50 on 4G networks.


## 8. Additional Features — New Additions (F20 – F25)

These six features were absent from both reference PRDs but are considered important for a
complete, production-grade clinic platform. They address gaps in prescription efficiency, patient
experience, staff operations, inter-doctor workflows, and system security.

```
F20
```
##### Prescription Template Library (Doctor

##### Quick-Rx)

```
⬤ Should-have
```
###### Description

Doctors can save common prescriptions as named templates (e.g. 'Viral Fever — 3 days',
'Hypertension follow-up'). During a consultation, a doctor selects a template and instantly populates
the entire prescription block, which they can then customise. This dramatically reduces consultation
time for routine cases.

###### User Interaction Flow

- Doctor opens Consultation page → clicks 'Load Template' in the prescription section.
- Dropdown shows saved templates, recently used at the top; doctor searches by name.
- Doctor selects template → prescription fields auto-fill (medicines, doses, durations).
- Doctor edits any field as needed → saves as part of the visit.
- Doctor can save the current prescription as a new template (name it, optionally share with
    colleagues).
- Admin can manage a clinic-wide shared template library in admin settings.

###### Technical Requirements

- Prescription templates stored per-doctor and per-clinic; visibility: personal or shared (clinic-
    wide).
- Template versioning: edits create new version; old prescriptions that used a template retain
    the version at time of use.
- Template structure mirrors the Prescription JSONB schema used in Visit entity (reuses
    existing data model).
- Usage analytics: track which templates are used most frequently (informs template
    refinement).

###### Success Criteria

- Prescription loading from template completes within 1 second.
- Doctor can create, edit, and delete personal templates within the consultation UI.


- Shared clinic templates managed by admin without requiring a developer.
- Visit records always reflect the final saved prescription, not the source template.

##### F21 Patient QR Self-Check-in ⬤ Should-have

###### Description

Patients who have pre-booked an appointment (or are returning patients) can scan a QR code
displayed at the clinic entrance or at the reception desk to check themselves in and join the queue
— without waiting to speak to staff. Staff receive a notification and can confirm or modify the check-
in.

###### User Interaction Flow

- Clinic generates a unique daily check-in QR code from admin dashboard (refreshes
    midnight).
- QR is displayed at clinic entrance (print or screen).
- Patient scans QR with phone camera → opens a mobile web page (no app install).
- Patient enters phone number → returning patient: one-tap confirm to join queue. New patient:
    minimal registration form.
- System creates token; patient receives WhatsApp with token number and ETA.
- Staff dashboard shows 'Self-checked-in' badge on the token; staff can confirm or override.

###### Technical Requirements

- QR code encodes a short-lived signed URL (clinic_id + date + HMAC signature; 24h validity).
- Mobile web page is a lightweight PWA-lite page (< 50KB, no framework dependency); works
    on all phones.
- Anti-abuse: rate-limit per IP (max 10 check-ins per IP per hour); max 1 active token per
    patient per day.
- Staff notification: real-time Socket.IO event when self-check-in token is created.
- QR page accessible without login; PHI displayed only to the patient after phone verification.

###### Success Criteria

- Self-check-in flow completes (scan → token issued) in < 30 seconds on mobile.
- QR page loads in < 2 seconds on 3G connection.
- Returning patients complete self-check-in with one confirmation tap (no re-entry of data).
- Anti-abuse: duplicate token creation prevented in 100% of test scenarios.

**F22** (^) **Staff Shift Handover & Clinic Daily Notes** ⬤ **Should-have**


###### Description

A structured daily shift log allows staff to record important notes at the start and end of each shift —
pending tasks, patient escalations, cash balance, equipment issues, and messages for the
incoming shift. Prevents information loss between shifts and reduces verbal handover errors.

###### User Interaction Flow

- At shift start: staff opens 'Shift Log' → sees previous shift's notes; adds their own opening
    note (cash balance, pending tasks, any carry-over patient situations).
- During shift: staff can add timestamped notes (e.g. 'Patient X asked for callback', 'Printer
    paper low').
- At shift end: staff adds closing note (patients seen, revenue collected, outstanding issues).
- Incoming staff sees the full shift log for the day on their dashboard as a widget.
- Admin can view all shift logs in the audit/reports section; searchable by date.

###### Technical Requirements

- Shift log stored as append-only entries per clinic per day (shift_log table: clinic_id, user_id,
    timestamp, type, note).
- Dashboard widget shows last 3 shift log entries with 'View All' link.
- Notes support plain text and optional severity tag (info / action-required / urgent).
- Shift log included in admin reports and exportable for compliance.

###### Success Criteria

- Shift log entry saves within 1 second of submission.
- Incoming staff sees previous shift notes without additional navigation steps.
- Admin can retrieve any shift log by date range within 3 seconds.

**F23** (^) **Patient Referral Tracking** ⬤ **Should-have**

###### Description

Doctors can refer a patient to another doctor or specialist (within the same clinic or externally). The
referral is recorded in the patient's visit, the receiving doctor is notified, and the outcome of the
referral can be logged when the patient returns. This closes the clinical loop and builds a richer
patient record.

###### User Interaction Flow


- During consultation, doctor clicks 'Refer Patient' → selects internal doctor or enters external
    specialist details.
- Referral note created: reason, urgency (routine / urgent / emergency), clinical summary auto-
    populated from current visit.
- If internal referral: receiving doctor receives in-app notification with referral summary; patient
    added to their queue or given appointment.
- Patient receives WhatsApp with referral details and (if applicable) appointment time.
- When patient is seen by receiving doctor, they can mark referral as 'attended' and add
    outcome notes.
- Referring doctor sees referral outcome in patient's history timeline.

###### Technical Requirements

- Referral entity: referral_id, visit_id, referring_doctor_id, receiving_doctor_id (or
    external_name), reason, urgency, status (pending/attended/declined), outcome_notes.
- Internal referral notification: Socket.IO event to receiving doctor's dashboard.
- Referral summary PDF: auto-generated from consultation notes (shareable with external
    specialists).
- Referral analytics: track referral rates per doctor and most common referral reasons.

###### Success Criteria

- Referral created and receiving doctor notified within 5 seconds.
- Referral summary PDF generated within 10 seconds for standard visit notes.
- Referral loop closed rate (referrals marked 'attended'): tracked as a KPI in admin analytics.

##### F24 Two-Factor Authentication (2FA) ⬤ Must-have

###### Description

All staff, doctor, and admin accounts require two-factor authentication. Patients use phone OTP as
their primary authentication mechanism. 2FA adds a critical security layer to protect sensitive PHI
and financial data from compromised passwords.

###### User Interaction Flow

- Staff/Doctor/Admin: on login, enters email + password → OTP sent to registered phone/email
    → enters OTP → session created.
- Admin can enforce 2FA for all clinic staff from admin settings (non-bypassable once
    enforced).
- Trusted device: after successful 2FA, user can mark device as trusted for 30 days
    (configurable).
- Patient: phone OTP is the primary authentication (no password required); OTP valid for 5
    minutes.


- If phone lost: admin can initiate account recovery and temporary access via email fallback.
- Brute force protection: OTP locked after 5 failed attempts; 15-minute cooldown.

###### Technical Requirements

- TOTP (RFC 6238) support as alternative to SMS OTP for staff (works with Google
    Authenticator / Authy).
- SMS OTP via MSG91/Twilio; Email OTP via SMTP; TOTP via qrcode generation at setup.
- OTP stored as HMAC hash (not plaintext); expires after 5 minutes; single-use (invalidated on
    first correct use).
- Trusted device: device fingerprint stored as signed token in HttpOnly cookie (30-day expiry).
- Rate limiting: 5 OTP requests per phone number per 15 minutes.
- All 2FA events (success, failure, lockout) logged in audit trail.

###### Success Criteria

- 2FA enrollment rate: 100% for staff/doctor/admin accounts after enforcement date.
- OTP delivery time < 10 seconds via SMS; < 5 seconds via Email.
- Zero successful brute-force OTP attacks in penetration test.
- Trusted device token expires correctly at 30 days (tested via time manipulation).

**F25** (^) **API Rate Limiting & Abuse Prevention** ⬤ **Must-have**

###### Description

Protect all API endpoints against abuse, brute-force attacks, and cost-inflating bot traffic. Rate
limiting is applied per IP, per user, and per API key (for integrations). DDoS mitigation is handled at
the infrastructure level with application-layer rate limiting as an additional layer.

###### User Interaction Flow

- Anonymous endpoints (login, patient lookup, OTP): rate-limited per IP (e.g. 20 req/min).
- Authenticated endpoints: rate-limited per user account (e.g. 300 req/min per staff user).
- Messaging APIs: rate-limited per clinic to prevent accidental mass-send loops.
- Rate limit exceeded → 429 Too Many Requests with Retry-After header.
- Admin dashboard shows rate-limit events and top offending IPs.

###### Technical Requirements

- Rate limiting middleware using Redis sliding window counters (no memory leak; accurate
    under burst).
- Tiered limits: unauthenticated < authenticated staff < admin; configurable per endpoint group.


- DDoS mitigation at infrastructure level: Cloudflare WAF or AWS Shield (Basic for MVP;
    Advanced for production).
- IP blocklist: auto-block IPs that exceed 10x normal rate for > 5 minutes; manual unblock via
    admin.
- Slow-path endpoints (report generation, PDF export) rate-limited more aggressively (e.g. 5
    req/min).

###### Success Criteria

- Rate limit correctly applied: 100% of requests over limit receive 429 (validated by load test).
- Legitimate peak-hour clinic traffic never hits rate limits (tested at 200 concurrent users).
- Login endpoint blocks brute-force attempts (5 failures → 15-min lockout) in 100% of test
    scenarios.
- Rate limit overhead < 2ms added to request P50 latency.

## 9. Data Model (Entity Reference)

All tables use UUID primary keys. Every patient-facing record is scoped to clinic_id (multi-tenant).
Soft delete only — no hard deletion of patient, visit, or billing records. Timestamps in UTC stored as
TIMESTAMPTZ.

#### 9.1 Core Entities

```
Entity Key Fields Primary
Relationships
```
```
Notes
```
```
Patient patient_id, phone
(unique/clinic), name, dob,
gender, email,
opt_in_messaging,
consent_timestamp, clinic_id
```
```
→ Visit[], Token[],
Bill[], MessageLog[]
```
```
Phone is primary
lookup key;
normalized on
write
```
```
Visit visit_id, patient_id, doctor_id,
clinic_id, visit_date,
start/end_time, complaint,
complaint_tags[], diagnosis,
notes (private), prescriptions
JSONB, tests_ordered[],
attachments[], follow_up_date,
bill_id
```
```
Patient, Doctor,
Clinic, Bill
```
```
autosave field:
draft_notes; locked
after Save & Sign
```

**Entity Key Fields Primary
Relationships**

```
Notes
```
**Token / QueueItem** token_id, token_number (daily
sequence), patient_id,
doctor_id, queue_type ENUM,
status ENUM, queue_position,
estimated_wait_mins,
issued_at, called_at,
served_at

```
Patient, Doctor, Visit
(nullable)
```
```
Persisted in DB +
Redis; rebuilt from
DB on restart
```
**Appointment** appointment_id, patient_id,
doctor_id, service_id,
scheduled_time, status
ENUM, source ENUM, notes

```
Patient, Doctor,
Service
```
```
Slot reservation
TTL handled in
Redis; conflict by
unique index
```
**Doctor** doctor_id, clinic_id, name,
specialization,
avg_consult_mins, schedule
JSONB, status ENUM,
calendar_sync_token

```
Clinic, Visit[], Token[] avg_consult_mins
auto-calibrates
from last 10 visits
```
**Bill / Invoice** bill_id, visit_id, patient_id,
items JSONB, subtotal,
tax_amount,
discount_amount,
total_amount, payment_status
ENUM, sent_via[], receipt_url,
paid_at

```
Visit, Patient Idempotent:
unique constraint
on visit_id
```
**MessageLog** message_id, patient_id,
to_contact, channel ENUM,
template_id, variables
JSONB, status ENUM,
provider_message_id,
provider_response JSONB,
sent_at, delivered_at

```
Patient Append-only;
delivery status
updated by
provider webhook
```
**Clinic** clinic_id, name, address,
logo_url, settings JSONB
(msg_provider, tax_rate,
working_hours, token_prefix),
whatsapp_config, smtp_config
(encrypted)

```
Doctor[], Staff[],
Patient[]
```
```
settings JSONB
avoids schema
migrations for
config changes
```
**Referral** referral_id, visit_id,
referring_doctor_id,
receiving_doctor_id,
external_specialist, reason,
urgency ENUM, status ENUM,
outcome_notes

```
Visit, Doctor × 2 Status: pending /
attended /
declined /
cancelled
```
**ShiftLog** log_id, clinic_id, user_id,
timestamp, type ENUM, note,
severity ENUM

```
Clinic, User Append-only;
never edited or
deleted
```
**PrescriptionTemplate** template_id, doctor_id,
clinic_id, name, visibility

```
Doctor, Clinic visibility: personal
or clinic-wide
```

```
Entity Key Fields Primary
Relationships
```
```
Notes
```
```
ENUM, prescriptions JSONB,
usage_count, created_at
```
```
AuditLog log_id, user_id, session_id,
ip_address, action,
resource_type, resource_id,
before_snapshot JSONB,
after_snapshot JSONB,
timestamp
```
```
User (all roles) Append-only;
retention
configurable;
cryptographic
signing optional
```
## 10. API Reference (REST / JSON)

Authentication: JWT Bearer token on all routes except /api/auth/*. Multi-tenant: clinic_id extracted
from JWT claims — never passed by client. Full OpenAPI 3.1 spec to be authored during
engineering Phase 0.

#### 10.1 Patient APIs

```
POST /api/auth/otp/request // Request OTP for patient login
POST /api/auth/otp/verify // Verify OTP → return JWT
POST /api/auth/login // Staff/Doctor/Admin email+password → JWT
```
```
POST /api/patients/lookup
Body: { phone: '+919XXXXXXXXX' }
200: { patient: PatientObject, last_visit: VisitSummary, active_token:
TokenObject|null }
404: { message: 'Patient not found' }
```
```
POST /api/patients
Body: { phone, name?, dob?, gender?, email?, opt_in_messaging? }
201: { patient: PatientObject }
```
```
GET /api/patients/:id
200: { patient, visits: VisitSummary[], tokens: Token[], bills: Bill[] }
```
```
PATCH /api/patients/:id
200: { patient: PatientObject }
```
```
GET /api/patients // Directory: ?name=&phone=&page=1&limit=20
```
#### 10.2 Queue / Token APIs


```
POST /api/queues
Body: { patient_id, doctor_id?, service_id?, source:
'walkin'|'appointment'|'emergency' }
201: { token: TokenObject, estimated_wait_mins: 35, queue_position: 4 }
```
```
GET /api/queues // ?status=waiting&doctor_id=xxx&date=2025- 01 - 01
200: { tokens: TokenObject[], queue_paused: false, avg_consult_mins: 12 }
```
```
PATCH /api/queues/:id/status
Body: { status: 'now'|'paused_lab'|'served'|'cancelled' }
200: { token: TokenObject }
```
```
POST /api/queues/emergency Body: { patient_id, doctor_id }
POST /api/queues/pause Body: { send_notification: true }
POST /api/queues/resume
POST /api/queues/:id/lab Body: { tests: ['CBC','LFT'],
expected_return_mins: 30 }
POST /api/queues/:id/return Body: { position: 'next'|'front' }
POST /api/queues/:id/undo // Undo last action within 10s window
```
#### 10.3 Visit / EHR APIs

```
POST /api/visits
Body: { patient_id, doctor_id, complaint, complaint_tags[], diagnosis, notes,
prescriptions: [{name,dose,freq,duration,instructions}],
tests_ordered[], follow_up_date?, token_id }
201: { visit: VisitObject }
```
```
GET /api/visits // ?patient_id=&from=&to=&doctor_id=&keyword=
PATCH /api/visits/:id // Amend notes; creates audit diff
```
```
POST /api/visits/:id/attachments // multipart/form-data
201: { url: 'https://s3.../presigned-url' }
```
```
GET /api/prescription-templates
POST /api/prescription-templates
DELETE /api/prescription-templates/:id
```
```
POST /api/referrals
Body: { visit_id, receiving_doctor_id?, external_specialist?, reason, urgency }
201: { referral: ReferralObject }
```
#### 10.4 Messaging & Notification APIs

```
POST /api/messages/send
Body: { patient_id, template_id, channel: 'whatsapp'|'sms'|'email', variables:
{} }
201: { message_id, status: 'queued' }
```

```
GET /api/messages // ?patient_id=&channel=&from=&to=&status=
```
```
POST /api/webhooks/whatsapp // Provider delivery receipt (no auth — HMAC
verified)
POST /api/webhooks/sms
POST /api/webhooks/email
```
```
GET /api/templates
POST /api/templates
PATCH /api/templates/:id
POST /api/templates/:id/test-send Body: { to_contact }
```
#### 10.5 Billing APIs

```
POST /api/bills
Body: { visit_id, items: [{service_id, qty, unit_price, description}],
discount_amount? }
201: { bill: BillObject, receipt_url: 'https://...' }
// Auto-triggers bill_receipt WhatsApp + Email if patient opted in
```
```
GET /api/bills/:id
PATCH /api/bills/:id/payment
Body: { amount_paid, payment_method: 'cash'|'card'|'upi'|'online',
reference_id? }
```
```
POST /api/bills/:id/refund
Body: { amount, reason }
200: { bill: BillObject, refund: RefundObject }
```
#### 10.6 Analytics & Admin APIs

```
GET /api/clinic/stats
Query: ?from=2025- 01 - 01&to=2025- 01 - 31&doctor_id=&export=csv|pdf
200: { patients_today, revenue_today, avg_wait_mins, complaints_count,
token_throughput, no_show_rate, top_complaints: [],
doctor_utilisation: [] }
```
```
GET /api/reports/financial ?from=&to=&format=pdf|csv
GET /api/reports/operational ?from=&to=
GET /api/audit-logs ?action=&user_id=&from=&to=&page=
```
```
GET /api/shift-logs ?date=&clinic_id=
POST /api/shift-logs
```
```
GET /api/services
POST /api/services
PATCH /api/services/:id
```

```
DELETE /api/services/:id // Soft delete
```
## 11. Messaging Templates

All templates use {variable} placeholders resolved at send time. Templates are editable via the
admin UI (F9). Variables are validated against the available variable registry before a template can
be activated.

```
Template Variable Registry
{patient_name} — Patient's first name; defaults to 'Patient' if not set
{token_no} — Assigned token number (e.g. #23)
{est_wait} — Estimated wait in minutes (integer)
{queue_position} — Current position in queue (integer)
{clinic_name} — Clinic display name from settings
{doctor_name} — Doctor's full name
{appointment_time} — Formatted appointment date + time (e.g. Mon 15 Jan at 10:30 AM)
{amount} — Bill total (e.g. ₹450.00)
{receipt_link} — Short URL to branded PDF receipt
{result_link} — Short URL to lab result attachment
{lab_tests} — Comma-separated list of ordered tests
{break_duration} — Estimated break duration in minutes
```
```
Template Key Trigger Channel Sample Message Copy
```
```
token_issued On queue entry WA +
SMS
```
```
Hi {patient_name}, your token at
{clinic_name} is #{token_no}. Est. wait:
{est_wait} mins. We'll keep you posted!
Reply STOP to opt out.
two_before Queue position =
current+2
```
```
WA +
SMS
```
```
Hi {patient_name} 👋 Only 2 patients
ahead of you at {clinic_name}. Please
make your way in soon so you don't miss
your turn!
your_turn Token status → 'now' WA +
SMS
```
```
🔔 Hi {patient_name}, it's YOUR TURN at
{clinic_name}! Token #{token_no} —
please come to the doctor's room right
now.
```
```
queue_paused Doctor taps Pause WA Hi {patient_name}, the doctor at
{clinic_name} is on a short break
(~{break_duration} min). We'll message
you before your turn. Sorry for the wait!
```
```
queue_resumed Doctor taps Resume WA Hi {patient_name}, good news — the
queue at {clinic_name} has resumed! Your
```

```
Template Key Trigger Channel Sample Message Copy
```
```
updated wait is ~{est_wait} min. See you
soon 🙏
```
```
bill_receipt Bill generated + paid WA +
Email
```
```
✅ Thank you {patient_name}. Your bill of
₹{amount} at {clinic_name} is ready.
Download receipt: {receipt_link}. Get well
soon!
```
```
appt_confirmed Appointment booked WA +
Email
```
```
Hi {patient_name} ✅ Your appointment
with Dr. {doctor_name} at {clinic_name} is
confirmed for {appointment_time}. See you
then!
```
```
appt_reminder_24h 24h before
appointment
```
```
WA +
Email
```
```
⏰ Reminder: Your appointment at
{clinic_name} with Dr. {doctor_name} is
tomorrow at {appointment_time}. Please
arrive 5 min early.
```
```
appt_reminder_1h 1h before
appointment
```
WA (^) 🏥 Almost time! Your appointment at
{clinic_name} is in 1 hour
({appointment_time}). We look forward to
seeing you.
lab_sent Token sent to lab WA Hi {patient_name}, your place in the queue
at {clinic_name} is saved! Please proceed
to the lab for: {lab_tests}. We'll message
you when to return 👍
lab_return Lab result received WA Hi {patient_name}, your lab results are in!
Please return to the clinic — your turn is
coming up soon. Queue position:
#{queue_position}.
referral_issued Referral created WA +
Email
Hi {patient_name}, Dr. {doctor_name} has
referred you to {doctor_name} at
{clinic_name}. Your appointment details:
{appointment_time}. See you soon!

###### Opt-out Handling

- SMS: patient replies 'STOP' → provider webhook updates opt_in_messaging = false for SMS
    channel.
- WhatsApp: opt-out link in every message → webhook → opt_in_messaging = false for
    WhatsApp channel.
- Email: unsubscribe link in footer → API call → opt_in_messaging = false for email channel.
- Opt-out is per-channel: patient can opt out of WhatsApp but keep email enabled.
- All opt-out events logged with timestamp, channel, and trigger source.
- Staff can re-enable consent if patient requests reinstatement (recorded in audit log).


## 12. Privacy & Messaging Consent

#### 12.1 Consent Capture Flow

```
Mandatory Consent Rules
```
1. Staff-side registration: consent checkbox shown (default: checked). Staff must explicitly uncheck to
deny.
2. Patient portal signup: explicit 'I agree to receive appointment and queue notifications' checkbox.
3. Self-check-in QR: consent checkbox shown before token creation.
4. Consent record: { patient_id, channel, consented: bool, timestamp, source, ip_address }
5. Consent version tracked: if privacy policy version changes, re-consent prompt triggered.

#### 12.2 Data Privacy Requirements

- PHI encrypted at rest: AES-256 for PostgreSQL column-level encryption on sensitive fields;
    S3 server-side encryption for attachments.
- Data in transit: TLS 1.3 minimum on all endpoints; HSTS with 1-year max-age; no HTTP
    fallback.
- RBAC enforced: patients cannot access other patients' data; doctors see only their own
    patients; private notes hidden from patients and staff.
- Audit logs for all clinical notes, prescription, and billing mutations — immutable, timestamped,
    user-attributed.
- Data retention: visit records ≥ 7 years; billing records ≥ 5 years; audit logs ≥ 5 years
    (configurable per jurisdiction).
- Soft delete only: no hard deletion of patient, visit, or billing records. Deleted = flagged, not
    removed.
- DPDP Act 2023 (India) compliance: explicit consent, purpose limitation, data minimization,
    right to correction.
- On-premise deployment option available for privacy-sensitive clinics.

#### 12.3 Third-Party Data Sharing Rules

- WhatsApp/SMS providers: minimum PHI shared (phone + rendered message text only; no
    visit details).
- Data Processing Agreements (DPA) required with all providers before enabling integrations.
- Payment gateways: PCI-DSS compliant only; raw card data never stored on ClinicOS
    servers.
- Analytics data: only aggregate, anonymized metrics used for platform performance reporting.
- No data sold or shared with advertisers under any circumstances.


## 13. Success Metrics (KPIs)

#### 13.1 Operational KPIs

```
Metric How Measured Baseline 3 - Month Target 6 - Month Target
```
```
Avg Patient Wait Time token_issued →
called_at P50
```
```
45 – 90 min < 40 min < 25 min
```
```
Patient Check-in Time Phone entry → token
issued
```
```
5 – 8 min
(paper)
```
```
< 45 sec < 20 sec
```
```
WhatsApp Delivery
Rate
```
```
Delivered / Sent
(provider)
```
```
0% > 95% > 98%
```
```
Returning Patient
Recognition
```
```
Auto-matched / total
patients
```
```
Manual ≥ 90% ≥ 95%
```
```
Bill Generation Time Bill open → PDF sent 10 – 15 min < 2 min < 60 sec
```
```
Digital Receipt
Adoption
```
```
Receipts opened /
sent
```
```
0% ≥ 60% ≥ 80%
```
```
No-Show Rate Booked but not
attended
```
```
~25% (est) < 15% < 10%
```
```
Avg Consultation
Duration
```
```
consult_start →
consult_end P50
```
```
Unknown Measured ETA accuracy ±
40%
Emergency Response
Time
```
```
Emergency tap → at
position 1
```
```
Manual,
varies
```
```
< 1 sec < 1 sec
```
```
Token Throughput Tokens served /
doctor / day
```
```
Baseline + 15% + 30%
```
#### 13.2 Business & System KPIs

```
Metric How Measured Target
```
```
System Uptime Monitoring + uptime logs P50 99.5% monthly (SaaS)
```
```
API Response Time (lookup) P95 on POST /patients/lookup < 500 ms
Queue Operation Latency P95 on queue PATCH calls < 200 ms
```
```
WA Message Delivery Time Trigger event → provider sent < 10 seconds
Page Load Time (mobile) Lighthouse on 4G simulation < 2 seconds
```
```
Clinic Retention Rate % renewing subscription after 3
months
```
```
> 80%
```
```
NPS Score Patient feedback forms ≥ 50 (6 months)
```

```
Metric How Measured Target
```
```
Data Audit Coverage % critical transactions with audit
entry
```
```
100%
```
```
Patient Complaint Rate Complaints per 100 patients < 3%
```
```
Search Latency Global search P50 < 300 ms
```
## 14. Technology Stack

```
Layer Technology Why
```
```
Frontend React + Next.js (App Router) +
Tailwind CSS
```
```
SSR for SEO on public pages; App Router for
streaming; PWA-ready; Tailwind for rapid
consistent UI
State Zustand + React Query
(TanStack)
```
```
Lightweight global state; TanStack Query for
server state, caching, and background refetch
Real-time Socket.IO (client + server) Bi-directional WebSocket for live queue updates
broadcast to all connected clients
Backend Node.js + Express (or Fastify) Async I/O; massive ecosystem; Fastify ~2×
faster than Express for high-throughput routes
```
```
Primary DB PostgreSQL 15+ ACID transactions; JSONB for prescriptions;
tsvector for full-text search; row-level security
```
```
Cache / Queue
State
```
```
Redis 7 Hot queue cache; pub/sub for Socket.IO
adapter; session store; rate-limit counters; slot
reservation TTL
Message
Broker
```
```
RabbitMQ (or AWS SQS) Durable async message dispatch; exponential
retry; dead-letter queue for failed sends
File Storage AWS S3 / Cloudflare R2 PDF receipts, prescriptions, lab reports; pre-
signed URLs for secure time-limited access
PDF
Generation
```
```
Puppeteer (headless Chrome) Pixel-perfect branded PDFs from HTML/CSS
templates; supports complex layouts
WhatsApp Meta WhatsApp Business API
(Twilio sandbox for dev)
```
```
Primary notification channel; Twilio sandbox for
MVP testing; switch to Meta direct for production
```
```
SMS MSG91 (India, DLT-registered) /
Twilio
```
```
India-optimised DLT compliance; MSG91 for
domestic; Twilio for international
```
```
Email SendGrid / AWS SES Transactional email with delivery tracking and
bounce/complaint webhooks
```
```
Auth JWT (access 15min) + Refresh
Token (30d) + OTP
```
```
Stateless API auth; refresh rotation; Redis token
blocklist for instant revocation
```

```
Layer Technology Why
```
```
Search Postgres tsvector (MVP) →
Elasticsearch (v2)
```
```
tsvector sufficient for MVP; Elasticsearch when
full-text search across 1M+ visits
Monitoring Sentry + BetterStack (Uptime +
Logs)
```
```
Error tracking with source maps; uptime
monitoring; structured log aggregation
CI/CD GitHub Actions → Railway
(MVP) → AWS ECS (prod)
```
```
Fast deploy pipeline; Railway for speed-to-
market; ECS for production autoscaling
Security Cloudflare WAF + TLS 1.3 +
CORS strict
```
```
DDoS mitigation; bot protection; strict CORS for
API; CSP headers on frontend
```
## 15. Acceptance Tests (Sample Suite)

Format: Given / When / Then. Full E2E test suite to be authored in Playwright; unit/integration tests
in Jest/Vitest. These 8 cases cover all P0 critical paths.

```
AT- 01 — Returning Patient Lookup
Given: Patient with phone +919876543210 exists in DB with 3 previous visits.
When: Receptionist enters '+919876543210' in lookup field.
Then: Patient name, last visit date, and visit count appear within 2 seconds. Receptionist can add to
queue with one additional click. Active token check prevents duplicate token.
```
```
AT- 02 — New Patient Registration
Given: No patient with phone +919000000001 exists.
When: Receptionist enters phone → clicks Create (name left blank).
Then: Patient created; token auto-assigned (#1 for the day); WhatsApp message queued within 15
seconds. New patient has opt_in_messaging = true and consent_timestamp set.
```
```
AT- 03 — Queue Notifications Chain
Given: 3 patients in queue (positions 1, 2, 3). New patient P4 joins.
When: Token issued to P4 (position 4).
Then: P4 gets 'token_issued' WhatsApp within 15s. When P1 is served: P3 now at position 2. System
fires 'two_before' to P3. When P2 served: P3 gets 'your_turn' message. All ETAs update within 1s of
each queue change.
```
```
AT- 04 — Emergency Push-to-Front
Given: 4 patients in queue. PE arrives as emergency.
When: Staff taps Emergency and confirms.
```

```
Then: PE inserted at position 1 within 1 second. All 4 patients receive ETA update WhatsApp. Doctor
receives in-app Socket.IO alert. Action logged in audit trail with user and timestamp.
```
```
AT- 05 — Doctor Visit Save & History
Given: Doctor has patient P1 open (complaint: fever, 2 previous visits visible in history panel).
When: Doctor saves complaint='high fever 3 days', diagnosis='viral fever', prescription=[{Paracetamol
500mg TDS 5 days}].
Then: Visit created with audit metadata (user_id, timestamp). On P1's next visit, doctor sees 'last visit:
[date]' with correct medicine in history panel.
```
```
AT- 06 — Billing & Receipt Delivery
Given: Completed visit for patient P1.
When: Staff creates bill [Consultation ₹300, Medicine ₹150] with 18% GST.
Then: Total = ₹531. PDF generated within 5 seconds. WhatsApp and email with receipt link sent
within 15 seconds. P1 can download PDF from patient portal at any time without login barrier.
```
```
AT- 07 — Queue Pause & Resume
Given: 5 patients waiting; P4 at position 4.
When: Doctor taps 'Pause Queue'.
Then: All ETAs frozen within 2 seconds. Next 3 patients receive 'queue_paused' WhatsApp. When
doctor taps Resume: ETAs recalculate from current time. Patients receive 'queue_resumed'. P4's
ETA reflects correct remaining wait.
```
```
AT- 08 — QR Self-Check-in (F21)
Given: Clinic QR code displayed at reception.
When: Patient scans QR on phone → enters registered phone +919123456789 → taps Confirm.
Then: Token issued within 30 seconds. Patient receives 'token_issued' WhatsApp. Staff dashboard
shows token with 'Self-checked-in' badge. Duplicate check: second scan by same patient within 1
hour shows existing active token, not a new one.
```
## 16. Developer Handoff Checklist

All items must be signed off by the product owner and lead engineer before development sprints
begin. Items marked with ★ are blocking for Phase 1 start.

#### 16.1 Design & Architecture ★


```
□ ★ Finalized ER diagram with all entities, FKs, indexes, and RLS policies
□ ★ DB migration scripts (initial schema + seed data for dev/staging/test environments)
□ ★ OpenAPI 3.1 spec for every endpoint (request + response schemas + error codes)
□ ★ UI wireframes: Reception Dashboard, Queue Console, Doctor Consultation, Patient
Lookup modal, Admin Stats
□ Design system: color tokens, typography scale, spacing scale, component library (buttons,
cards, modals, token badges, status indicators)
□ Mobile-responsive breakpoints defined for all critical screens (320px, 768px, 1280px)
□ Accessibility review: WCAG 2.1 AA checklist for all wireframes
```
#### 16.2 Messaging & Integrations ★

```
□ ★ WhatsApp Business API provider selected (Meta direct / Twilio / 360dialog); account
created; number registered and verified
□ ★ SMS provider selected (MSG91 for India); DLT entity registration initiated (4–6 week
process)
□ ★ All 12 message templates finalized with sample variable values and tested via sandbox
□ ★ Opt-in consent flow reviewed by legal; consent language approved
□ SMTP / Email provider configured; domain SPF/DKIM/DMARC records set and verified
□ Opt-out keyword handling tested end-to-end (SMS STOP, WhatsApp opt-out, email
unsubscribe)
□ Payment gateway credentials (Razorpay test keys) shared with dev team
```
#### 16.3 Security & Compliance ★

```
□ ★ RBAC matrix documented: role × resource × action (read/write/delete/admin); reviewed by
lead engineer
□ ★ JWT secret rotation policy defined; refresh token expiry and revocation strategy confirmed
□ ★ TLS 1.3 enforced; HSTS configured; CSP headers defined
□ PHI encryption at rest confirmed: column-level for DB, server-side for S3
□ Audit log schema reviewed; all trigger points (critical actions) listed and annotated in code
□ DPDP Act 2023 compliance checklist reviewed with legal counsel
□ 2FA enforcement policy defined: which roles require 2FA from day 1
□ Penetration test scope defined; scheduled for post-MVP (before public launch)
```
#### 16.4 Testing

```
□ ★ Acceptance test cases AT-01 to AT-08 reviewed and assigned to QA engineer
□ E2E test framework selected (Playwright); critical flows scripted before sprint 1
□ Unit test coverage target: ≥ 80% for core business logic (aggregation, queue ETA, billing
calc)
```

```
□ Integration test suite for all API endpoints (happy path + error cases)
□ Load test plan: 200 concurrent users, 1,000 tokens/day per clinic; run before Phase 1 go-live
□ WhatsApp delivery test: sandbox verified + real number test send completed
□ Security test: RBAC boundary tests run for all role combinations
```
#### 16.5 Infrastructure & Operations

```
□ ★ Hosting environment provisioned (Railway for MVP staging; AWS ECS for production)
□ ★ CI/CD pipeline: test → lint → build → deploy on merge to main; rollback tested
□ DB backup policy configured: daily full + hourly incremental; restore drill performed
□ Disaster recovery runbook documented: RTO < 4h; RPO < 1h targets set
□ Monitoring alerts: error rate > 1%, queue depth > 500, response time > 1s, uptime drop
□ Environment variables documented; secrets stored in vault (AWS Secrets Manager /
Doppler); not in .env files
□ Log retention policy: 90 days hot, 2 years cold (AWS CloudWatch / BetterStack)
```
#### 16.6 Business Readiness

```
□ ★ Clinic-specific rules confirmed: token prefix, numbering style, GST rate, working hours, avg
consult time
□ ★ Branding assets received: clinic logo (SVG/PNG ≥ 512px), primary/secondary colours
(HEX), clinic name for PDF letterhead
□ Staff training guide drafted (max 2 pages; covers top 5 workflows with screenshots)
□ Doctor onboarding guide: consultation form walkthrough, prescription builder, history view
□ Go-live checklist defined; rollback plan documented and rehearsed
□ Support contact and escalation path defined for post-launch issues
```
## 17. Phased Roadmap

#### Phase 0 — Discovery & Design (Weeks 1–2)

```
Deliverables
Finalize ER diagram, DB schema, and migration scripts
Wireframes for: Reception Dashboard, Queue Console, Doctor Consultation, Patient Lookup, Admin
Stats
OpenAPI spec drafted for all P0 endpoints
Message templates copy approved; WhatsApp provider account live
RBAC matrix reviewed; 2FA policy decided
DLT SMS registration initiated (India)
Dev environment + CI/CD pipeline live
```

```
Design system and component library setup in Storybook
```
#### Phase 1 — MVP (Weeks 3–10)

```
F1–F7 + Security Foundations
✓ Patient phone lookup + quick registration (< 20s for returning, < 30s new)
✓ Real-time token queue with WebSocket updates
✓ WhatsApp/SMS automation: token_issued, two_before, your_turn
✓ Doctor consultation screen with structured notes + history panel
✓ One-tap controls: pause, resume, emergency, send-to-lab, bring-back
✓ Digital billing with PDF receipt + WhatsApp/Email delivery
✓ Admin stats dashboard: patients today, revenue, avg wait, top complaints
✓ Role-based auth: 2FA for staff/doctor/admin; OTP for patients
✓ RBAC enforced on all routes
✓ Audit logs for all P0 critical actions
✓ F24 (2FA) + F25 (Rate Limiting) as security prerequisites
```
#### Phase 2 — Stabilise (Weeks 11–16)

```
F8–F13 + F20–F23
+ Online appointment booking with slot management and calendar sync (F8)
+ Messaging template editor + consent management UI (F9)
+ Global search and patient directory (F10)
+ Reports and financial exports: weekly/monthly CSV + PDF (F12)
+ Email notifications parallel to WhatsApp
+ Multi-doctor queues within one clinic
+ Doctor availability calendar and schedule management
+ Prescription template library — Quick-Rx (F20)
+ Patient QR self-check-in (F21)
+ Staff shift handover notes (F22)
+ Patient referral tracking (F23)
+ SMS fallback on WhatsApp delivery failure
+ Patient portal: queue tracker, history, bills, profile
```
#### Phase 3 — Growth (Weeks 17+)

- Online payments: Razorpay/Stripe for booking and bill settlement (F14)
- Lab orders and results integration — HL7 FHIR for connected labs (F15)
- Multi-clinic / franchise admin panel (F16)


- Mobile PWA with offline token creation and sync (F17)
- Kiosk mode: TV display board + self-service token printing (F18)
- Telemedicine / video consult integration (F19)
- AI-powered prescription suggestions and drug interaction alerts
- Advanced analytics: cohort retention, peak-hour heatmaps, doctor performance benchmarks
- ABHA / National Health ID integration
- Multi-language support: Hindi, Gujarati, regional

## 18. Non-Functional Requirements

#### 18.1 Performance

- Patient phone lookup: P95 latency < 500ms for DB up to 100,000 patients per clinic
- Queue operations (create/update): P95 < 200ms; Socket.IO broadcast ≤ 1 second end-to-end
- Page load (mobile, 4G): < 2 seconds; Lighthouse performance score ≥ 75
- WhatsApp send: trigger event → provider delivery ≤ 10 seconds P50
- PDF generation: ≤ 5 seconds for standard bill (< 20 line items)

#### 18.2 Availability & Reliability

- System uptime: 99.5% monthly (SaaS); configurable downtime window for on-premise
- Message broker: durable queue with 3-retry exponential back-off; DLQ for investigation
- Graceful degradation: analytics and report generation can be unavailable without affecting
    core queue + billing
- DB backup: daily full + hourly incremental; restore drill monthly; RTO < 4h; RPO < 1h

#### 18.3 Security

- TLS 1.3 on all endpoints; HSTS max-age ≥ 1 year; no HTTP fallback
- PHI encrypted at rest: AES-256 column-level on DB; S3 server-side encryption
- RBAC: least-privilege; patients cannot access other patients' data
- 2FA enforced for all staff/doctor/admin accounts from day 1
- Rate limiting: Redis sliding window; IP-based for unauthenticated, user-based for
    authenticated
- All P0 mutations logged in immutable audit trail; no hard deletion of records

#### 18.4 Scalability

- Multi-tenant: each clinic is an isolated tenant; clinic_id scoping at ORM and DB level
- Stateless API servers behind load balancer; horizontal scaling supported


- Redis pub/sub for real-time queue broadcasts (no long-polling)
- Target: 200 concurrent staff/doctor sessions per clinic; 10,000 tokens/day

#### 18.5 Accessibility & Localisation

- WCAG 2.1 AA compliance for all patient-facing and public pages
- Mobile-first: staff on tablet (768px), patients on phone (375px+)
- Low-bandwidth optimisation: lazy loading, skeleton screens, API payloads < 50KB
- Multi-language: English (MVP); Hindi + Gujarati (Phase 3) via i18next

## 19. Risks & Mitigations

```
Risk Severity Likelihood Mitigation
WhatsApp API approval
delays (Meta)
```
```
High High Use Twilio WhatsApp sandbox for MVP; apply
Meta direct API in parallel; SMS as primary MVP
fallback
```
```
Doctor resistance to
digital workflow
```
```
Med Med Single-screen UI; max 3 taps for any core action;
tablet-optimised; 5-minute onboarding video
```
```
Real-time queue sync
failures
```
```
High Low Socket.IO reconnect logic; optimistic UI + server
reconciliation; offline fallback queue view (F17)
```
```
Patient PHI data breach Critical Low AES-256 encryption, RBAC, 2FA, regular pen
tests, DPA with all providers, incident response
plan
```
```
DLT SMS registration
delay (India)
```
```
Med High Start DLT registration 6 weeks before launch;
WhatsApp as primary reduces SMS dependency
for MVP
Queue ETA inaccuracy
causes frustration
```
```
Med High Doctor sets custom avg consult time; system
auto-calibrates from rolling 10-visit average
Message cost overrun Med Med Daily spend cap alerts in admin; SMS-only mode
option for cost-sensitive clinics
Prescription template
abuse (shared
templates with wrong
dosages)
```
```
High Low Shared templates require admin approval before
activation; doctor must review and confirm each
use
```
## 20. Next Steps


#### Immediate Actions (Before Phase 1 Development)

```
# Action Owner Priority Deadline
```
```
1 Approve P0 MVP feature list and
confirm explicit out-of-scope items
```
Product Owner (^) ★ **Critical** Week 1
**2** Select WhatsApp provider: Meta direct /
Twilio / 360dialog — create account
Tech Lead (^) ★ **Critical** Week 1
**3** Start DLT SMS registration with
MSG91 (India — 4 – 6 week process)
Tech Lead (^) ★ **Critical** Week 1
**4** Confirm clinic-specific business rules:
token prefix, GST rate, working hours,
avg consult time
Clinic Owner (^) ★ **Critical** Week 1
**5** Share branding assets: logo SVG,
primary colour HEX, clinic name for
PDF templates
Clinic Owner (^) ★ **Critical** Week 1
**6** Confirm SaaS subscription model vs
one-time licence; define pricing tiers if
SaaS
Business Owner High Week 1
**7** Approve 2FA enforcement policy: which
roles require 2FA from day 1
Product Owner High Week 1
**8** Select payment gateway (Razorpay /
Stripe) and obtain test API credentials
Tech Lead Medium Week 2
**9** Decide multi-language requirement at
launch (Hindi / Gujarati / English-only)
Product Owner Medium Week 2
**10** Prioritize Phase 1 wireframes:
Reception Dashboard, Queue Console,
Doctor Consult, QR Check-in
Designer High Week 2
**11** Provision dev + staging environments;
configure GitHub Actions CI/CD
pipeline
DevOps High Week 2
**12** Schedule kick-off sprint planning with
dev team; assign AT-01 to AT-08 to QA
engineer
PM / Tech Lead High Week 2

#### Recommended First Sprint (Week 3–4)

```
Sprint 1 Scope
```
1. Patient phone lookup API + staff registration UI (Reception Dashboard core)
2. Queue creation + basic token display (now / next / waiting) with Socket.IO broadcast
3. WhatsApp integration via Twilio sandbox — token_issued template working end-to-end
4. Doctor dashboard: current patient card + queue snapshot
5. Role-based JWT auth (email+password for staff/doctor; OTP for patient)


6. 2FA OTP flow for staff login
7. Basic audit log for patient creation and token creation
8. Staging environment deployed; CI/CD pipeline green


