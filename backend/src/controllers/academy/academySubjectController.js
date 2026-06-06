const catchAsync = require('../../utils/catchAsync');
const subjectService = require('../../services/academy/academySubjectService');

const listByClass = catchAsync(async (req, res) => {
  const data = await subjectService.listByClass(req.params.classId, {
    status: req.query.status,
    sectionId: req.query.sectionId,
  });
  res.json({ success: true, data });
});

const create = catchAsync(async (req, res) => {
  const data = await subjectService.createSubject(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await subjectService.updateSubject(req.params.id, req.body, req.user._id);
  res.json({ success: true, data });
});

const remove = catchAsync(async (req, res) => {
  await subjectService.deleteSubject(req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = { listByClass, create, update, remove };
