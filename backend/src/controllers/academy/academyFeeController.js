const catchAsync = require('../../utils/catchAsync');
const feeService = require('../../services/academy/academyFeeService');

const list = catchAsync(async (req, res) => {
  const result = await feeService.listFeeRecords({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    studentId: req.query.studentId,
    status: req.query.status,
    month: req.query.month,
    year: req.query.year,
    classId: req.query.classId,
  });
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

const generate = catchAsync(async (req, res) => {
  const data = await feeService.generateMonthlyFees(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const pay = catchAsync(async (req, res) => {
  const data = await feeService.recordPayment(req.params.id, req.body, req.user._id);
  res.json({ success: true, data });
});

const studentHistory = catchAsync(async (req, res) => {
  const data = await feeService.getStudentFeeHistory(req.params.studentId);
  res.json({ success: true, data });
});

module.exports = { list, generate, pay, studentHistory };
