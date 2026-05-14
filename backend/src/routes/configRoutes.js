const { Router } = require('express');
const ctrl = require('../controllers/configController');
const { protect } = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = Router();
router.use(protect);

router.get(
  '/system-modules',
  requireAnyPermission('manage_roles', 'manage_users'),
  ctrl.listSystemModules
);

router.get('/sessions', requireAnyPermission('manage_sessions', 'generate_vouchers', 'temporary_register_student', 'activate_student'), ctrl.listSessions);
router.post('/sessions', requirePermission('manage_sessions'), validate(schemas.sessionBody), ctrl.createSession);
router.patch('/sessions/:id', requirePermission('manage_sessions'), ctrl.patchSession);

router.get('/classes', requireAnyPermission('manage_classes', 'view_timetables', 'view_students', 'mark_attendance'), ctrl.listClasses);
router.post('/classes', requirePermission('manage_classes'), validate(schemas.classBody), ctrl.createClass);
router.patch('/classes/:id', requirePermission('manage_classes'), ctrl.patchClass);

router.post('/sections', requirePermission('manage_classes'), validate(schemas.sectionBody), ctrl.createSection);
router.patch('/sections/:id', requirePermission('manage_classes'), ctrl.patchSection);

router.get('/subjects', requireAnyPermission('manage_classes', 'view_timetables', 'enter_exam_marks', 'manage_assignments'), ctrl.listSubjects);
router.post('/subjects', requirePermission('manage_classes'), validate(schemas.subjectBody), ctrl.createSubject);

router.get('/timetables', requirePermission('view_timetables'), ctrl.listTimetables);
router.post('/timetables', requirePermission('manage_timetables'), validate(schemas.timetableBody), ctrl.createTimetable);

module.exports = router;
