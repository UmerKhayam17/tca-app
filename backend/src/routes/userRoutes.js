const { Router } = require('express');
const ctrl = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = Router();
router.use(protect);

router.get('/', requirePermission('manage_users'), ctrl.listUsers);
router.post('/', requirePermission('manage_users'), validate(schemas.createUser), ctrl.createUser);
router.patch('/:id', requirePermission('manage_users'), validate(schemas.updateUser), ctrl.updateUser);
router.patch('/:id/permissions', requirePermission('manage_roles'), validate(schemas.userPermissions), ctrl.patchPermissions);

module.exports = router;
