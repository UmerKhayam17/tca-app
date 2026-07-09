const { Router } = require('express');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

const router = Router();

router.use(protect);
router.get('/', ctrl.list);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
