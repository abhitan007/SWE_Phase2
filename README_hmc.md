# HMC Module — Feature Scope & Implementation Status

This document outlines everything the Hostel Management Committee (HMC) module must cover — what is already built, what is incomplete, and what still needs to be added.

---

## 1. Overview

The HMC module handles all hostel-related operations for students and the hostel administration at IIT Guwahati. It consists of six sub-features:

| Sub-Feature | Student Portal | Admin / HMC Staff Portal |
|---|---|---|
| Hostel Leave | Apply, track | View all, Approve/Reject |
| Complaints | File, track | View all, Update status |
| No Dues Clearance | View status | View all, Clear items |
| Hostel Transfer | Apply, track | View all, Approve/Reject |
| Asset Management | — | Full CRUD + maintenance log |
| HMC Member Management | — | Add / Remove / View members |

---

## 2. What Is Already Built

### 2.1 Backend Models

All six Mongoose models exist and are complete.

**LeaveRequest** (`backend/models/LeaveRequest.js`)
- Fields: `student` (ref User), `type` (Medical / Personal / Academic), `startDate`, `endDate`, `reason`, `status` (Pending / Approved / Rejected), `reviewedBy`, `reviewedAt`

**Complaint** (`backend/models/Complaint.js`)
- Fields: `student` (ref User), `category` (Maintenance / Electrical / Network / Cleanliness / Other), `description`, `status` (Open / In Progress / Resolved), `resolvedBy`, `resolvedAt`

**NoDues** (`backend/models/NoDues.js`)
- Fields: `student` (unique ref User), `items[]` (each has `department`, `status` Pending/Cleared, `clearedAt`, `amount`, `remark`), `isFullyCleared`
- Auto-created on first access with 5 default departments: Central Library, Hostel Office, Sports Complex, Department Lab, Finance Section

**HostelTransfer** (`backend/models/HostelTransfer.js`)
- Fields: `student` (ref User), `currentHostel`, `currentRoom`, `preferredHostel`, `preferredRoom`, `reason`, `status` (Pending / Approved / Rejected), `reviewedBy`, `reviewedAt`, `reviewRemarks`

**Asset** (`backend/models/Asset.js`)
- Fields: `name`, `type` (Furniture / Appliance / Infrastructure / Electronics / Other), `location` (hostel, block, room), `condition` (Good / Fair / Damaged / Under Repair / Disposed), `acquisitionDate`, `lastMaintenanceDate`, `maintenanceLog[]` (date, description, performedBy, cost), `linkedComplaint` (ref Complaint), `addedBy`

**HMCMember** (`backend/models/HMCMember.js`)
- Fields: `user` (unique ref User), `role` (Warden / Assistant Warden / HMC Secretary / HMC Member), `hostel`, `appointedAt`, `termEnd`, `isActive`

---

### 2.2 Backend Routes & Controllers

All routes are registered in `app.js` and all controllers are implemented.

| Route Prefix | File | Operations |
|---|---|---|
| `/api/leaves` | `routes/leaves.js` | POST / (student), GET /my (student), GET / (admin/hostel_staff), PATCH /:id/review |
| `/api/complaints` | `routes/complaints.js` | POST / (student), GET /my (student), GET / (admin/hostel_staff), PATCH /:id/status |
| `/api/nodues` | `routes/noDues.js` | GET /my (student), GET / (admin), PATCH /:studentId/items/:itemId/clear (admin) |
| `/api/hostel/transfers` | `routes/hostelTransfers.js` | POST / (student), GET /my (student), GET / (admin/hostel_staff), PATCH /:id/review |
| `/api/hostel/assets` | `routes/assets.js` | POST, GET, PUT /:id, PATCH /:id/maintenance, DELETE /:id (admin/hostel_staff) |
| `/api/admin/hmc/members` | `routes/hmcMembers.js` | GET /, POST /, PUT /:id, DELETE /:id (admin only) |

> **Note:** The `hostel_staff` role is referenced in route authorization but needs to be confirmed as a valid enum value in the User model. If not present, use `admin` for all HMC staff operations for now.

---

### 2.3 Frontend API Service

