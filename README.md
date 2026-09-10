# TeleMed Frontend

A React + Vite + TypeScript frontend for **TeleMed**, a telemedicine platform connecting
patients and doctors. Fully wired to the [TeleMed backend](../backend) (Node.js/Express/MongoDB) -
no mock or placeholder data remains; everything you see is backed by real API calls.

## 1. Setup

```bash
npm install
cp .env.example .env   # then edit if your backend runs somewhere other than localhost:5000
npm run dev
```

Edit `.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Point these at your deployed backend's URL in production (e.g. your Render service).

The backend must be running (and `CLIENT_URL` on the backend must include this app's origin)
for anything to work - see the backend's own README for setup.

## 2. What's wired up

- **Auth**: real register/login/logout against `/api/auth/*`, session persisted via JWT and
  restored on page refresh (`src/context/AuthContext.tsx`).
- **Patient dashboard**: real family members, appointments, subscription, and an AI health
  assistant that calls the backend's `/api/ai-chat` endpoint.
- **Doctor dashboard**: real profile/status management, consultation requests (live via
  Socket.io), today's schedule, patient list derived from real appointments, earnings, and a
  monthly consultations chart computed from real appointment data.
- **Book Appointment**: real doctor list and booking flow (`POST /api/appointments`).
- **Medical Records**: real consultations, prescriptions, vitals, and lab results, scoped
  correctly for both the patient's own view and a doctor's view of a patient.
- **Video calls**: real WebRTC peer connections signaled through the backend's Socket.io
  events (`video:join`, `video:offer`, `video:answer`, `video:ice-candidate`, ...).
- **Chat consultations**: real messages persisted via `/api/chat/*` and delivered live over
  Socket.io.
- **Subscriptions & payments**: plans priced in NGN; upgrading to Basic/Premium redirects to
  a real Paystack checkout, with `/subscription/callback` verifying the transaction on return.
  The Free plan can only cover your own profile - adding family members is disabled until you
  upgrade.
- **Doctor approval**: new doctor accounts are `pending` until an admin approves them - they
  see a banner on their dashboard and can't go online or accept patients until then.
- **End-of-consultation recommendations**: when a doctor ends a video call, they're asked to
  send a private recommendation (with urgency) to the admin team before the appointment is
  marked complete.
- **Admin dashboard**: a third portal (`/admin-dashboard`, log in via the "Admin" tab on
  `/login`) showing platform-wide stats, pending doctor approvals, doctor recommendations,
  all appointments, users, and payments. Admin accounts aren't self-registrable - see the
  backend README for how to create one (the seed script creates `admin@telemed.test`).

## 3. Building for production

```bash
npm run build
```

Outputs to `dist/`. Deploy it to any static host (Vercel, Netlify, etc.) with `VITE_API_URL`
and `VITE_SOCKET_URL` set as environment variables at build time, pointing at your deployed
backend.
