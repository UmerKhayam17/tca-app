const catchAsync = require('../../utils/catchAsync');
const timetableService = require('../../services/academy/academyClassTimetableService');

const list = catchAsync(async (req, res) => {
  const data = await timetableService.listByClass(req.params.classId);
  res.json({ success: true, data });
});

const create = catchAsync(async (req, res) => {
  const data = await timetableService.createSlot({ ...req.body, classId: req.params.classId });
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await timetableService.updateSlot(req.params.slotId, req.body);
  res.json({ success: true, data });
});

const remove = catchAsync(async (req, res) => {
  await timetableService.deleteSlot(req.params.slotId);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = { list, create, update, remove };
