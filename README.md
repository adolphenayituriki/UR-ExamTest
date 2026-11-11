# UR ExamLab — Digital Examination & Practice System

ExamLab is a full-stack digital examination and exam-readiness platform for University of
Rwanda (UR) students. It provides server-timed practice tests, verified past papers, AI-assisted
Socratic hints, automated grading, performance diagnostics, digital-literacy lessons, and signed
verifiable credentials — with a staff area for cohort monitoring.

- **Backend:** Node.js + Express 4 (ESM), MongoDB via Mongoose, JWT auth, Swagger/OpenAPI 3
- **Frontend:** React 18 + Vite 5 SPA/PWA (installable, offline-ready), axios, React Router 6
- **AI:** OpenAI-compatible LLM (optional) with a deterministic offline heuristics fallback

---

## Table of contents

1. [Quick start](#quick-start)
2. [Repository layout](#repository-layout)
3. [Environment variables](#environment-variables)
4. [System workflow](#system-workflow)
5. [API reference](#api-reference)
6. [Security & authorization](#security--authorization)
7. [Demo accounts](#demo-accounts)
8. [Verification & testing](#verification--testing)
9. [Production checklist](#production-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Quick start

Prerequisites: **Node.js 18+**, **MongoDB 6/7** (local or Docker), npm.

```bash
# 1. Install dependencies for the root, server and client
npm run install:all

# 2. Start MongoDB (skip if you already run one on 127.0.0.1:27017)
docker compose up -d

# 3. Create local env files
cp .env.example .env
#    then set a strong JWT_SECRET, e.g.:
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"

# 4. Seed demo data (wipes and recreates the platform collections)
npm run seed

# 5. Run API (5000) + web app (5173) together
npm run dev
```

Open the app at **http://localhost:5173**, the API at **http://localhost:5000/api**, and
interactive API docs at **http://localhost:5000/api/docs**.

### Production-style run

```bash
npm run build     # installs deps + builds the client into client/dist
npm start         # Express serves the API and the built SPA on PORT (default 5000)
```

---

## Repository layout

```
ur-examTest/
├─ package.json                # root orchestration scripts (dev / build / start / seed)
├─ docker-compose.yml          # MongoDB 7 development container
├─ .env / .env.example         # server + client configuration
├─ server/
│  └─ src/
│     ├─ index.js              # Express app: middleware, routes, SPA serving, error handler
│     ├─ config/
│     │  ├─ env.js             # env loading + security validation
│     │  ├─ db.js              # Mongoose connect/disconnect
│     │  └─ swagger.js         # OpenAPI 3 specification + Swagger UI
│     ├─ middleware/auth.js    # authenticate (JWT) + requireRole (RBAC)
│     ├─ routes/               # auth, courses, exams, ai, analytics, pastPapers,
│     │                        # credentials, literacy, landing, staff
│     ├─ models/               # 11 Mongoose schemas
│     ├─ services/             # session/grading/ai/analytics/credential/otp/email/registry
│     ├─ utils/                # errors, password hashing, math, mutation
│     ├─ data/                 # seed content (students, courses, questions, papers, literacy)
│     └─ seed/seed.js          # database reset + seed
└─ client/
   └─ src/
      ├─ App.jsx               # routes + Protected/PublicOnly guards
      ├─ api/client.js         # axios instance, token injection, 401 handling
      ├─ context/              # AuthContext, ThemeContext
      ├─ hooks/                # useServerTimer (server-synced countdown)
      ├─ components/           # Layout, Toast, QuestionRenderer, StatCard, …
      └─ pages/                # Landing, Dashboard, Course, Exam, Result, Analytics,
                               # PastPapers, Literacy, LiteracyLesson, Credentials,
                               # StaffDashboard
```

---

## Environment variables

Loaded from the repo-root `.env` first, then `server/.env` (root wins). Client variables are
read by Vite at build time.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/ur_exam` | MongoDB connection string |
| `JWT_SECRET` | dev placeholder | JWT signing secret — **required in production** |
| `JWT_EXPIRES_IN` | `8h` | Token lifetime |
| `CREDENTIAL_SECRET` | falls back to `JWT_SECRET` | Separate HMAC key for credential signatures |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allowlist (comma-separated) |
| `NODE_ENV` | `development` | `production` enables strict secret validation |
| `MAX_TAB_SWITCHES` | `3` | Integrity strikes before auto-submit |
| `UR_REGISTRY_API` | unset | Optional institutional registry API endpoint |
| `UR_REGISTRY_KEY` | unset | API key for the registry (`x-api-key`) |
| `AI_BASE_URL` | unset | OpenAI-compatible LLM base URL |
| `AI_API_KEY` | unset | LLM API key |
| `AI_MODEL` | `gpt-4o-mini` | LLM model name |
| `EMAIL_HOST/PORT/USER/PASS/FROM` | unset | SMTP for staff OTP email (console fallback when unset) |
| `VITE_API_URL` | `/api` | Client API base URL |

> In production, startup **fails fast** if `JWT_SECRET` is missing or a known placeholder.

---

## System workflow

### Student journey

```
Landing → Student sign-in (9-digit registration number + password)
        → Dashboard (courses, active session, analytics summary, AI status)
        → Course (choose a practice / mock / final-simulation assessment)
        → Exam (instructions → begin → server-timed answers → submit)
        → Result (score, per-question feedback, topic breakdown)
        → Analytics (weak/strong topics, trend, AI study plan)
        → Past papers (browse verified papers → timed practice session)
        → Digital literacy (lessons + knowledge checks → progress)
        → Credentials (annual eligibility → issue → public verification)
```

Key properties:
- A student can hold **one active exam session** at a time (enforced by a partial unique index).
- The **clock is authoritative on the server**; the client polls `/exams/{id}/clock`.
- Answers and explanations are **withheld until the session is submitted** (`review` mode).

### Staff journey (two-factor)

```
Landing → Staff tab → email + password
        → POST /auth/staff/login        (validates credentials, sends 6-digit OTP)
        → POST /auth/staff/otp/verify   (validates OTP, issues staff JWT)
        → /staff/dashboard              (cohort overview + student roster)
```

Staff accounts (`role: lecturer | admin`) **cannot** use the student login endpoint; the
email + OTP flow is mandatory. Role checks for `/api/staff/*` are evaluated against the live
database record, so a role change takes effect immediately.

### Exam session lifecycle

```
                 POST /exams/start
                        │
                        ▼
              status: in_progress, begun: false
                        │  POST /exams/{id}/begin   (starts server clock)
                        ▼
              status: in_progress, begun: true
                 │          │            │
     PATCH answer│          │integrity   │submit / time expiry / 3 tab strikes
                 ▼          ▼            ▼
             saved       logged      status: submitted | expired  (review = true)
```

- `start` is **idempotent**: it resumes the current in-progress session if it exists.
- Grading runs on submit (also on expiry and integrity auto-submit).
- Objective/numeric/short-answer questions are graded deterministically; essays use the LLM
  rubric when configured, otherwise a local heuristic.

### Grading pipeline

`gradeSession` (server/src/services/sessionService.js) walks the session's question instances:
- **mcq / truefalse** — exact option match
- **numeric** — tolerant comparison with rounding
- **short** — keyword/rubric matching
- **essay** — LLM rubric (or heuristic fallback) → score + feedback

The result is stored on the session (`score`, `maxScore`, `percentage`, `passed`) and exposed
under `session.result` once `review` is true.

### Credentials

1. `GET /credentials/eligibility` evaluates annual criteria (graded attempts, average, pass rate,
   best score, study minutes).
2. `POST /credentials/issue` issues one credential per academic year, signed with
   **HMAC-SHA256** (`CREDENTIAL_SECRET`).
3. `GET /credentials/verify/{code}` is a **public** endpoint for employers/institutions; the
   signature is re-computed and compared.

---

## API reference

Interactive documentation (OpenAPI 3.0.3) is served by the API itself:

- **Swagger UI:** `/api/docs`
- **Raw spec:** `/api/docs.json`

All authenticated endpoints expect `Authorization: Bearer <JWT>`.

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health + database status |
| GET | `/api/landing` | Landing page content |
| GET | `/api/docs`, `/api/docs.json` | API documentation |
| POST | `/api/auth/verify` | Student login (registration number + password) |
| POST | `/api/auth/staff/login` | Staff step 1 — email + password → OTP |
| POST | `/api/auth/staff/otp/verify` | Staff step 2 — OTP → staff JWT |
| GET | `/api/credentials/verify/{code}` | Public credential verification |

### Authenticated (any role)

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/me` | Current profile |
| POST | `/api/auth/logout` | Sign out + invalidate all sessions |
| GET | `/api/courses` | Courses for the student's programme/year |
| GET | `/api/courses/{courseId}` | Course detail, assessments, history, stats |
| POST | `/api/exams/start` | Start or resume a session (`{ assessmentId }`) |
| GET | `/api/exams/active` | Current in-progress session |
| GET | `/api/exams/{sessionId}` | Session detail (sanitized until review) |
| POST | `/api/exams/{sessionId}/begin` | Start the server clock |
| GET | `/api/exams/{sessionId}/clock` | Server time sync |
| PATCH | `/api/exams/{sessionId}/answer` | Save one answer |
| POST | `/api/exams/{sessionId}/submit` | Submit + grade |
| POST | `/api/exams/{sessionId}/integrity` | Report a tab switch / integrity event |
| GET | `/api/ai/status` | AI engine status |
| POST | `/api/ai/hint` | Socratic hint (max 12/session) |
| GET | `/api/analytics/overview` | Performance overview |
| GET | `/api/analytics/diagnostics` | Weak/strong topics + study plan |
| GET | `/api/analytics/courses/{courseId}/history` | Course attempt history |
| GET | `/api/past-papers` | Papers for the student's year/programme |
| GET | `/api/past-papers/{slug}` | Paper detail (**answers withheld**) |
| POST | `/api/past-papers/{slug}/start` | Start a timed practice session |
| GET | `/api/credentials/eligibility` | Annual eligibility |
| POST | `/api/credentials/issue` | Issue a signed credential |
| GET | `/api/credentials/mine` | Issued credentials |
| GET | `/api/literacy` | Published lessons |
| GET | `/api/literacy/progress` | Progress map |
| GET | `/api/literacy/{slug}` | Lesson content |
| POST | `/api/literacy/{slug}/progress` | Upsert completion + quiz score |

### Staff only (role: `lecturer` | `admin`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/staff/overview` | Cohort stats (lecturers: own department/programme; admins: all) |
| GET | `/api/staff/students` | Student roster in the staff member's scope |

---

## Security & authorization

### Authentication

- **JWT (HS256)** bearer tokens, `8h` default lifetime, issued by `/auth/verify` and
  `/auth/staff/otp/verify`.
- **Single active session per account:** every login increments `tokenVersion`; the middleware
  rejects tokens whose version no longer matches. Logging in elsewhere (or logging out) locks
  previous sessions.
- **Password hashing:** scrypt with a per-user salt and `crypto.timingSafeEqual` verification
  (legacy bcrypt hashes are rejected).
- **Staff two-factor:** password → emailed 6-digit OTP (10-minute TTL, max 3 attempts, generated
  with `crypto.randomInt`, compared timing-safe). SMTP optional — codes fall back to the server
  console in development.

### Authorization (RBAC)

| Role | Access |
|---|---|
| `student` | Student endpoints, scoped to their own record and academic year |
| `lecturer` | Student endpoints **plus** `/api/staff/*` scoped to their department/programme |
| `admin` | Student endpoints **plus** institution-wide `/api/staff/*` |

- `authenticate` resolves the account from the database on every request.
- `requireRole(...roles)` checks `req.student.role` from that live record (not the JWT claim).
- Data-level scoping is enforced separately: courses, papers and sessions must belong to the
  student's programme/year, and sessions are always queried by `_id + student`.
- Staff accounts are explicitly rejected by the student login endpoint, preventing 2FA bypass.

### Platform controls

| Control | Implementation |
|---|---|
| Security headers | `helmet()` |
| CORS allowlist | `CLIENT_ORIGIN` (comma-separated); unknown origins → 403 |
| Rate limiting | Global `/api` 800 req/15 min; login/OTP routes 10–20 req/15 min |
| Request size | JSON body capped at 1 MB; answers capped at 6000 chars, 200 per submit |
| Error handling | Centralized handler; no stack traces leaked in production |
| Server-timed exams | Authoritative clock; expired sessions swept every 15 s |
| Exam integrity | Tab-switch detection with configurable strikes → auto-submit |
| Answer hiding | `sanitizeSession` strips answers/explanations until review; past-paper detail also withholds them |
| Credential integrity | HMAC-SHA256 signature (separate `CREDENTIAL_SECRET` supported) |
| Secret validation | Production refuses to start with a missing/placeholder `JWT_SECRET` |
| PWA cache hygiene | Service worker never caches `/api/*` |

### Known production hardening items

- Serve over HTTPS and set `NODE_ENV=production`, a strong `JWT_SECRET` and `CREDENTIAL_SECRET`.
- Restrict MongoDB network exposure and enable authentication (the dev compose file has none).
- Remove/disable the public demo accounts before going live.
- Put the API behind a trusted proxy/WAF and tune rate limits per deployment.
- Add request-id / structured logging and monitoring as needed.

---

## Demo accounts

Seeded by `npm run seed`. Passwords are defined in `server/src/data/students.js`.

| Registration / Email | Password | Role | Notes |
|---|---|---|---|
| `223452022` | `DemoPass1` | student | Year 4 Software Engineering, full history |
| `233462023` | `DemoPass2` | student | Year 3 |
| `243472024` | `DemoPass3` | student | Year 2 |
| `253482025` | `DemoPass4` | student | Year 1 |
| `253492025` | `DemoPass5` | student | Year 1 IT |
| `990012020` | `DemoPass6` | student | Inactive — demonstrates blocked access |
| `jean.uwizeyimana@ur.ac.rw` | `StaffPass1` | lecturer | Staff dashboard (OTP required) |
| `grace.mukeshimana@ur.ac.rw` | `StaffPass2` | lecturer | Staff dashboard (OTP required) |

The staff OTP is printed to the server console when SMTP is not configured:

```
[email] OTP for jean.uwizeyimana@ur.ac.rw: 123456
```

---

## Verification & testing

There is currently no automated test suite in the repository. The API can be exercised through
Swagger UI (`/api/docs`) or a scripted smoke test. A typical verification covers:

1. `GET /api/health` → `status: ok`, database connected.
2. Student login → token; `GET /api/auth/me`, `/courses`, `/analytics/*`.
3. Start → begin → answer → submit an exam; confirm answers are hidden pre-submit and feedback
   appears in `session.result` post-submit.
4. Staff login → OTP → `/api/staff/overview` and `/api/staff/students`.
5. RBAC: a student token on `/api/staff/*` → **403**; no token on a protected route → **401**.
6. Past-paper detail contains **no** `correctAnswer`/`explanation`.
7. Logout invalidates the previously issued token.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `listen EADDRINUSE :::5000` | Another process (or a previous server) holds port 5000. Stop it: `Get-NetTCPConnection -LocalPort 5000` then stop the owning PID. |
| `[env] FATAL: JWT_SECRET ...` | Production startup with a placeholder secret. Set a strong `JWT_SECRET`. |
| API returns `degraded` / DB disconnected | MongoDB is not running or `MONGODB_URI` is wrong. Start MongoDB (`docker compose up -d`). |
| Staff OTP never arrives | SMTP is not configured — read the code from the server console, or set `EMAIL_HOST/PORT/USER/PASS`. |
| CORS error in browser | Add the web origin to `CLIENT_ORIGIN` (comma-separated). |
| `409 ACTIVE_SESSION` when starting an exam | A session is already in progress. Submit it or resume the returned `activeSessionId`. |
| Seed wiped data | `npm run seed` clears platform collections by design. |

---

## License

MIT
