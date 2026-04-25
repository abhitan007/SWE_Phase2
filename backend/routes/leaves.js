const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/leaveController');

router.post('/', authenticate, authorizeRoles('student'), ctrl.create);
router.get('/my', authenticate, authorizeRoles('student'), ctrl.getMyLeaves);
router.delete('/:id', authenticate, authorizeRoles('student'), ctrl.cancel);
router.get('/', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.getAll);
router.patch('/:id/review', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.review);

module.exports = router;
