
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());
// Avatar images are stored as Base64 data URLs in MongoDB — no static file serving needed.

const { apiLimiter, heavyLimiter } = require('./middleware/rateLimiter');

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// Baseline rate limit for the whole API. Per-route stricter limits live in the
// route files themselves.
app.use('/api', apiLimiter);

// Module 1 — IAM
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const transcriptRequestRoutes = require('./routes/transcriptRequest');
const analyticsRoutes = require('./routes/analytics');
const documentsRoutes = require('./routes/documents');
const certificatesRoutes = require('./routes/certificates');

// Module 5 — Curriculum & Institutional Administration
const departmentRoutes = require('./routes/departments');
const programRoutes = require('./routes/programs');
const courseRoutes = require('./routes/courses');
const studentsAdminRoutes = require('./routes/studentsAdmin');
const facultyAdminRoutes = require('./routes/facultyAdmin');
const enrollmentAdminRoutes = require('./routes/enrollmentAdmin');
const systemConfigRoutes = require('./routes/systemConfig');

// Module 2 — Student Academic Portal
const enrollmentRoutes = require('./routes/enrollment');
const academicRecordRoutes = require('./routes/academicRecord');
const studentDashboardRoutes = require('./routes/studentDashboard');

// Module 3 — Course Operations & Assessment Engine
const facultyCourseRoutes = require('./routes/facultyCourses');
const studentAssignmentRoutes = require('./routes/studentAssignments');
const studentAttendanceRoutes = require('./routes/studentAttendance');

// Module 4 — Communication & Resource Hub
const announcementRoutes = require('./routes/announcements');
const resourceRoutes = require('./routes/resources');
const messageRoutes = require('./routes/messages');
const postRoutes = require('./routes/posts');

// Module 6 — Hostel & Welfare Services
const leaveRoutes = require('./routes/leaves');
const complaintRoutes = require('./routes/complaints');
const noDuesRoutes = require('./routes/noDues');
const hostelTransferRoutes = require('./routes/hostelTransfers');
const hmcMemberRoutes = require('./routes/hmcMembers');
const assetRoutes = require('./routes/assets');

// Module 4 extra — Feedback
const feedbackRoutes = require('./routes/feedback');

// ─── Module 1 mounts ───
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', transcriptRequestRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/certificates', certificatesRoutes);

// ─── Module 5 mounts ───
app.use('/api/admin/departments', departmentRoutes);
app.use('/api/admin/programs', programRoutes);
app.use('/api/admin/students', studentsAdminRoutes);
app.use('/api/admin/faculty', facultyAdminRoutes);
app.use('/api/admin/enrollments', enrollmentAdminRoutes);
app.use('/api/admin/system-config', systemConfigRoutes);
app.use('/api/admin/hmc/members', hmcMemberRoutes);
app.use('/api/courses', courseRoutes);

// ─── Module 2 mounts ───
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/student/academic-record', academicRecordRoutes);
app.use('/api/student/dashboard', studentDashboardRoutes);

// ─── Module 3 mounts ───
app.use('/api/faculty/courses', facultyCourseRoutes);
app.use('/api/student/assignments', studentAssignmentRoutes);
app.use('/api/student/attendance', studentAttendanceRoutes);

// ─── Module 4 mounts ───
app.use('/api/announcements', announcementRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/feedback', feedbackRoutes);

// ─── Module 6 mounts ───
app.use('/api/leaves', leaveRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/nodues', noDuesRoutes);
app.use('/api/hostel/transfers', hostelTransferRoutes);
app.use('/api/hostel/assets', assetRoutes);

module.exports = app;
