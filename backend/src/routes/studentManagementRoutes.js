const { Router } = require('express');
const { protect } = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/academySchemas');

const classCtrl = require('../controllers/academy/academyClassController');
const subjectCtrl = require('../controllers/academy/academySubjectController');
const feeStructureCtrl = require('../controllers/academy/academyFeeStructureController');
const studentCtrl = require('../controllers/academy/academyStudentController');
const feeCtrl = require('../controllers/academy/academyFeeController');
const assessmentCtrl = require('../controllers/academy/academyAssessmentController');
const classTestCtrl = require('../controllers/academy/academyClassTestController');
const { uploadImage } = require('../middleware/uploadImage');

const router = Router();
router.use(protect);

// Classes
router.get(
  '/classes',
  requireAnyPermission(
    'view_academy_students',
    'manage_academy_classes',
    'enter_exam_marks',
    'view_results'
  ),
  classCtrl.list
);
router.post('/classes', requirePermission('manage_academy_classes'), validate(schemas.academyClassBody), classCtrl.create);
router.patch(
  '/classes/:id',
  requirePermission('manage_academy_classes'),
  validate(schemas.academyClassPatch),
  classCtrl.update
);
router.delete('/classes/:id', requirePermission('manage_academy_classes'), classCtrl.remove);

// Subjects
router.get(
  '/classes/:classId/subjects',
  requireAnyPermission(
    'view_academy_students',
    'manage_academy_subjects',
    'enter_exam_marks',
    'view_results'
  ),
  subjectCtrl.listByClass
);
router.post(
  '/subjects',
  requirePermission('manage_academy_subjects'),
  validate(schemas.academySubjectBody),
  subjectCtrl.create
);
router.patch(
  '/subjects/:id',
  requirePermission('manage_academy_subjects'),
  validate(schemas.academySubjectPatch),
  subjectCtrl.update
);
router.delete('/subjects/:id', requirePermission('manage_academy_subjects'), subjectCtrl.remove);

// Fee structure
router.get(
  '/fee-structures',
  requireAnyPermission('view_academy_students', 'manage_academy_fee_structures'),
  feeStructureCtrl.list
);
router.get(
  '/fee-structures/class/:classId',
  requireAnyPermission('view_academy_students', 'manage_academy_fee_structures'),
  feeStructureCtrl.getByClass
);
router.post(
  '/fee-structures',
  requirePermission('manage_academy_fee_structures'),
  validate(schemas.academyFeeStructureBody),
  feeStructureCtrl.create
);
router.patch(
  '/fee-structures/:id',
  requirePermission('manage_academy_fee_structures'),
  validate(schemas.academyFeeStructurePatch),
  feeStructureCtrl.update
);
router.post(
  '/fee-structures/preview',
  requireAnyPermission('view_academy_students', 'manage_academy_students'),
  validate(schemas.feePreview),
  feeStructureCtrl.preview
);

// Students
router.post(
  '/students/preview-fees',
  requireAnyPermission('manage_academy_students', 'view_academy_students'),
  validate(schemas.feePreview),
  studentCtrl.previewFees
);
router.post(
  '/students',
  requirePermission('manage_academy_students'),
  validate(schemas.academyStudentRegister),
  studentCtrl.register
);
router.get(
  '/students/export',
  requirePermission('view_academy_students'),
  studentCtrl.exportCsv
);
router.get('/students', requirePermission('view_academy_students'), studentCtrl.list);
router.get('/students/:id/record', requirePermission('view_academy_students'), studentCtrl.getRecord);
router.get(
  '/class-tests',
  requireAnyPermission('view_academy_students', 'enter_exam_marks', 'view_results'),
  classTestCtrl.list
);
router.post(
  '/class-tests',
  requireAnyPermission('enter_exam_marks', 'manage_academy_students'),
  validate(schemas.academyClassTestBody),
  classTestCtrl.create
);
router.get(
  '/class-tests/:id/entry',
  requireAnyPermission('view_academy_students', 'enter_exam_marks', 'view_results'),
  classTestCtrl.getEntry
);
router.post(
  '/class-tests/:id/students/:studentId/test-paper',
  requireAnyPermission('enter_exam_marks', 'manage_academy_students'),
  uploadImage.single('testPaper'),
  classTestCtrl.uploadTestPaper
);
router.post(
  '/class-tests/:id/marks',
  requireAnyPermission('enter_exam_marks', 'manage_academy_students'),
  validate(schemas.academyClassTestMarksBody),
  classTestCtrl.saveMarks
);
router.delete(
  '/class-tests/:id',
  requireAnyPermission('enter_exam_marks', 'manage_academy_students'),
  classTestCtrl.remove
);
router.get(
  '/assessments/class-entry',
  requireAnyPermission('view_academy_students', 'enter_exam_marks', 'view_results'),
  validate(schemas.academyAssessmentSessionQuery, 'query'),
  assessmentCtrl.classEntry
);
router.post(
  '/assessments/bulk',
  requireAnyPermission('enter_exam_marks', 'manage_academy_students'),
  validate(schemas.academyAssessmentBulkBody),
  assessmentCtrl.bulkSave
);
router.get(
  '/students/:studentId/assessments',
  requirePermission('view_academy_students'),
  assessmentCtrl.list
);
router.post(
  '/students/:studentId/assessments',
  requireAnyPermission('enter_exam_marks', 'manage_academy_students'),
  validate(schemas.academyAssessmentBody),
  assessmentCtrl.create
);
router.patch(
  '/assessments/:id',
  requireAnyPermission('enter_exam_marks', 'manage_academy_students'),
  validate(schemas.academyAssessmentPatch),
  assessmentCtrl.update
);
router.delete(
  '/assessments/:id',
  requireAnyPermission('enter_exam_marks', 'manage_academy_students'),
  assessmentCtrl.remove
);
router.get('/students/:id', requirePermission('view_academy_students'), studentCtrl.getById);
router.patch(
  '/students/:id',
  requirePermission('manage_academy_students'),
  validate(schemas.academyStudentPatch),
  studentCtrl.update
);
router.delete('/students/:id', requirePermission('manage_academy_students'), studentCtrl.remove);

// Fee management
router.get(
  '/fees',
  requireAnyPermission('view_academy_fee_reports', 'manage_academy_fees'),
  feeCtrl.list
);
router.post(
  '/fees/generate',
  requirePermission('manage_academy_fees'),
  validate(schemas.academyFeeGenerate),
  feeCtrl.generate
);
router.patch(
  '/fees/:id/pay',
  requirePermission('manage_academy_fees'),
  validate(schemas.academyFeePay),
  feeCtrl.pay
);
router.get(
  '/fees/student/:studentId',
  requireAnyPermission('view_academy_fee_reports', 'manage_academy_fees'),
  feeCtrl.studentHistory
);

module.exports = router;
