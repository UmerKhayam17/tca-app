const { Router } = require('express');
const ctrl = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = Router();

router.get('/', protect, ctrl.list);
router.post('/', protect, requirePermission('manage_assignments'), validate(schemas.assignmentBody), ctrl.create);
router.post('/:id/submit', protect, requireAnyPermission('submit_assignment', 'manage_assignments'), validate(schemas.assignmentSubmit), ctrl.submit);

module.exports = router;
