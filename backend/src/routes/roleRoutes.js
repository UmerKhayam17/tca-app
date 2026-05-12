const { Router } = require('express');
const ctrl = require('../controllers/roleController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = Router();
router.use(protect);

router.get('/roles', requirePermission('manage_users'), ctrl.listRoles);
router.post('/roles', requirePermission('manage_roles'), validate(schemas.createRole), ctrl.createRole);
router.get('/permissions', requirePermission('manage_users'), ctrl.listPermissions);

module.exports = router;
