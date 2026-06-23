const catchAsync = require('../../utils/catchAsync');
const sectionService = require('../../services/academy/academySectionService');

const listByClass = catchAsync(async (req, res) => {
  const data = await sectionService.listByClass(req.params.classId, { status: req.query.status });
  res.json({ success: true, data });
});

const listBySession = catchAsync(async (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'sessionId query parameter required' });
  }
  const data = await sectionService.listBySession(sessionId, { status: req.query.status });
  res.json({ success: true, data });
});

const create = catchAsync(async (req, res) => {
  const data = await sectionService.createSection(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await sectionService.updateSection(req.params.id, req.body);
  res.json({ success: true, data });
});

const remove = catchAsync(async (req, res) => {
  await sectionService.deleteSection(req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = { listByClass, listBySession, create, update, remove };
