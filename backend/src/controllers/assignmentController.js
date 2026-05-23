const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Assignment = require('../models/Assignment');
const Student = require('../models/Student');

const create = catchAsync(async (req, res) => {
  const row = await Assignment.create({
    ...req.body,
    teacher: req.user._id,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: row });
});

const list = catchAsync(async (req, res) => {
  const { classId, sectionId } = req.query;
  const q = {};
  if (classId) q.class = classId;
  if (sectionId) q.section = sectionId;
  const rows = await Assignment.find(q)
    .populate('subject')
    .populate('class')
    .populate('section')
    .populate('createdBy', 'name email');
  res.json({ success: true, data: rows });
});

const submit = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  let studentId = req.body.studentId;
  const roleName = req.user.roleDoc?.name || req.user.role?.name;
  if (roleName === 'student') {
    const st = await Student.findOne({ userId: req.user._id });
    studentId = st?._id;
  }
  if (!studentId) throw new ApiError(400, 'studentId required');
  assignment.submissions.push({
    student: studentId,
    fileUrl: req.body.fileUrl,
    submittedAt: new Date(),
  });
  await assignment.save();
  res.json({ success: true, data: assignment });
});

module.exports = { create, list, submit };
