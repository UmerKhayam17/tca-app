const { Router } = require('express');
const ctrl = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');
const { upload } = require('../middleware/upload');

const router = Router();
router.use(protect);

router.post('/register', requirePermission('temporary_register_student'), validate(schemas.registerStudent), ctrl.register);
router.get('/', requirePermission('view_students'), ctrl.list);
router.get('/:id', requirePermission('view_students'), ctrl.getById);
router.patch('/:id/activate', requirePermission('activate_student'), validate(schemas.activateStudent), ctrl.activate);
router.patch('/:id/status', requirePermission('update_student_status'), validate(schemas.studentStatus), ctrl.updateStatus);
router.post('/:id/documents', requirePermission('temporary_register_student'), upload.single('file'), ctrl.addDocument);

module.exports = router;
