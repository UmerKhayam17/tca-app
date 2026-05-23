const catchAsync = require('../../utils/catchAsync');
const assessmentService = require('../../services/academy/academyAssessmentService');

const list = catchAsync(async (req, res) => {
  const data = await assessmentService.listByStudent(req.params.studentId);
  res.json({ success: true, data });
});

const create = catchAsync(async (req, res) => {
  const data = await assessmentService.createAssessment(req.params.studentId, req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await assessmentService.updateAssessment(req.params.id, req.body);
  res.json({ success: true, data });
});

const remove = catchAsync(async (req, res) => {
  await assessmentService.removeAssessment(req.params.id);
  res.json({ success: true, data: { ok: true } });
});

const classEntry = catchAsync(async (req, res) => {
  const data = await assessmentService.getClassTestEntry(req.query);
  res.json({ success: true, data });
});

const bulkSave = catchAsync(async (req, res) => {
  const data = await assessmentService.bulkSaveClassTest(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

module.exports = { list, create, update, remove, classEntry, bulkSave };
