# IITG Affairs Portal — IIT Guwahati

A full-stack MERN application that consolidates academic management, hostel & welfare services, document workflows, and institutional administration into a single, role-based portal.

---

## Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local instance or MongoDB Atlas)
- **npm** (ships with Node.js)

### Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Environment Configuration

Create `backend/.env` with:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/college-erp
JWT_SECRET=<a-long-random-string>
NODE_ENV=development
```

### Running the Project

Run the backend and frontend in separate terminals:

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## Tech Stack

| Layer        | Technology                                            |
|--------------|-------------------------------------------------------|
| Frontend     | React 19, React Router, Vite, Tailwind CSS, Axios     |
| Backend      | Node.js, Express 5                                    |
| Database     | MongoDB (Mongoose ODM)                                |
| Auth         | JWT in HTTP-only cookies, bcrypt password hashing     |
| Uploads      | Multer (in-memory), files stored as Base64 in MongoDB |
| PDF          | PDFKit (server-side transcript generation)            |
| Rate Limit   | express-rate-limit                                    |

---

## User Roles

The portal supports four roles, each with its own dashboard and route guards:

| Role          | Primary Use                                                            |
|---------------|------------------------------------------------------------------------|
| `student`     | Course registration, attendance, assignments, hostel services, transcripts |
| `faculty`     | Course operations, attendance marking, assignments, grading, feedback  |
| `admin`       | Full institutional admin — departments, programs, users, oversight     |
| `hmc_member`  | Hostel Management Committee — leaves, complaints, no-dues, transfers   |

Authorization is enforced server-side via JWT + RBAC middleware on every protected route. The frontend mirrors the same checks for navigation but never trusts client-side role data.

---

## Module Overview

The codebase is organized as a modular monolith. Logical modules:

### Module 1 — Identity & Access Management
Login, logout, profile, avatar upload, password change, OTP-based password reset, JWT lifecycle, audit logging. Routes under `/api/auth`, `/api/profile`, `/api/admin/logs`.

### Module 2 — Student Academic Portal
Dashboard aggregation, course catalog browsing, enrollment with atomic capacity reservation, drop-with-deadline-check, academic record (SGPA/CGPA computation). Routes under `/api/student/*`, `/api/courses`, `/api/enrollment`.

### Module 3 — Course Operations & Assessment
Faculty course management, assignment configuration with file-type whitelists, assignment submissions, attendance marking, submission review, grade submission. Routes under `/api/faculty/courses/*`, `/api/student/assignments`, `/api/student/attendance`.

### Module 4 — Communication & Resource Hub
Course-scoped announcements (admin-only system-wide), academic messaging, file-based resource sharing, course feed posts and replies, anonymous course feedback with per-student-per-window dedup. Routes under `/api/announcements`, `/api/messages`, `/api/resources`, `/api/posts`, `/api/feedback`.

### Module 5 — Curriculum & Institutional Administration
Department, program, and course catalog management, course-offering creation with co-instructors, student/faculty CRUD, CSV bulk-import with rollback, system-wide config (drop deadline, min credits). Routes under `/api/admin/*`.

### Module 6 — Hostel & Welfare (HMC) Services
Leave applications, hostel complaints, hostel transfers, no-dues clearance across departments, asset & maintenance log, HMC committee membership. Routes under `/api/leaves`, `/api/complaints`, `/api/hostel/*`, `/api/nodues`, `/api/admin/hmc/members`.

### Module 7 — Documents & Analytics
On-demand transcript PDF generation (PDFKit, IIT Guwahati grade-card format), transcript request workflow, certificate request workflow, course/program/department/student analytics. Routes under `/api/documents`, `/api/student/transcript-request`, `/api/admin/transcript-request`, `/api/certificates`, `/api/analytics`.

---

## Security Posture

Implemented across all routes:

| Control                   | Implementation                                                          |
|---------------------------|-------------------------------------------------------------------------|
| Authentication            | JWT in HTTP-only, SameSite cookies; bcrypt password hashing             |
| Authorization             | `authorizeRoles(...)` middleware, fail-secure defaults                  |
| Mass-assignment guard     | Explicit field whitelisting on all `create` / `update` handlers         |
| Schema validation         | `runValidators: true` on every `findByIdAndUpdate`                      |
| Password policy           | 8–16 chars, upper/lower/digit/special, no username substring            |
| Password reset            | Single-use, hashed, 15-min TTL token (real OTP-style flow)              |
| Capacity race protection  | Atomic `findOneAndUpdate` reservation with rollback on failure          |
| File upload safety        | MIME whitelists per use-case; SVG explicitly rejected (XSS prevention)  |
| Per-assignment file rules | Submissions checked against `allowedFileTypes[]` on the assignment      |
| Feedback integrity        | Enrollment check + per-student-per-window dedup (anonymity preserved)   |
| Rate limiting             | Global `apiLimiter` + tighter `authLimiter` and `heavyLimiter`          |
| Audit logging             | Append-only `AuditLog` collection on all sensitive ops                  |

---

## Project Structure

```
swe/
├── README.md
├── backend/
│   ├── server.js                       # Server entry point
│   ├── app.js                          # Express setup, middleware, route mounts
│   ├── package.json
│   ├── config/
│   │   ├── multerConfig.js             # General-purpose upload (MIME whitelist)
│   │   ├── multerSubmissionConfig.js   # Assignment / faculty attachment uploads
│   │   └── multerAvatarConfig.js       # Avatar upload (image-only)
│   ├── middleware/
│   │   ├── auth.js                     # authenticate + authorizeRoles
│   │   ├── auditLogger.js              # Append-only audit trail
│   │   └── rateLimiter.js              # apiLimiter, authLimiter, heavyLimiter
│   ├── models/                         # Mongoose schemas (User, Course, Enrollment, etc.)
│   ├── controllers/                    # Per-domain business logic
│   ├── routes/                         # One route file per domain, mounted in app.js
│   └── utils/
│       ├── jwt.js                      # JWT sign / verify
│       ├── fileHelper.js               # toDataUrl / sendDataUrl
│       └── passwordPolicy.js           # validatePassword(...)
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    ├── public/                         # Static assets (logos, favicon)
    └── src/
        ├── main.jsx
        ├── App.jsx                     # Router + ProtectedRoute + nav configs
        ├── context/
        │   └── AuthContext.jsx         # useAuth() — login / logout / refreshUser
        ├── components/
        │   ├── Sidebar.jsx
        │   └── common/                 # Card, Table, Button, AppShell
        ├── pages/
        │   ├── Login.jsx
        │   ├── ResetPassword.jsx       # 2-step flow (request → verify token)
        │   ├── ChangePassword.jsx
        │   ├── ProfileSettings.jsx
        │   ├── AdminDashboard.jsx
        │   ├── FacultyDashboard.jsx
        │   ├── student/                # Student-portal pages
        │   ├── faculty/                # Faculty-portal pages
        │   ├── admin/                  # Admin-portal pages
        │   ├── hmc/                    # HMC-portal pages
        │   └── communication/          # Announcements, Messaging, Resources
        └── services/
            ├── authService.js          # axios instance + auth API
            └── apiService.js           # All other API calls
```

---

## API Surface (high-level)

| Prefix                        | Module                                |
|-------------------------------|---------------------------------------|
| `/api/auth`                   | Login, logout, password reset/change  |
| `/api/profile`                | Profile read/update                   |
| `/api/admin/*`                | Admin CRUD on departments / programs / courses / students / faculty / system config / HMC members / transcript requests |
| `/api/admin/logs`             | Audit log queries                     |
| `/api/courses`                | Course catalog + offerings            |
| `/api/enrollment`             | Student enrollment + drop             |
| `/api/student/*`              | Dashboard, academic record, attendance, assignments, transcript-request |
| `/api/faculty/courses/*`      | Faculty course ops, grading, attendance, assignments, submissions       |
| `/api/announcements`          | System / course announcements         |
| `/api/messages`               | Academic messaging                    |
| `/api/resources`              | Course resource files                 |
| `/api/posts`                  | Course feed posts + replies           |
| `/api/feedback`               | Feedback windows + submission + results |
| `/api/leaves`                 | Hostel leave applications             |
| `/api/complaints`             | Hostel complaints                     |
| `/api/hostel/transfers`       | Hostel transfer requests              |
| `/api/hostel/assets`          | Asset & maintenance log               |
| `/api/nodues`                 | No-dues clearance                     |
| `/api/documents`              | Transcript generation + verify        |
| `/api/certificates`           | Certificate request workflow          |
| `/api/analytics`              | Course/program/department/student metrics |
| `/api/health`                 | Health probe                          |

Full route definitions live in `backend/routes/`.

---

## Authoring Notes

- **Roles**: 4 roles only — `student`, `faculty`, `admin`, `hmc_member`. (No separate `hostel_staff`.)
- **Files in MongoDB**: All uploads (avatars, complaint photos, resources, transcripts, submissions, attachments) are stored as Base64 data URLs inside Mongo documents. No disk persistence, no static file serving.
- **Frontend↔Backend**: Backend is mounted at `/api/*`. The frontend dev server (`http://localhost:5173`) proxies via the configured base URL in `services/authService.js` (`baseURL: '/api'`); CORS allows the same origin in `app.js`.
- **`hostel_staff` was removed**: The role was redundant with `hmc_member` and was dropped from the User enum, route guards, and the Login screen.
