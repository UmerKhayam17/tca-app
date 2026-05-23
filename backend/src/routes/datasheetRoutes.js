const { Router } = require('express');
const ctrl = require('../controllers/datasheetController');
const { protect } = require('../middleware/auth');
const { requireAnyPermission, requirePermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = Router();
router.use(protect);

router.get('/', requireAnyPermission('view_datasheets', 'manage_datasheets'), ctrl.list);
router.get('/:id', requireAnyPermission('view_datasheets', 'manage_datasheets'), ctrl.getOne);
router.post('/', requirePermission('manage_datasheets'), validate(schemas.datasheetBody), ctrl.create);
router.patch('/:id', requirePermission('manage_datasheets'), validate(schemas.datasheetPatch), ctrl.update);
router.delete('/:id', requirePermission('manage_datasheets'), ctrl.remove);

module.exports = router;
