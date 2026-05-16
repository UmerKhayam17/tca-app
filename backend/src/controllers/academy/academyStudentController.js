const catchAsync = require('../../utils/catchAsync');
const studentService = require('../../services/academy/academyStudentService');
const feeStructureService = require('../../services/academy/academyFeeStructureService');

const register = catchAsync(async (req, res) => {
  const data = await studentService.registerStudent(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await studentService.updateStudent(req.params.id, req.body);
  res.json({ success: true, data });
});

const getById = catchAsync(async (req, res) => {
  const data = await studentService.getStudent(req.params.id);
  res.json({ success: true, data });
});

const list = catchAsync(async (req, res) => {
  const result = await studentService.listStudents({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: req.query.search,
    classId: req.query.classId,
    status: req.query.status,
    sort: req.query.sort,
  });
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

const exportCsv = catchAsync(async (req, res) => {
  const result = await studentService.listStudents({
    page: 1,
    limit: 10000,
    search: req.query.search,
    classId: req.query.classId,
    status: req.query.status,
  });
  const csv = studentService.studentsToCsv(result.items);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="academy-students.csv"');
  res.send(csv);
});

const previewFees = catchAsync(async (req, res) => {
  const data = await feeStructureService.previewFees(req.body);
  res.json({ success: true, data });
});

module.exports = { register, update, getById, list, exportCsv, previewFees };
