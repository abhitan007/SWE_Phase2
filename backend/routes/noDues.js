const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/noDuesController');

router.get('/my', authenticate, authorizeRoles('student'), ctrl.getMyNoDues);
router.get('/', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.getAll);
router.post('/:studentId/initialize', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.initializeForStudent);
router.patch('/:studentId/items/:itemId/clear', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.clearItem);

module.exports = router;
