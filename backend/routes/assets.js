const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/assetController');

router.post('/', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.create);
router.get('/', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.getAll);
router.put('/:id', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.update);
router.patch('/:id/maintenance', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.logMaintenance);
router.delete('/:id', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.remove);

module.exports = router;
