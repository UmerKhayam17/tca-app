const { Router } = require('express');
const ctrl = require('../controllers/feeController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = Router();
router.use(protect);

router.get('/structures', requirePermission('view_fee_reports'), ctrl.listStructures);
router.post('/structures', requirePermission('manage_fee_structures'), validate(schemas.feeStructureBody), ctrl.createStructure);
router.post('/vouchers/generate', requirePermission('generate_vouchers'), validate(schemas.feeVoucherGenerate), ctrl.generateVouchers);
router.get('/vouchers/student/:id', requirePermission('view_fee_reports'), ctrl.studentVouchers);
router.patch('/vouchers/:id/pay', requirePermission('record_fee_payment'), validate(schemas.feePay), ctrl.payVoucher);
router.get('/reports/monthly', requirePermission('view_fee_reports'), ctrl.monthlyReport);

module.exports = router;
