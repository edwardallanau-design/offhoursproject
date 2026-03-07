# Offhours App

A multi-portal property maintenance platform connecting **unit owners**, **contractors**, **strata managers**, and **admins** through a shared job lifecycle — from request to billing.

---

## Architecture Overview

```
offhours-app/
├── client/          # React + TypeScript + Vite (frontend)
├── server/          # Express + TypeScript (API backend)
├── supabase-schema.sql
└── package.json     # npm workspaces root
```

**Stack:**
- **Frontend:** React, TypeScript, Vite, Supabase JS client
- **Backend:** Express, TypeScript, ts-node-dev
- **Auth & DB:** Supabase (PostgreSQL + Auth)
- **Notifications:** Twilio (SMS), SendGrid (Email), Web Push (VAPID)

---

## User Roles & Portals

| Role | Portal | Capabilities |
|---|---|---|
| `admin` | Admin dashboard | Create jobs, assign contractors, bill strata, cancel, proxy accept/reject |
| `contractor` | Contractor portal | Accept/reject assigned jobs, start work, submit completion + invoice |
| `unit_owner` | Unit owner portal | Submit maintenance requests, view status timeline |
| `strata_manager` | Strata portal | View job overview, billing history |

---

## Job State Machine

```
new → assigned → accepted → in_progress → completed → billed
        ↓            ↓
     rejected ──→ assigned  (admin can reassign)

Any state (except billed) → cancelled
```

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Twilio](https://twilio.com) account (SMS)
- A [SendGrid](https://sendgrid.com) account (Email)

---

## Setup Guide

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd offhours-app
npm install
```

### 2. Configure environment variables

Copy both example files and fill in your credentials:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**

```env
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Supabase — use the service role key (never expose this to the client)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio (SMS notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1XXXXXXXXXX

# SendGrid (email notifications)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourcompany.com

# VAPID keys for Web Push — generated in step 5 below
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@yourcompany.com
```

**`client/.env`**

```env
# Supabase — use the anon/public key here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3001/api
```

> Where to find your Supabase keys: Project Settings > API
> - `SUPABASE_SERVICE_ROLE_KEY` = "service_role" secret key (server only)
> - `VITE_SUPABASE_ANON_KEY` = "anon" public key (client)

### 3. Run the database schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Paste the entire contents of `supabase-schema.sql` and run it

This creates all tables: `jobs`, `contractors`, `strata_managers`, `job_assignments`, `job_completions`, `job_photos`, `billing_records`, and `push_subscriptions`.

### 4. Create your admin user

1. Go to **Supabase Dashboard > Authentication > Users**
2. Click **Add user** and create the admin account
3. Then run this SQL in the SQL Editor (replace the email):

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
WHERE email = 'your@email.com';
```

To create contractor or strata manager accounts, use the admin portal in the running app — it provisions them via the Supabase Admin API and sets their roles automatically.

### 5. Generate VAPID keys (Web Push — one time only)

```bash
cd server && npx web-push generate-vapid-keys
```

Copy the output into `server/.env`:
```env
VAPID_PUBLIC_KEY=<public key output>
VAPID_PRIVATE_KEY=<private key output>
```

### 6. Start the development servers

Open two terminals:

```bash
# Terminal 1 — API server (http://localhost:3001)
cd server && npm run dev

# Terminal 2 — React client (http://localhost:5173)
cd client && npm run dev
```

Or from the workspace root:

```bash
npm run dev:server   # Terminal 1
npm run dev:client   # Terminal 2
```

Open [http://localhost:5173](http://localhost:5173) and log in with your admin account.

---

## API Reference

All endpoints require a valid Supabase JWT in the `Authorization: Bearer <token>` header.

### Health

| Method | Path | Auth |
|---|---|---|
| GET | `/api/health` | None |

### Auth

| Method | Path | Roles |
|---|---|---|
| GET | `/api/auth/session` | Any |

### Jobs

| Method | Path | Roles |
|---|---|---|
| GET | `/api/jobs` | Any |
| POST | `/api/jobs` | admin, unit_owner |
| GET | `/api/jobs/:id` | Any |
| GET | `/api/jobs/:id/photos` | Any |
| POST | `/api/jobs/:id/assign` | admin |
| PATCH | `/api/jobs/:id/respond` | contractor |
| PATCH | `/api/jobs/:id/mark-accepted` | admin |
| PATCH | `/api/jobs/:id/mark-rejected` | admin |
| PATCH | `/api/jobs/:id/start` | admin, contractor |
| POST | `/api/jobs/:id/complete` | admin, contractor |
| POST | `/api/jobs/:id/bill` | admin |
| PATCH | `/api/jobs/:id/cancel` | admin |

### Contractors

| Method | Path | Roles |
|---|---|---|
| GET | `/api/contractors` | admin |
| POST | `/api/contractors` | admin |
| PATCH | `/api/contractors/:id` | admin |

### Strata Managers

| Method | Path | Roles |
|---|---|---|
| GET | `/api/strata-managers` | admin |
| POST | `/api/strata-managers` | admin |
| PATCH | `/api/strata-managers/:id` | admin |

### Notifications

| Method | Path | Roles |
|---|---|---|
| GET | `/api/notifications/vapid-public-key` | Any |
| POST | `/api/notifications/push-subscription` | Any |
| DELETE | `/api/notifications/push-subscription` | Any |

---

## Production Build

```bash
# Build both packages
npm run build:server
npm run build:client

# The server serves the built client automatically in production
NODE_ENV=production node server/dist/index.js
```

In production, set `CLIENT_ORIGIN` to your deployed domain and update `VITE_API_BASE_URL` in the client build environment.

---

## Troubleshooting

**"Invalid JWT" errors**
- Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct in `server/.env`
- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match in `client/.env`

**Role-based redirects not working after login**
- The user's `raw_app_meta_data.role` must be set in Supabase. Re-run the UPDATE statement from step 4.

**Web Push not delivering**
- Ensure VAPID keys are set in `server/.env` and the server was restarted after adding them
- HTTPS is required for push notifications in production (localhost works for development)

**SMS/Email notifications silently failing**
- The server uses `Promise.allSettled` for notifications — a failed SMS won't block the job update. Check server logs for the specific error from Twilio/SendGrid.

**TypeScript errors**
```bash
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```
Both should report 0 errors on a clean checkout.
