const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/facultyCourseController');
const upload = require('../config/multerSubmissionConfig');

// My assigned offerings (must be before /:courseOfferingId routes)
router.get('/my', authenticate, authorizeRoles('faculty'), ctrl.getMyCourseOfferings);

// Assignments
router.post('/:courseOfferingId/assignments', authenticate, authorizeRoles('faculty'), upload.single('attachment'), ctrl.createAssignment);
router.get('/:courseOfferingId/assignments', authenticate, authorizeRoles('faculty'), ctrl.getAssignments);
router.put('/assignments/:assignmentId', authenticate, authorizeRoles('faculty'), upload.single('attachment'), ctrl.updateAssignment);
router.patch('/assignments/:assignmentId/publish', authenticate, authorizeRoles('faculty'), ctrl.publishAssignment);
router.delete('/assignments/:assignmentId', authenticate, authorizeRoles('faculty'), ctrl.deleteAssignment);
router.get('/assignments/:assignmentId/attachment', authenticate, authorizeRoles('faculty', 'student'), ctrl.downloadAssignmentAttachment);

// Submission Review
router.get('/assignments/:assignmentId/submissions', authenticate, authorizeRoles('faculty'), ctrl.getSubmissions);
router.get('/submissions/:submissionId/download', authenticate, authorizeRoles('faculty'), ctrl.downloadSubmission);
router.patch('/submissions/:submissionId/grade', authenticate, authorizeRoles('faculty'), ctrl.gradeSubmission);

// Attendance
router.post('/:courseOfferingId/attendance', authenticate, authorizeRoles('faculty'), ctrl.markAttendance);
router.get('/:courseOfferingId/attendance', authenticate, authorizeRoles('faculty'), ctrl.getAttendanceSessions);

// Roster & Grades
router.get('/:courseOfferingId/roster', authenticate, authorizeRoles('faculty'), ctrl.getRoster);
router.post('/:courseOfferingId/grades', authenticate, authorizeRoles('faculty'), ctrl.submitGrades);

module.exports = router;
