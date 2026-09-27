# TeleMed Backend

A complete Node.js + Express + MongoDB (Mongoose) backend for the **TeleMed** telemedicine
frontend (patient/doctor portals, appointments, consultation requests, medical records,
subscriptions, doctor earnings, real-time chat, and WebRTC video-call signaling via Socket.io).

## 1. Requirements

- Node.js 18+
- MongoDB 6+ (local install, Docker, or a hosted cluster like MongoDB Atlas)

## 2. Setup

```bash
cd backend
cp .env.example .env   # then edit .env with your own values
npm install
```

Edit `.env`:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/telemed
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ANTHROPIC_API_KEY=   # optional, powers /api/ai-chat with a real model
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # required for paid subscriptions
PAYSTACK_CALLBACK_URL=   # optional, defaults to <first CLIENT_URL>/subscription/callback
```

Get Paystack keys from your [Paystack dashboard](https://dashboard.paystack.com/#/settings/developers)
(test keys work fine for development). Without `PAYSTACK_SECRET_KEY` set, `/api/payments/*`
will return a clear 500 error rather than a confusing crash - everything else works fine.

Start MongoDB (if running locally), then:

```bash
npm run dev     # nodemon, auto-restarts on file changes
# or
npm start       # plain node
```

The API boots at `http://localhost:5000`. Health check: `GET /api/health`.

### Seed sample data (optional but recommended)

```bash
npm run seed
```

This creates 5 sample doctors (4 pre-approved, 1 `pending` for testing the admin approval
flow), 1 sample patient (`john.smith@telemed.test`) with a free subscription and 3 family
member profiles, 1 oversight-only admin (`admin@telemed.test`), and 1 super admin
(`superadmin@telemed.test`) who can additionally approve/reject doctors - all with the
password `password123`. Neither admin role is publicly registrable through
`/api/auth/register`; this seed script (or a direct database insert) is the only way to
create one.

## 3. Connecting the frontend

In the frontend's `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

The frontend's `src/services/api.js` already sends `Authorization: Bearer <token>` from
`localStorage.getItem("token")`, which matches what this backend issues on register/login.

For real-time chat and video-call signaling, connect a Socket.io client:

```js
import { io } from "socket.io-client";
const socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
  auth: { token: localStorage.getItem("token") },
});
```

## 4. Project structure

```
backend/
├── src/
│   ├── config/db.js            MongoDB connection
│   ├── models/                 Mongoose schemas
│   ├── controllers/            Route handlers / business logic
│   ├── routes/                 Express routers
│   ├── middleware/              auth (JWT), error handling, file upload
│   ├── sockets/index.js        Socket.io: chat + WebRTC signaling
│   ├── app.js                  Express app (middleware + route wiring)
│   └── server.js               Entry point (HTTP server + Socket.io + DB connect)
├── seed/seed.js                 Sample data seeder
├── uploads/                     Uploaded files (avatars, lab result files)
└── .env.example
```

## 5. Data model overview

| Model               | Purpose                                                                 |
|---------------------|--------------------------------------------------------------------------|
| `User`               | Patients, doctors and admins in one collection, distinguished by `role`. Doctor-only fields (specialization, license, fee, status, rating, `doctorApprovalStatus`) live on the same document. Doctors start `pending` and can't go online, appear in doctor listings, or accept work until an admin approves them. |
| `FamilyMember`       | A patient's own profile plus any dependents they manage ("Book for family"). |
| `Appointment`        | A scheduled video/chat appointment between a patient (or family member) and a doctor. |
| `ConsultationRequest`| An on-demand "Request Care" request, either broadcast to all available doctors or aimed at one; accepting one creates an `Appointment`. |
| `Consultation`       | A clinical note/record left after a visit (diagnosis, prescription summary, notes). |
| `Prescription`       | A prescribed medication tied to a patient (and optionally a consultation). |
| `VitalSign`          | Blood pressure, heart rate, temperature, weight, height, etc. |
| `LabResult`          | Lab test results, optionally with an uploaded file. |
| `Subscription`       | The patient's plan (free/basic/premium), usage counters, and limits. |
| `Transaction`        | A doctor's earnings entry per completed consultation. |
| `ChatMessage`        | Messages for a conversation (keyed by an `Appointment` or `ConsultationRequest` id). |
| `Notification`       | In-app notifications (new appointment, request accepted, etc). |
| `Payment`             | A Paystack transaction for a subscription upgrade (pending/success/failed). |
| `DoctorReport`        | A private recommendation a doctor sends to admins when ending a consultation. |

## 6. API reference

All endpoints are prefixed with `/api`. Protected routes require
`Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Endpoint            | Access  | Description |
|--------|----------------------|---------|--------------|
| POST   | `/register`          | Public  | Register as a patient. There is no public doctor registration - doctor accounts are created by an admin via `POST /api/admin/doctors` (see the Admin section). |
| POST   | `/doctor-register`   | Public (unlisted) | Doctor self-registration. Not linked anywhere in the frontend - only reachable by a doctor who already has the URL. Body: `firstName`, `lastName`, `email`, `phone?`, `password`, `specialization`, `medicalLicenseNumber`, `yearsOfExperience`, `bio?`. Creates the account with `doctorApprovalStatus: "pending"` (the normal approval queue, unlike admin-created doctors which start pre-approved). Emails the applicant a confirmation and notifies every admin. |
| POST   | `/login`              | Public  | Body: `email`, `password`, optional `role`. |
| GET    | `/me`                 | Private | Current user profile. |
| POST   | `/logout`             | Private | Marks doctor offline, clears cookie. |
| PATCH  | `/update-password`    | Private | Body: `currentPassword`, `newPassword`. |

### Users — `/api/users`
| Method | Endpoint         | Access  | Description |
|--------|-------------------|---------|--------------|
| PATCH  | `/me`             | Private | Update own profile fields. |
| POST   | `/me/avatar`      | Private | Multipart upload, field name `avatar`. |
| GET    | `/:id`            | Private | Fetch any user's public profile. |

### Doctors — `/api/doctors`
| Method | Endpoint          | Access         | Description |
|--------|--------------------|----------------|--------------|
| GET    | `/`                | Private        | List doctors. Query: `specialty`, `status`, `online=true`, `search`. |
| GET    | `/:id`             | Private        | Single doctor profile. |
| PATCH  | `/me/status`       | Private/doctor | Body: `status` (`online\|offline\|busy\|available`). Broadcasts via Socket.io. |
| PATCH  | `/me/profile`      | Private/doctor | Update bio, fee, specialization, experience. |

### Family members ("Patients" tab) — `/api/patients`
| Method | Endpoint | Access          | Description |
|--------|----------|-----------------|--------------|
| GET    | `/`      | Private/patient | List own + dependents. |
| POST   | `/`      | Private/patient | Add a dependent (enforced by subscription's `familyMemberLimit`). |
| PATCH  | `/:id`   | Private/patient | Update a dependent. |
| DELETE | `/:id`   | Private/patient | Remove a dependent (not allowed for "self"). |

### Appointments — `/api/appointments`
| Method | Endpoint       | Access          | Description |
|--------|-----------------|-----------------|--------------|
| POST   | `/`             | Private/patient | Book. Body: `doctorId`, `familyMemberId?`, `date`, `time`, `type`, `appointmentType?`, `reason?`, **`questionnaire`** (required - see below). |
| GET    | `/`             | Private         | List own (patient or doctor view). Query: `status`, `upcoming=true`. |
| GET    | `/:id`          | Private         | Single appointment (participants only). |
| PATCH  | `/:id/status`   | Private         | Body: `status` (`pending\|confirmed\|waiting\|in-progress\|completed\|cancelled`). |
| DELETE | `/:id`          | Private         | Cancel. Body: `reason?`. |

### Consultation requests ("Request Care") — `/api/consultation-requests`
| Method | Endpoint          | Access         | Description |
|--------|--------------------|----------------|--------------|
| POST   | `/`                | Private/patient| Body: `type`, `urgency?`, `message?`, `familyMemberId?`, `doctorId?` (omit to broadcast), **`questionnaire`** (required - see below). |
| GET    | `/`                | Private        | Doctors: pending requests aimed at them or broadcast. Patients: their own. Query: `status`. |
| PATCH  | `/:id/accept`      | Private/doctor | Accepts and creates a confirmed `Appointment` (the questionnaire is copied onto it). |
| PATCH  | `/:id/decline`     | Private/doctor | Declines (only removes from *your* queue if it was a broadcast request). |
| PATCH  | `/:id/cancel`      | Private/patient| Cancel your own pending request. |

**Health questionnaire.** Patients must complete an intake questionnaire before a consultation
request or appointment booking is accepted (`400` otherwise). It is stored on the request /
appointment as `questionnaire`, so doctors receive it in `GET /api/consultation-requests` and
`GET /api/appointments` and can read it before accepting, confirming or starting the call.
Fields: `chiefComplaint` (required, ≤500), `symptomDuration` (required; `less-than-24h`,
`1-3-days`, `4-7-days`, `1-4-weeks`, `over-1-month`), `severity` (required, integer 1-10),
`confirmedAccurate` (required, must be `true`), plus optional `symptoms[]`, `otherSymptoms`,
`medicalConditions[]`, `currentMedications`, `allergies`, `isPregnant`
(`yes|no|not-applicable`), `previousTreatment`, `additionalInfo`. The allowed symptom/condition
values live in `src/utils/questionnaire.js`; anything else is dropped. Admin endpoints exclude
the questionnaire from appointment listings.

### Medical records — `/api/medical-records`
| Method | Endpoint                    | Access         | Description |
|--------|------------------------------|----------------|--------------|
| GET    | `/consultations`             | Private        | Query: `familyMemberId?` (patient) or `patientId` (doctor, required). |
| POST   | `/consultations`             | Private/doctor | Create a visit note. |
| GET    | `/prescriptions`             | Private        | Same scoping as above. |
| POST   | `/prescriptions`             | Private/doctor | Create a prescription. Body may include `sendToAdmin: true` to hand it to the admin team immediately. |
| PATCH  | `/prescriptions/:id/send-to-admin` | Private/doctor | Send (or resend, if rejected) a prescription you wrote to the admin team. Notifies all admins. |
| PATCH  | `/prescriptions/:id/status`  | Private        | Body: `status`. |
| GET    | `/vitals`                    | Private        | Same scoping as above. |
| POST   | `/vitals`                    | Private        | Patients can self-log; doctors can log for a `patientId`. |
| GET    | `/labs`                      | Private        | Same scoping as above. |
| POST   | `/labs`                      | Private/doctor | Multipart, field name `file` (optional), plus `patientId`, `test`, etc. |

### Subscriptions — `/api/subscriptions`
| Method | Endpoint      | Access          | Description |
|--------|----------------|-----------------|--------------|
| GET    | `/plans`       | Public          | Plan catalog (free/basic/premium). |
| GET    | `/current`     | Private/patient | Current subscription + computed limits. |
| POST   | `/subscribe`   | Private/patient | Body: `plan`. |
| POST   | `/cancel`      | Private/patient | Cancels auto-renew. |

### Earnings — `/api/earnings` (doctor only)
| Method | Endpoint          | Description |
|--------|--------------------|--------------|
| GET    | `/summary`         | This month vs last month totals + type breakdown. |
| GET    | `/transactions`    | Raw transaction list. |

### Chat — `/api/chat`
| Method | Endpoint                                             | Description |
|--------|-------------------------------------------------------|--------------|
| GET    | `/:conversationModel/:conversationId/messages`         | `conversationModel` is `Appointment` or `ConsultationRequest`. |
| POST   | `/:conversationModel/:conversationId/messages`         | Body: `text` and/or `attachmentUrl`. Also broadcast over Socket.io. |

### Notifications — `/api/notifications`
| Method | Endpoint       | Description |
|--------|-----------------|--------------|
| GET    | `/`             | Query: `unread=true`. |
| PATCH  | `/:id/read`     | Mark one as read. |
| PATCH  | `/read-all`     | Mark all as read. |

**How notifications get created.** Every meaningful event in the app (a new appointment
request, a doctor being approved, a prescription being fulfilled, and so on) goes through
`src/utils/notify.js`'s `notify()`/`notifyMany()` helpers, which do three things at once:
save an in-app `Notification` row (what these endpoints return), emit a `notification:new`
Socket.io event to the recipient's `user:<id>` room so the bell in the UI updates live, and -
when an email template is passed - send a transactional email via `emailService`. All three
channels are best-effort and independent: a bad SMTP config or a dropped socket connection
never breaks the request that triggered them.

### AI health assistant — `/api/ai-chat`
| Method | Endpoint | Description |
|--------|-----------|--------------|
| POST   | `/`       | Body: `message`, `history?`. Uses `ANTHROPIC_API_KEY` if set, otherwise returns a safe rule-based fallback reply. |

### Payments (Paystack) — `/api/payments`
| Method | Endpoint            | Access          | Description |
|--------|----------------------|-----------------|--------------|
| POST   | `/initialize`        | Private/patient | Body: `plan` (`basic` or `premium`). Starts a Paystack checkout and returns `authorizationUrl` to redirect the browser to. |
| GET    | `/verify/:reference` | Private/patient | Confirms the transaction with Paystack and, if successful, upgrades the patient's subscription. |
| GET    | `/`                  | Private/patient | The logged-in patient's payment history. |
| POST   | `/webhook`           | Public           | Paystack calls this directly on `charge.success`; verified via the `x-paystack-signature` header, not JWT. Acts as the source of truth if the browser never makes it back to the verify step. |

Direct plan changes to `basic`/`premium` via `POST /api/subscriptions/subscribe` are rejected — paid plans must go through this Paystack flow. Switching to `free` still works directly (no payment needed).

### Doctor reports — `/api/doctor-reports`
| Method | Endpoint | Access         | Description |
|--------|-----------|----------------|--------------|
| POST   | `/`       | Private/doctor | Body: `appointmentId`, `recommendation`, `urgency?`. A private note to the admin team, typically submitted when ending a consultation. |
| GET    | `/mine`   | Private/doctor | The logged-in doctor's own submitted reports. |

### Admin — `/api/admin`
| Method | Endpoint                       | Description |
|--------|----------------------------------|--------------|
| GET    | `/overview`                      | Platform-wide stats: user/appointment counts, pending doctor approvals, open reports, plan breakdown, revenue. |
| GET    | `/users?role=&search=`           | List all users. |
| GET    | `/doctors/pending`                | Doctors awaiting approval. |
| GET    | `/doctors?status=`                | All doctors, optionally filtered by approval status. |
| PATCH  | `/doctors/:id/approve`            | Approve a doctor - they can now go online and appear to patients. |
| PATCH  | `/doctors/:id/reject`             | Reject a doctor. Body: `note?`. |
| POST   | `/doctors`                        | Create a doctor account directly. Body: `firstName`, `lastName`, `email`, `phone?`, `password?` (min 8; omit to get a generated `temporaryPassword` back once), `specialization`, `medicalLicenseNumber`, `yearsOfExperience`, `bio?`, `consultationFee?`. The account is created already `approved` (an admin is vetting it up front), so no separate approval step is needed. This is the only way to create a doctor account - there is no public signup for doctors. |
| GET    | `/appointments?status=`           | All appointments platform-wide. |
| GET    | `/doctor-reports?status=`         | All doctor recommendations, optionally filtered by `open`/`reviewed`. |
| PATCH  | `/doctor-reports/:id/review`      | Mark a report as reviewed. |
| GET    | `/payments`                       | All Paystack payments platform-wide. |
| GET    | `/prescriptions?status=`          | Prescriptions doctors sent to admins (`pending`/`fulfilled`/`rejected`). |
| PATCH  | `/prescriptions/:id/status`       | Body: `status` (`fulfilled`\|`rejected`), `note` (required when rejecting). Notifies the patient (and the doctor on rejection). |
| GET    | `/admins`                         | List admin and super admin accounts. |
| POST   | `/admins`                         | Create another admin. Body: `firstName`, `lastName`, `email`, `phone?`, `password?` (min 8; omit to get a generated `temporaryPassword` back once). Always creates role `admin`. |

All `/api/admin/*` routes require `role: "admin"` or `role: "superadmin"`, **except**
approving/rejecting doctors, which requires `role: "superadmin"` specifically - a plain
`admin` can see everything (including the pending-doctors list) but gets a 403 if they try
to approve or reject one. Neither role is publicly registrable (see the Setup section).
Any admin can create further `admin` accounts via `POST /api/admin/admins`, and any admin can
create doctor accounts via `POST /api/admin/doctors` (pre-approved, since the admin vets them
up front). `superadmin` accounts can only be created through the seed script or directly in
the database.

**Bootstrap admin.** On every server start `src/utils/bootstrapAdmins.js` makes sure
`sam.ola13@gmail.com` (plus anything in `INITIAL_ADMIN_EMAILS`) exists as an `admin`. A missing
account is created using `INITIAL_ADMIN_PASSWORD` - or, if that isn't set, a random password
printed once in the server log. An existing non-admin account with that email is promoted; an
existing admin is never touched (its password is not reset).

## 7. Real-time events (Socket.io)

Connect with `auth: { token }` (same JWT as REST calls).

**Chat**
- Client → `chat:join` `{ conversationId }`
- Client → `chat:send` `{ conversationId, conversationModel, text }`
- Server → `chat:message` (new message)
- Server → `chat:typing` `{ userId, isTyping }`

**Video call (WebRTC signaling relay)**
- Client → `video:join` `{ roomId }` — use the `Appointment` id as `roomId`
- Client → `video:offer` / `video:answer` / `video:ice-candidate` `{ roomId, ... }`
- Server relays these to the other peer in the room
- Server → `video:peer-joined`, `video:peer-left`, `video:call-ended`

**Prescriptions**
- Server → `prescription:new` (to `role:admin` / `role:superadmin` rooms when a doctor sends a prescription to the admin team)

**Notifications**
- Server → `notification:new` (to the recipient's `user:<id>` room) whenever `notify()` fires - see the Notifications section above for the full list of triggering events

**Presence**
- Server → `doctor:status-changed` `{ doctorId, status }` (broadcast whenever a doctor's status changes or they disconnect)

## 8. Deploying to Render

This repo is ready to deploy as-is. Render doesn't host MongoDB itself, so pair it with a
free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or any other hosted MongoDB).

### Option A - Blueprint (recommended)

1. Push this `backend` folder to a Git repo (GitHub/GitLab).
2. In the Render dashboard: **New → Blueprint**, point it at the repo. Render will read
   `render.yaml` and provision the web service automatically.
   - If this backend lives inside a monorepo alongside the frontend, uncomment
     `rootDir: backend` in `render.yaml` first.
3. Render will prompt for the env vars marked `sync: false`: `MONGO_URI`, `CLIENT_URL`, and
   optionally `ANTHROPIC_API_KEY`. `JWT_SECRET` is auto-generated for you.
4. Deploy. Render builds with `npm install` and starts with `npm start`, health-checked at
   `/api/health`.

### Option B - Manual web service

1. **New → Web Service**, connect your repo.
2. **Root Directory**: `backend` (only if it's part of a monorepo).
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Health Check Path**: `/api/health`
6. Add environment variables in the dashboard: `NODE_ENV=production`, `MONGO_URI`,
   `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `ANTHROPIC_API_KEY` (optional). Don't set
   `PORT` - Render injects it automatically and the app already reads `process.env.PORT`.

### After it's live

- Confirm `GET https://<your-service>.onrender.com/api/health` returns `200`.
- Point the frontend's `VITE_API_URL` at `https://<your-service>.onrender.com/api`.
- Update `CLIENT_URL` on Render to your deployed frontend's exact origin (no trailing
  slash needed - it's stripped automatically) so CORS allows it. Comma-separate multiple
  origins (e.g. a production domain + a Vercel preview URL) if needed.
- If you connect Socket.io from the frontend, use the service's base URL without `/api`.
- In your [Paystack dashboard](https://dashboard.paystack.com/#/settings/developers), set the
  webhook URL to `https://<your-service>.onrender.com/api/payments/webhook` so payments are
  confirmed reliably even if a patient closes the tab before the redirect-based verification
  step runs.

### Things to know about Render specifically

- **Free plan spins down when idle** and takes a few seconds to wake on the next request -
  the first request after inactivity will be slow. Upgrade to a paid instance to avoid this.
- **Ephemeral filesystem**: anything written to `./uploads` (avatars, lab result files) is
  lost on every deploy/restart on free and standard plans. Either swap the multer storage
  engine in `src/middleware/upload.js` for an object store (S3, Cloudinary, etc.), or attach
  a paid [Persistent Disk](https://render.com/docs/disks) (see the commented `disk:` block
  in `render.yaml`).
- **MongoDB Atlas network access**: allow `0.0.0.0/0` in Atlas's Network Access list (Render's
  outbound IPs are dynamic on free/standard plans), or use Atlas's Render-specific
  integration if available in your Atlas project.
- `app.set("trust proxy", 1)` is already set in `src/app.js` so rate limiting and client IPs
  resolve correctly behind Render's reverse proxy.
- Graceful shutdown (`SIGTERM`/`SIGINT` handling) is already wired up in `src/server.js` so
  in-flight requests finish and the MongoDB connection closes cleanly on every Render deploy.

## 9. Notes & next steps

- Passwords are hashed with bcrypt; auth uses stateless JWTs (7 day expiry by default).
- File uploads (avatars, lab results) are stored on local disk under `uploads/` and served at
  `/uploads/<filename>`. Swap the `multer` disk storage in `src/middleware/upload.js` for an
  S3/Cloudinary storage engine before deploying somewhere with an ephemeral filesystem.
- The `/api/ai-chat` endpoint proxies Anthropic's Messages API only if `ANTHROPIC_API_KEY` is
  set; otherwise it degrades gracefully to a canned response so the frontend still works.
- Transactional email (welcome messages, appointment/consultation updates, prescriptions,
  doctor approvals, password changes, receipts, admin/doctor credentials) is sent via
  `src/services/emailService.js` over SMTP, configured with `EMAIL_HOST`/`EMAIL_PORT`/
  `EMAIL_USER`/`EMAIL_PASSWORD`/`EMAIL_FROM`. Leave `EMAIL_USER`/`EMAIL_PASSWORD` blank to
  disable sending - every call is best-effort and only logs a warning on failure, it never
  blocks or fails the request that triggered it.
- CORS is restricted to `CLIENT_URL` (comma-separate multiple origins if needed).
