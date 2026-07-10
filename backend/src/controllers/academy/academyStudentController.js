const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const studentService = require('../../services/academy/academyStudentService');
const recordService = require('../../services/academy/academyStudentRecordService');
const feeStructureService = require('../../services/academy/academyFeeStructureService');
const rt = require('../../services/realtime/academyRealtime');

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
  rt.studentCreated(data, req.user._id);
  res.status(201).json({ success: true, data });
});

const registerProvisional = catchAsync(async (req, res) => {
  const data = await studentService.registerProvisionalStudent(req.body, req.user._id);
  rt.studentCreated(data, req.user._id);
  res.status(201).json({ success: true, data });
});

const activate = catchAsync(async (req, res) => {
  const result = await studentService.activateStudent(req.params.id, req.body, req.user._id);
  rt.studentActivated(result.student);
  res.json({ success: true, data: result.student, credentials: result.credentials });
});

const registerDirect = catchAsync(async (req, res) => {
  const result = await studentService.registerDirectStudent(req.body, req.user._id);
  rt.studentActivated(result.student);
  res.status(201).json({ success: true, data: result.student, credentials: result.credentials });
});

const update = catchAsync(async (req, res) => {
  const data = await studentService.updateStudent(req.params.id, req.body);
  rt.studentUpdated(data);
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
    sessionId: req.query.sessionId,
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
    sessionId: req.query.sessionId,
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
  rt.studentDeleted(req.params.id);
  res.json({ success: true, data });
});

const discountReport = catchAsync(async (req, res) => {
  const result = await studentService.getDiscountReport({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    classId: req.query.classId,
    search: req.query.search,
    from: req.query.from,
    to: req.query.to,
  });
  res.json({ success: true, data: result.items, summary: result.summary, pagination: result.pagination });
});

const uploadPhoto = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Image file required');
  const data = await studentService.uploadStudentPhoto(req.params.id, req.file);
  rt.studentUpdated(data);
  res.json({ success: true, data });
});

module.exports = {
  register,
  registerProvisional,
  registerDirect,
  activate,
  update,
  getById,
  getRecord,
  list,
  exportCsv,
  previewFees,
  remove,
  discountReport,
  uploadPhoto,
};
