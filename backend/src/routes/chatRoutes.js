const { Router } = require('express');
const ctrl = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = Router();
router.use(protect);

router.post('/conversations', requirePermission('manage_conversations'), validate(schemas.conversationBody), ctrl.createConversation);
router.get('/conversations', requirePermission('use_chat'), ctrl.listConversations);
router.get('/conversations/:id/messages', requirePermission('use_chat'), ctrl.listMessages);
router.post('/conversations/:id/messages', requirePermission('use_chat'), validate(schemas.messageBody), ctrl.sendMessage);
router.patch('/conversations/:id/messages/read', requirePermission('use_chat'), validate(schemas.readMessages), ctrl.markRead);

module.exports = router;
