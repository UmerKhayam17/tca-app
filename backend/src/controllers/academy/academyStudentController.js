const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const studentService = require('../../services/academy/academyStudentService');
const recordService = require('../../services/academy/academyStudentRecordService');
const feeStructureService = require('../../services/academy/academyFeeStructureService');

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

const register = catchAsync(async (req, res) => {
  const data = await studentService.registerStudent(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await studentService.updateStudent(req.params.id, req.body);
  res.json({ success: true, data });
});

const getById = catchAsync(async (req, res) => {
  await assertParentOwnsStudent(req, req.params.id);
  const data = await studentService.getStudent(req.params.id);
  res.json({ success: true, data });
});

const getRecord = catchAsync(async (req, res) => {
  await assertParentOwnsStudent(req, req.params.id);
  const data = await recordService.getStudentRecord(req.params.id);
  res.json({ success: true, data });
});

const list = catchAsync(async (req, res) => {
  const roleName = req.user?.roleDoc?.name || req.user?.role?.name || req.user?.role;
  const guardianEmail = String(roleName) === 'parent' ? String(req.user?.email || '').trim().toLowerCase() : undefined;
  const result = await studentService.listStudents({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: req.query.search,
    classId: req.query.classId,
    status: req.query.status,
    sort: req.query.sort,
    guardianEmail,
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

const remove = catchAsync(async (req, res) => {
  const data = await studentService.deleteStudent(req.params.id);
  res.json({ success: true, data });
});

module.exports = { register, update, getById, getRecord, list, exportCsv, previewFees, remove };
