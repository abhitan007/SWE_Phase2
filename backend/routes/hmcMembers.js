const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/hmcController');

router.get('/', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.getAll);
router.post('/', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.add);
router.put('/:id', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.update);
router.delete('/:id', authenticate, authorizeRoles('admin', 'hmc_member'), ctrl.remove);

module.exports = router;
