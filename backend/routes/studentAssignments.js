const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/studentAssignmentController');
const upload = require('../config/multerSubmissionConfig');

// Student assignments
router.get('/', authenticate, authorizeRoles('student'), ctrl.getMyAssignments);
router.post('/:assignmentId/submit', authenticate, authorizeRoles('student'), upload.single('file'), ctrl.submitAssignment);
router.get('/submissions', authenticate, authorizeRoles('student'), ctrl.getMySubmissions);
router.get('/submissions/:submissionId/download', authenticate, authorizeRoles('student'), ctrl.downloadMySubmission);

module.exports = router;
