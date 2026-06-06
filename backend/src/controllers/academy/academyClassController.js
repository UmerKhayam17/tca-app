const catchAsync = require('../../utils/catchAsync');
const classService = require('../../services/academy/academyClassService');
const classRecordService = require('../../services/academy/academyClassRecordService');

const list = catchAsync(async (req, res) => {
  const data = await classService.listClasses({
    status: req.query.status,
    search: req.query.search,
    sessionId: req.query.sessionId,
  });
  res.json({ success: true, data });
});

const getOne = catchAsync(async (req, res) => {
  const data = await classService.getClassById(req.params.id);
  res.json({ success: true, data });
});

const getRecord = catchAsync(async (req, res) => {
  const data = await classRecordService.getClassRecord(req.params.id);
  res.json({ success: true, data });
});

const create = catchAsync(async (req, res) => {
  const data = await classService.createClass(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await classService.updateClass(req.params.id, req.body);
  res.json({ success: true, data });
});

const remove = catchAsync(async (req, res) => {
  await classService.deleteClass(req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = { list, getOne, getRecord, create, update, remove };
