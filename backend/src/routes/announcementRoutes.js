const { Router } = require('express');
const ctrl = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = Router();

router.get('/', protect, ctrl.list);
router.post('/', protect, requirePermission('manage_announcements'), validate(schemas.announcementBody), ctrl.create);
router.delete('/:id', protect, requirePermission('manage_announcements'), ctrl.remove);

module.exports = router;
