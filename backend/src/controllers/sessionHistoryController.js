const catchAsync = require('../utils/catchAsync');
const sessionHistoryService = require('../services/session/sessionHistoryService');

const getHistory = catchAsync(async (req, res) => {
  const data = await sessionHistoryService.getSessionHistory(req.params.id);
  res.json({ success: true, data });
});

const complete = catchAsync(async (req, res) => {
  const data = await sessionHistoryService.completeSession(req.params.id, req.user._id);
  res.json({ success: true, data });
});

const archive = catchAsync(async (req, res) => {
  const data = await sessionHistoryService.archiveSession(req.params.id, req.user._id);
  res.json({ success: true, data });
});

const activate = catchAsync(async (req, res) => {
  const data = await sessionHistoryService.activateSession(req.params.id, req.user._id);
  res.json({ success: true, data });
});

const cloneStructure = catchAsync(async (req, res) => {
  const data = await sessionHistoryService.cloneSessionStructure(
    req.params.id,
    req.body,
    req.user._id
  );
  res.status(201).json({ success: true, data });
});

module.exports = {
  getHistory,
  complete,
  archive,
  activate,
  cloneStructure,
};