All API call wrappers exist in `frontend/src/services/apiService.js`:

```
Leaves:      createLeaveRequest, getMyLeaves, getAllLeaves, reviewLeave
Complaints:  createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus
NoDues:      getMyNoDues, getAllNoDues, clearNoDuesItem
Transfers:   createTransferRequest, getMyTransfers, getAllTransfers, reviewTransfer
Assets:      createAsset, getAllAssets, updateAsset, logMaintenance, deleteAsset
HMC Members: getHMCMembers, addHMCMember, removeHMCMember
```

---

### 2.4 Student Frontend Pages (Exist But Minimal)

| Page | File | Status |
|---|---|---|
| Leave Application | `pages/student/LeaveApplication.jsx` | Functional — apply + view list with status badges |
| Complaints | `pages/student/Complaints.jsx` | Functional — file + view list with status |
| No Dues | `pages/student/NoDues.jsx` | Functional — read-only view of clearance items |
| Hostel Transfer | **MISSING** | No frontend page exists |

---

## 3. What Is Missing / Incomplete

### 3.1 Student Side — Missing Pages

**Hostel Transfer Request Page** — does not exist at all.
- Student must be able to view their transfer requests and apply for a new one
- Form fields: current hostel, current room, preferred hostel, preferred room, reason
- Show status (Pending / Approved / Rejected) and admin remarks once reviewed

---

### 3.2 Student Side — Improvements Needed

**Leave Application (`LeaveApplication.jsx`)**
- Table shows Type, Start, End, Status — reason is not visible at all
- No way to cancel a Pending request (needs `DELETE /api/leaves/:id` backend endpoint too)

**Complaints (`Complaints.jsx`)**
- No photo/image attachment support (useful for Maintenance/Electrical issues)
- No visible complaint reference ID or tracking number for the student

**No Dues (`NoDues.jsx`)**
- Read-only for students — this is correct, no change needed
- Hardcoded 5 departments — admin should eventually be able to configure this list

---

### 3.3 Admin / HMC Staff Side — All Pages Missing

None of the admin-facing HMC pages exist in the frontend. The following need to be built:

**A. Leave Management Page** (admin / hostel_staff)
- Table of all leave requests: student name, roll number, type, dates, reason, status
- Filter by status and leave type
- Approve / Reject button per row → calls `PATCH /api/leaves/:id/review`

**B. Complaints Management Page** (admin / hostel_staff)
- Table of all complaints: student name, category, description, status, filed date
- Filter by status (Open / In Progress / Resolved) and category
- Status update button per row → calls `PATCH /api/complaints/:id/status`
- Optional: link complaint to an asset record

**C. No Dues Management Page** (admin only)
- View all students and their no-dues clearance status (fully cleared / pending)
- Expand per student to see individual department items
- "Clear" button per item with amount and remark input → calls `PATCH /api/nodues/:studentId/items/:itemId/clear`

**D. Hostel Transfer Management Page** (admin / hostel_staff)
- Table of all transfer requests: student, current hostel/room, preferred hostel/room, reason, status
- Approve / Reject with remarks → calls `PATCH /api/hostel/transfers/:id/review`

**E. Asset Management Page** (admin / hostel_staff)
- View all assets with filters by hostel and condition
- Add new asset form
- Edit asset details (condition, location, etc.)
- Log maintenance: date, description, person responsible, cost, updated condition
- Delete / mark as Disposed

**F. HMC Member Management Page** (admin only)
- Table of active HMC members: name, role, hostel, term end
- Add member: pick from existing users, assign role + hostel + term end date
- Remove member (soft delete — sets `isActive: false`)

---

## 4. Backend Gaps

### 4.1 Missing Endpoints

| Endpoint | Purpose |
|---|---|
| `DELETE /api/leaves/:id` | Student cancels a Pending leave request |
| `DELETE /api/complaints/:id` | Student withdraws a complaint (optional) |

### 4.2 Broken: NoDues clearItem Does Not Save Amount/Remark

The `clearItem` controller sets `status: 'Cleared'` and `clearedAt` but never reads `amount` or `remark` from `req.body`, even though the schema supports them. The endpoint needs to accept and persist these fields:

