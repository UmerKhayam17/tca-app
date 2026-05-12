const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Announcement = require('../models/Announcement');

const create = catchAsync(async (req, res) => {
  const ann = await Announcement.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: ann });
});

const list = catchAsync(async (req, res) => {
  const { audience, classId, sectionId } = req.query;
  const q = {};
  if (audience) q.targetAudience = audience;
  if (classId) q.targetClass = classId;
  if (sectionId) q.targetSection = sectionId;
  const rows = await Announcement.find(q).populate('targetClass').populate('targetSection').sort({ createdAt: -1 });
  res.json({ success: true, data: rows });
});

module.exports = { create, list };
