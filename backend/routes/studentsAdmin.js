const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const studentAdminController = require('../controllers/studentAdminController');
const upload = require('../config/multerConfig');
const { heavyLimiter } = require('../middleware/rateLimiter');

// Specific routes before /:id to avoid shadowing
router.post('/bulk-import', authenticate, authorizeRoles('admin'), heavyLimiter, upload.single('file'), auditLogger('BULK_IMPORT_STUDENTS'), studentAdminController.bulkImportStudents);

router.get('/', authenticate, authorizeRoles('admin', 'hmc_member'), studentAdminController.getAllStudents);
router.post('/', authenticate, authorizeRoles('admin'), auditLogger('CREATE_STUDENT'), studentAdminController.createStudent);
router.put('/:id', authenticate, authorizeRoles('admin'), auditLogger('UPDATE_STUDENT'), studentAdminController.updateStudent);
router.patch('/:id/status', authenticate, authorizeRoles('admin'), auditLogger('UPDATE_STUDENT_STATUS'), studentAdminController.updateStudentStatus);

module.exports = router;
