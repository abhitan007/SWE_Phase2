const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/complaintController');
const upload = require('../config/multerConfig');

router.post('/', authenticate, authorizeRoles('student'), upload.single('attachment'), ctrl.create);
router.get('/my', authenticate, authorizeRoles('student'), ctrl.getMyComplaints);
router.get('/', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.getAll);
router.patch('/:id/status', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.updateStatus);

module.exports = router;
