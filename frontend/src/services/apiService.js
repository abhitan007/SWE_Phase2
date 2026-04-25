import api from './authService';

// ─── Module 3: Faculty Course Operations ───
export const getMyCourseOfferings = () => api.get('/faculty/courses/my');
export const createCourseOffering = (courseId, data) => api.post(`/courses/${courseId}/offerings`, data);
export const createAssignment = (courseOfferingId, data, file) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') fd.append(k, v); });
  if (file) fd.append('attachment', file);
  return api.post(`/faculty/courses/${courseOfferingId}/assignments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const getAssignments = (courseOfferingId) => api.get(`/faculty/courses/${courseOfferingId}/assignments`);
export const updateAssignment = (assignmentId, data, file) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') fd.append(k, v); });
  if (file) fd.append('attachment', file);
  return api.put(`/faculty/courses/assignments/${assignmentId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const downloadAssignmentAttachment = (assignmentId) => api.get(`/faculty/courses/assignments/${assignmentId}/attachment`, { responseType: 'blob' });
export const deleteAssignment = (assignmentId) => api.delete(`/faculty/courses/assignments/${assignmentId}`);
export const publishAssignment = (assignmentId) => api.patch(`/faculty/courses/assignments/${assignmentId}/publish`);
export const getSubmissions = (assignmentId) => api.get(`/faculty/courses/assignments/${assignmentId}/submissions`);
export const gradeSubmission = (submissionId, data) => api.patch(`/faculty/courses/submissions/${submissionId}/grade`, data);
export const markAttendance = (courseOfferingId, data) => api.post(`/faculty/courses/${courseOfferingId}/attendance`, data);
export const getAttendanceSessions = (courseOfferingId) => api.get(`/faculty/courses/${courseOfferingId}/attendance`);
export const getRoster = (courseOfferingId) => api.get(`/faculty/courses/${courseOfferingId}/roster`);
export const submitGrades = (courseOfferingId, grades) => api.post(`/faculty/courses/${courseOfferingId}/grades`, { grades });

// ─── Module 3: Student Assignments ───
export const getMyAssignments = () => api.get('/student/assignments');
export const submitAssignment = (assignmentId, formData) => api.post(`/student/assignments/${assignmentId}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMySubmissions = () => api.get('/student/assignments/submissions');
export const getMyAttendance = () => api.get('/student/attendance');

// ─── Module 4: Communication ───
export const getAnnouncements = () => api.get('/announcements');
export const createAnnouncement = (data) => api.post('/announcements', data);
export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}`);

export const uploadResource = (courseOfferingId, formData) => api.post(`/resources/${courseOfferingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getResources = (courseOfferingId) => api.get(`/resources/${courseOfferingId}`);
export const downloadResource = (id) => api.get(`/resources/download/${id}`, { responseType: 'blob' });
export const deleteResource = (id) => api.delete(`/resources/${id}`);

export const getInbox = () => api.get('/messages/inbox');
export const getSentMessages = () => api.get('/messages/sent');
export const sendMessage = (data) => api.post('/messages', data);
export const getThread = (threadId) => api.get(`/messages/thread/${threadId}`);
export const markMessageRead = (id) => api.patch(`/messages/${id}/read`);
export const deleteMessage = (id) => api.delete(`/messages/${id}`);

// ─── Module 6: Hostel & Welfare ───
export const createLeaveRequest = (data) => api.post('/leaves', data);
export const getMyLeaves = () => api.get('/leaves/my');
export const getAllLeaves = () => api.get('/leaves');
export const reviewLeave = (id, status) => api.patch(`/leaves/${id}/review`, { status });
export const cancelLeave = (id) => api.delete(`/leaves/${id}`);

export const createComplaint = (data) => {
  if (data instanceof FormData) {
    return api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return api.post('/complaints', data);
};
export const getMyComplaints = () => api.get('/complaints/my');
export const getAllComplaints = () => api.get('/complaints');
export const updateComplaintStatus = (id, status) => api.patch(`/complaints/${id}/status`, { status });

export const getMyNoDues = () => api.get('/nodues/my');
export const getAllNoDues = () => api.get('/nodues');
export const clearNoDuesItem = (studentId, itemId, data) => api.patch(`/nodues/${studentId}/items/${itemId}/clear`, data);
export const initializeNoDues = (studentId) => api.post(`/nodues/${studentId}/initialize`);

// ─── Module 5 extras ───
export const getSystemConfig = () => api.get('/admin/system-config');
export const updateSystemConfig = (data) => api.put('/admin/system-config', data);

// ─── Profile ───
export const updateProfile = (data) => api.put('/profile', data);
export const updateAvatar = (file) => {
  const fd = new FormData();
  fd.append('avatar', file);
  return api.patch('/auth/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// ─── Existing Module 2 ───
export const getStudentDashboard = () => api.get('/student/dashboard');
export const getAcademicRecord = () => api.get('/student/academic-record');
export const getAvailableCourses = () => api.get('/courses/available');
export const enrollCourse = (courseOfferingId) => api.post('/enrollment', { courseOfferingId });
export const dropCourse = (courseOfferingId) => api.delete(`/enrollment/${courseOfferingId}`);

// ─── Module 7: Documents / Transcript Requests ───
export const getMyTranscriptRequests = () => api.get('/student/transcript-request');
export const createTranscriptRequest = (data) => api.post('/student/transcript-request', data);
export const getAllTranscriptRequests = () => api.get('/admin/transcript-request');
export const updateTranscriptRequestStatus = (id, action, remarks) => api.patch(`/admin/transcript-request/${id}`, { action, remarks });
export const generateTranscript = (studentId) => api.post(`/documents/transcript/${studentId}`);
export const generateMyTranscript = () => api.post('/documents/my-transcript');
export const downloadTranscript = (documentId) => api.get(`/documents/transcript/${documentId}`, { responseType: 'blob' });
export const verifyTranscript = (documentId) => api.get(`/documents/transcript/verify/${documentId}`);

// ─── Module 4: Course Feedback ───
export const openFeedbackWindow = (courseOfferingId, data) => api.post(`/feedback/courses/${courseOfferingId}/window`, data);
export const closeFeedbackWindow = (windowId) => api.patch(`/feedback/window/${windowId}/close`);
export const getActiveFeedback = (courseOfferingId) => api.get(`/feedback/courses/${courseOfferingId}/active`);
export const submitFeedback = (courseOfferingId, data) => api.post(`/feedback/courses/${courseOfferingId}/submit`, data);
export const getFeedbackResults = (courseOfferingId) => api.get(`/feedback/courses/${courseOfferingId}/results`);
export const getAllFeedback = () => api.get('/feedback/all');

// ─── Instructor Management (Admin) ───
export const manageInstructors = (offeringId, data) => api.patch(`/courses/offerings/${offeringId}/instructors`, data);

// ─── Departments & Programs ───
export const getAllStudents = () => api.get('/admin/students');
export const getDepartments = () => api.get('/admin/departments');
export const getPrograms = () => api.get('/admin/programs');
export const getAdminOfferings = () => api.get('/admin/enrollments/offerings');

// ─── Module 6: Hostel Transfers ───
export const createTransferRequest = (data) => api.post('/hostel/transfers', data);
export const getMyTransfers = () => api.get('/hostel/transfers/my');
export const getAllTransfers = () => api.get('/hostel/transfers');
export const reviewTransfer = (id, data) => api.patch(`/hostel/transfers/${id}/review`, data);

// ─── Module 6: Assets ───
export const createAsset = (data) => api.post('/hostel/assets', data);
export const getAllAssets = () => api.get('/hostel/assets');
export const updateAsset = (id, data) => api.put(`/hostel/assets/${id}`, data);
export const logMaintenance = (id, data) => api.patch(`/hostel/assets/${id}/maintenance`, data);
export const deleteAsset = (id) => api.delete(`/hostel/assets/${id}`);

// ─── Module 6: HMC Members ───
export const getHMCMembers = () => api.get('/admin/hmc/members');
export const addHMCMember = (data) => api.post('/admin/hmc/members', data);
export const updateHMCMember = (id, data) => api.put(`/admin/hmc/members/${id}`, data);
export const removeHMCMember = (id) => api.delete(`/admin/hmc/members/${id}`);

// ─── Course Feed / Posts ───
export const getCoursePosts = (courseOfferingId) => api.get(`/posts/${courseOfferingId}`);
export const createPost = (courseOfferingId, formData) =>
  api.post(`/posts/${courseOfferingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deletePost = (postId) => api.delete(`/posts/post/${postId}`);
export const downloadPostAttachment = (postId) => api.get(`/posts/post/${postId}/attachment`, { responseType: 'blob' });
export const addReply = (postId, body) => api.post(`/posts/post/${postId}/replies`, { body });
export const deleteReply = (postId, replyId) => api.delete(`/posts/post/${postId}/replies/${replyId}`);
export const getStudentFeedOfferings = () => api.get('/posts/my-offerings');

// ─── Module 7: Analytics ───
export const getCourseAnalytics = (courseId) => api.get(`/analytics/course/${courseId}`);
export const getProgramAnalytics = (programId) => api.get(`/analytics/program/${programId}`);
export const getDepartmentAnalytics = (deptId) => api.get(`/analytics/department/${deptId}`);
export const getStudentAnalytics = (studentId) => api.get(`/analytics/student/${studentId}`);