```js
// noDuesController.js — clearItem fix needed
item.status = 'Cleared';
item.clearedAt = new Date();
if (req.body.amount) item.amount = req.body.amount;
if (req.body.remark) item.remark = req.body.remark;
```

### 4.3 User Role Check

`hostel_staff` appears in route authorization but may not be a valid enum in `User.js`. Check the User model's `role` field. If not there, either add it or simplify all HMC admin routes to just use `admin` role for now.

---

## 5. Navigation / Routing Gaps (App.jsx)

**Student nav** includes Hostel Leave, Complaints, No Dues — but is **missing Hostel Transfer**.

**Admin nav** has no HMC section at all. Need to add entries for:
- Leave Management
- Complaints Management
- No Dues Management
- Hostel Transfer Management
- Asset Management
- HMC Members

These can be flat entries in the admin nav or grouped under an "HMC" section.

---

## 6. Implementation Order (Recommended)

1. **Fix backend gaps first**
   - Update `clearItem` to accept `amount` and `remark`
   - Add `DELETE /api/leaves/:id`
   - Confirm `hostel_staff` role in User model

2. **Student: Hostel Transfer page** — mirrors the Leave Application pattern exactly

3. **Admin: Leave + Transfer Management** — same review flow, build together

4. **Admin: Complaints Management** — slightly more complex (3-stage status pipeline)

5. **Admin: No Dues Management** — needs per-student expandable rows with clear action

6. **Admin: Asset Management** — most complex (maintenance log, condition lifecycle)

7. **Admin: HMC Member Management** — simple CRUD, save for last

8. **Polish**: wire up all routes in App.jsx, add nav items, update student nav for Hostel Transfer

---

## 7. Data Flow Summary

### Hostel Leave
```
Student applies → POST /api/leaves → LeaveRequest { status: Pending }
Admin reviews   → PATCH /api/leaves/:id/review { status: Approved | Rejected }
Student sees    → GET /api/leaves/my
```

### Complaints
```
Student files   → POST /api/complaints → Complaint { status: Open }
Admin updates   → PATCH /api/complaints/:id/status { status: In Progress | Resolved }
                  Resolved sets resolvedBy + resolvedAt
```

### No Dues
```
Student views   → GET /api/nodues/my
                  Auto-creates record with 5 default departments all Pending if new
Admin clears    → PATCH /api/nodues/:studentId/items/:itemId/clear { amount, remark }
                  Sets Cleared + clearedAt; recalculates isFullyCleared
```

### Hostel Transfer
```
Student applies → POST /api/hostel/transfers → HostelTransfer { status: Pending }
Admin reviews   → PATCH /api/hostel/transfers/:id/review { status, reviewRemarks }
Student sees    → GET /api/hostel/transfers/my (includes reviewRemarks)
```

### Assets
```
Admin adds      → POST /api/hostel/assets
Admin edits     → PUT /api/hostel/assets/:id
Admin maintains → PATCH /api/hostel/assets/:id/maintenance { date, description, performedBy, cost, newCondition }
Admin removes   → DELETE /api/hostel/assets/:id
```

---

## 8. Files to Create / Modify

### Backend (fixes)
- `backend/controllers/noDuesController.js` — update `clearItem` to save `amount` and `remark`
- `backend/routes/leaves.js` — add `DELETE /:id` for student cancellation

### Frontend (new pages)
- `frontend/src/pages/student/HostelTransfer.jsx`
- `frontend/src/pages/admin/hmc/LeaveManagement.jsx`
- `frontend/src/pages/admin/hmc/ComplaintsManagement.jsx`
- `frontend/src/pages/admin/hmc/NoDuesManagement.jsx`
- `frontend/src/pages/admin/hmc/TransferManagement.jsx`
- `frontend/src/pages/admin/hmc/AssetManagement.jsx`
- `frontend/src/pages/admin/hmc/HMCMembers.jsx`

### Frontend (updates)
- `frontend/src/App.jsx` — add student Hostel Transfer route + all 6 admin HMC routes
- `frontend/src/services/apiService.js` — add `cancelLeave(id)` → `DELETE /api/leaves/:id`
