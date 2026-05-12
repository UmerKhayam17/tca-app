const { Router } = require('express');
const ctrl = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = Router();
router.use(protect);

router.post('/mark', requirePermission('mark_attendance'), validate(schemas.markAttendance), ctrl.mark);
router.get('/class/:classId', requirePermission('view_attendance'), ctrl.byClass);
router.get('/student/:id', requirePermission('view_attendance'), ctrl.byStudent);
router.patch('/:id', requirePermission('correct_attendance'), validate(schemas.attendanceCorrect), ctrl.correct);
router.get('/report/monthly', requirePermission('view_attendance'), ctrl.monthlyReport);

module.exports = router;
