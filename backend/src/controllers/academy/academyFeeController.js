const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const feeService = require('../../services/academy/academyFeeService');
const AcademyStudent = require('../../models/academy/AcademyStudent');

async function assertParentOwnsStudent(req, studentId) {
  const roleName = req.user?.roleDoc?.name || req.user?.role?.name || req.user?.role;
  if (String(roleName) !== 'parent') return;

  const student = await AcademyStudent.findById(studentId).select('guardianEmail');
  if (!student) throw new ApiError(404, 'Student not found');

  const guardianEmail = String(student.guardianEmail || '').trim().toLowerCase();
  const userEmail = String(req.user?.email || '').trim().toLowerCase();
  if (!guardianEmail || guardianEmail !== userEmail) {
    throw new ApiError(403, 'Access denied');
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const list = catchAsync(async (req, res) => {
  const roleName = req.user?.roleDoc?.name || req.user?.role?.name || req.user?.role;
  const isParent = String(roleName) === 'parent';

  const studentId = req.query.studentId;
  if (isParent && studentId) {
    await assertParentOwnsStudent(req, studentId);
  }

  // If parent is requesting without a specific student, scope fees to all their children.
  let studentIds;
  if (isParent && !studentId) {
    const email = String(req.user?.email || '').trim();
    const escaped = escapeRegExp(email);
    const rows = await AcademyStudent.find({
      guardianEmail: { $regex: `^${escaped}$`, $options: 'i' },
      status: 'active',
    })
      .select('_id')
      .lean();
    studentIds = rows.map((s) => s._id);
  }

  const result = await feeService.listFeeRecords({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    studentId: studentId || undefined,
    studentIds,
    status: req.query.status,
    month: req.query.month,
    year: req.query.year,
    classId: req.query.classId,
    feeType: req.query.feeType,
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
  await assertParentOwnsStudent(req, req.params.studentId);
  const data = await feeService.getStudentFeeHistory(req.params.studentId);
  res.json({ success: true, data });
});

const summary = catchAsync(async (req, res) => {
  const roleName = req.user?.roleDoc?.name || req.user?.role?.name || req.user?.role;
  const isParent = String(roleName) === 'parent';

  const studentId = req.query.studentId;
  if (isParent && studentId) {
    await assertParentOwnsStudent(req, studentId);
  }

  let studentIds;
  if (isParent && !studentId) {
    const email = String(req.user?.email || '').trim();
    const escaped = escapeRegExp(email);
    const rows = await AcademyStudent.find({
      guardianEmail: { $regex: `^${escaped}$`, $options: 'i' },
      status: 'active',
    })
      .select('_id')
      .lean();
    studentIds = rows.map((s) => s._id);
  }

  const data = await feeService.getFeeSummary({
    month: req.query.month ? Number(req.query.month) : undefined,
    year: req.query.year ? Number(req.query.year) : undefined,
    classId: req.query.classId,
    studentId: studentId || undefined,
    studentIds,
  });
  res.json({ success: true, data });
});

const defaulters = catchAsync(async (req, res) => {
  const result = await feeService.listFeeDefaulters({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    classId: req.query.classId,
    month: req.query.month ? Number(req.query.month) : undefined,
    year: req.query.year ? Number(req.query.year) : undefined,
    search: req.query.search,
  });
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

const defaultersSummary = catchAsync(async (req, res) => {
  const data = await feeService.getDefaultersSummary({
    classId: req.query.classId,
    month: req.query.month ? Number(req.query.month) : undefined,
    year: req.query.year ? Number(req.query.year) : undefined,
  });
  res.json({ success: true, data });
});

const exportDefaulters = catchAsync(async (req, res) => {
  const csv = await feeService.exportFeeDefaulters({
    classId: req.query.classId,
    month: req.query.month ? Number(req.query.month) : undefined,
    year: req.query.year ? Number(req.query.year) : undefined,
    search: req.query.search,
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="fee-defaulters.csv"');
  res.send(csv);
});

module.exports = {
  list,
  generate,
  pay,
  studentHistory,
  summary,
  defaulters,
  defaultersSummary,
  exportDefaulters,
};
