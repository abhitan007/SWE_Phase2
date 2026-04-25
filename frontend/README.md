# Frontend — IITG Affairs Portal

React + Vite + Tailwind CSS UI for the IIT Guwahati IITG Affairs Portal.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

The backend must be running at `http://localhost:5000` (see the project root [README](../README.md)).

## Build

```bash
npm run build        # outputs to dist/
npm run preview      # serve the production build
```

## Layout

```
src/
├── main.jsx                   # React entry
├── App.jsx                    # Router, ProtectedRoute, nav config per role
├── context/
│   └── AuthContext.jsx        # useAuth() — session state
├── components/
│   ├── Sidebar.jsx
│   └── common/                # Card, Table, Button, AppShell
├── pages/
│   ├── Login.jsx              # Role picker + login form
│   ├── ResetPassword.jsx      # 2-step password reset (request → verify token)
│   ├── ChangePassword.jsx
│   ├── ProfileSettings.jsx
│   ├── AdminDashboard.jsx
│   ├── FacultyDashboard.jsx
│   ├── student/               # Student-portal pages
│   ├── faculty/               # Faculty-portal pages
│   ├── admin/                 # Admin-portal pages
│   ├── hmc/                   # HMC-portal pages
│   └── communication/         # Announcements, Messaging, Resources
└── services/
    ├── authService.js         # Axios instance with cookie credentials + 401 redirect
    └── apiService.js          # All non-auth API calls
```

## Conventions

- **Routing**: every protected route is wrapped in `<ProtectedRoute allowedRoles={[...]}>` in `App.jsx`. The component reads `user.role` from `AuthContext` and redirects to the role's dashboard on mismatch.
- **API calls**: never call `axios` directly from a page; use a function exported from `services/apiService.js`. Cookies are sent automatically (`withCredentials: true`).
- **403 vs 401**: the response interceptor only redirects to `/login` on 401. A 403 surfaces to the calling component so pages can show "not authorized for this resource" without bouncing the user.
- **Styling**: Tailwind utility classes only. No CSS modules. Use `Card`, `Table`, and `Button` from `components/common/` instead of bespoke containers.
- **Forms**: validate on submit, show inline error text, never use native `alert()` for success states.
