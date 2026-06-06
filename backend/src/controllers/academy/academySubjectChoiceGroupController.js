const catchAsync = require('../../utils/catchAsync');
const groupService = require('../../services/academy/academySubjectChoiceGroupService');
const enrollmentService = require('../../services/academy/academyEnrollmentSubjectService');

const listByClass = catchAsync(async (req, res) => {
  const data = await groupService.listByClass(req.params.classId);
  res.json({ success: true, data });
});

const create = catchAsync(async (req, res) => {
  const data = await groupService.createGroup(
    { ...req.body, classId: req.params.classId },
    req.user._id
  );
  res.status(201).json({ success: true, data });
});

const createBulk = catchAsync(async (req, res) => {
  const data = await groupService.createGroupWithSubjects(
    req.params.classId,
    req.body,
    req.user._id
  );
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await groupService.updateGroup(req.params.id, req.body);
  res.json({ success: true, data });
});

const remove = catchAsync(async (req, res) => {
  await groupService.deleteGroup(req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

const enrollmentLayout = catchAsync(async (req, res) => {
  const data = await enrollmentService.getEnrollmentLayout(
    req.params.classId,
    req.query.sectionId
  );
  res.json({ success: true, data });
});

module.exports = { listByClass, create, createBulk, update, remove, enrollmentLayout };
