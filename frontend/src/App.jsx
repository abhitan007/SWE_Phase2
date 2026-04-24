import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AppShell from './layouts/AppShell';

// Admin Pages (Module 5 & 7)
import DepartmentManagement from './pages/admin/DepartmentManagement';
import ProgramManagement from './pages/admin/ProgramManagement';
import CourseCatalog from './pages/admin/CourseCatalog';
import StudentDirectory from './pages/admin/StudentDirectory';
import FacultyDirectory from './pages/admin/FacultyDirectory';
import EnrollmentDashboard from './pages/admin/EnrollmentDashboard';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';

// Student Pages (Module 2, 6, 7)
import StudentDashboard from './pages/student/StudentDashboard';
import CourseRegistration from './pages/student/CourseRegistration';
import AcademicHistory from './pages/student/AcademicHistory';
import AssignmentUpload from './pages/student/AssignmentUpload';
import StudentAttendance from './pages/student/StudentAttendance';
import LeaveApplication from './pages/student/LeaveApplication';
import Complaints from './pages/student/Complaints';
import NoDues from './pages/student/NoDues';
import DocumentRequests from './pages/student/DocumentRequests';

// Faculty Pages (Module 3)
import AssignmentConfiguration from './pages/faculty/AssignmentConfiguration';
import SubmissionReview from './pages/faculty/SubmissionReview';
import AttendanceTracking from './pages/faculty/AttendanceTracking';
import GradeSubmission from './pages/faculty/GradeSubmission';

import ProfileSettings from './pages/ProfileSettings';

// Communication Pages (Module 4)
import AnnouncementsFeed from './pages/communication/AnnouncementsFeed';
import ResourceLibrary from './pages/communication/ResourceLibrary';
import MessagingInbox from './pages/communication/MessagingInbox';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}-dashboard`} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to={`/${user.role}-dashboard`} replace /> : children;
}

const NAV_ITEMS = {
  admin: [
    { title: 'Dashboard', path: '/admin-dashboard', end: true },
    { title: 'Departments', path: '/admin/departments' },
    { title: 'Programs', path: '/admin/programs' },
    { title: 'Courses', path: '/admin/courses' },
    { title: 'Students', path: '/admin/students' },
    { title: 'Faculty', path: '/admin/faculty' },
    { title: 'Enrollments', path: '/admin/enrollments' },
    { title: 'Announcements', path: '/admin/announcements' },
    { title: 'Analytics', path: '/admin/analytics' },
    { title: 'Messages', path: '/admin/messages' },
    { title: 'Profile', path: '/admin/profile' },
  ],
  student: [
    { title: 'Dashboard', path: '/student-dashboard', end: true },
    { title: 'Registration', path: '/student/registration' },
    { title: 'Academic History', path: '/student/history' },
    { title: 'Attendance', path: '/student/attendance' },
    { title: 'Assignments', path: '/student/assignments' },
    { title: 'Resources', path: '/student/resources' },
    { title: 'Messages', path: '/student/messages' },
    { title: 'Hostel Leave', path: '/student/leave' },
    { title: 'Complaints', path: '/student/complaints' },
    { title: 'No Dues', path: '/student/nodues' },
    { title: 'Documents', path: '/student/documents' },
    { title: 'Profile', path: '/student/profile' },
  ],
  faculty: [
    { title: 'Dashboard', path: '/faculty-dashboard', end: true },
    { title: 'Attendance', path: '/faculty/attendance' },
    { title: 'Assignments', path: '/faculty/assignments' },
    { title: 'Submissions', path: '/faculty/submissions' },
    { title: 'Grading', path: '/faculty/grading' },
    { title: 'Messages', path: '/faculty/messages' },
    { title: 'Profile', path: '/faculty/profile' },
  ],
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppShell role="Admin" navItems={NAV_ITEMS.admin}>
                <AdminDashboard />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><DepartmentManagement /></AppShell></ProtectedRoute>} />
          <Route path="/admin/programs" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><ProgramManagement /></AppShell></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><CourseCatalog /></AppShell></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><StudentDirectory /></AppShell></ProtectedRoute>} />
          <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><FacultyDirectory /></AppShell></ProtectedRoute>} />
          <Route path="/admin/enrollments" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><EnrollmentDashboard /></AppShell></ProtectedRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><AnnouncementsFeed /></AppShell></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><AnalyticsDashboard /></AppShell></ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><MessagingInbox /></AppShell></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><AppShell role="Admin" navItems={NAV_ITEMS.admin}><ProfileSettings /></AppShell></ProtectedRoute>} />
          
          {/* Student Routes */}
          <Route path="/student-dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppShell role="Student" navItems={NAV_ITEMS.student}>
                <StudentDashboard />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="/student/registration" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><CourseRegistration /></AppShell></ProtectedRoute>} />
          <Route path="/student/history" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><AcademicHistory /></AppShell></ProtectedRoute>} />
          <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><AssignmentUpload /></AppShell></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><StudentAttendance /></AppShell></ProtectedRoute>} />
          <Route path="/student/resources" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><ResourceLibrary /></AppShell></ProtectedRoute>} />
          <Route path="/student/messages" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><MessagingInbox /></AppShell></ProtectedRoute>} />
          <Route path="/student/leave" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><LeaveApplication /></AppShell></ProtectedRoute>} />
          <Route path="/student/complaints" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><Complaints /></AppShell></ProtectedRoute>} />
          <Route path="/student/nodues" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><NoDues /></AppShell></ProtectedRoute>} />
          <Route path="/student/documents" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><DocumentRequests /></AppShell></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><AppShell role="Student" navItems={NAV_ITEMS.student}><ProfileSettings /></AppShell></ProtectedRoute>} />
          
          {/* Faculty Routes */}
          <Route path="/faculty-dashboard" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <AppShell role="Faculty" navItems={NAV_ITEMS.faculty}>
                <FacultyDashboard />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="/faculty/assignments" element={<ProtectedRoute allowedRoles={['faculty']}><AppShell role="Faculty" navItems={NAV_ITEMS.faculty}><AssignmentConfiguration /></AppShell></ProtectedRoute>} />
          <Route path="/faculty/submissions" element={<ProtectedRoute allowedRoles={['faculty']}><AppShell role="Faculty" navItems={NAV_ITEMS.faculty}><SubmissionReview /></AppShell></ProtectedRoute>} />
          <Route path="/faculty/attendance" element={<ProtectedRoute allowedRoles={['faculty']}><AppShell role="Faculty" navItems={NAV_ITEMS.faculty}><AttendanceTracking /></AppShell></ProtectedRoute>} />
          <Route path="/faculty/grading" element={<ProtectedRoute allowedRoles={['faculty']}><AppShell role="Faculty" navItems={NAV_ITEMS.faculty}><GradeSubmission /></AppShell></ProtectedRoute>} />
          <Route path="/faculty/messages" element={<ProtectedRoute allowedRoles={['faculty']}><AppShell role="Faculty" navItems={NAV_ITEMS.faculty}><MessagingInbox /></AppShell></ProtectedRoute>} />
          <Route path="/faculty/profile" element={<ProtectedRoute allowedRoles={['faculty']}><AppShell role="Faculty" navItems={NAV_ITEMS.faculty}><ProfileSettings /></AppShell></ProtectedRoute>} />

          {/* Catch all to redirect based on role */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
