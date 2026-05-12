const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const FeeStructure = require('../models/FeeStructure');
const FeeVoucher = require('../models/FeeVoucher');
const Student = require('../models/Student');
const Session = require('../models/Session');
const { generateMonthlyVouchersForActiveStudents } = require('../services/feeService');
const { addFeeVoucherGenerationJob } = require('../jobs/queues');

const listStructures = catchAsync(async (req, res) => {
  const { sessionId, classId } = req.query;
  const q = {};
  if (sessionId) q.session = sessionId;
  if (classId) q.class = classId;
  const rows = await FeeStructure.find(q).populate('class').populate('session');
  res.json({ success: true, data: rows });
});

const createStructure = catchAsync(async (req, res) => {
  const row = await FeeStructure.create(req.body);
  res.status(201).json({ success: true, data: row });
});

const generateVouchers = catchAsync(async (req, res) => {
  const now = new Date();
  const month = req.body.month || now.getMonth() + 1;
  const year = req.body.year || now.getFullYear();
  let sessionId = req.body.sessionId;
  if (!sessionId) {
    const s = await Session.findOne({ isActive: true });
    sessionId = s?._id;
  }
  if (!sessionId) throw new ApiError(400, 'No active session');

  if (req.body.sync) {
    const data = await generateMonthlyVouchersForActiveStudents({
      month,
      year,
      sessionId,
      userId: req.user._id,
    });
    return res.status(201).json({ success: true, data });
  }

  await addFeeVoucherGenerationJob({
    month,
    year,
    sessionId,
    userId: req.user._id,
  });
  return res.status(202).json({ success: true, message: 'Voucher generation queued' });
});

const studentVouchers = catchAsync(async (req, res) => {
  const rows = await FeeVoucher.find({ student: req.params.id })
    .populate('feeStructure')
    .sort({ year: -1, month: -1 });
  res.json({ success: true, data: rows });
});

const payVoucher = catchAsync(async (req, res) => {
  const { paymentMethod } = req.body;
  const voucher = await FeeVoucher.findById(req.params.id);
  if (!voucher) throw new ApiError(404, 'Voucher not found');
  voucher.status = 'paid';
  voucher.paidAt = new Date();
  voucher.paymentMethod = paymentMethod;
  voucher.generatedBy = req.user._id;
  await voucher.save();
  res.json({ success: true, data: voucher });
});

const monthlyReport = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) throw new ApiError(400, 'month and year required');
  const vouchers = await FeeVoucher.find({ month: Number(month), year: Number(year) }).populate('student');
  const paid = vouchers.filter((v) => v.status === 'paid').reduce((s, v) => s + v.netAmount, 0);
  const pending = vouchers.filter((v) => v.status === 'pending' || v.status === 'overdue').length;
  res.json({
    success: true,
    data: {
      totalVouchers: vouchers.length,
      collectedAmount: paid,
      pendingCount: pending,
      vouchers,
    },
  });
});

module.exports = {
  listStructures,
  createStructure,
  generateVouchers,
  studentVouchers,
  payVoucher,
  monthlyReport,
};
