const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Notification = require('../models/Notification');
const { formatNotification } = require('../services/realtime/realtimeService');

const list = catchAsync(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const unreadOnly = req.query.unread === '1' || req.query.unread === 'true';
  const filter = { userId: req.user._id };
  if (unreadOnly) filter.read = false;

  const [items, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);

  res.json({
    success: true,
    data: items.map(formatNotification),
    unreadCount,
  });
});

const markRead = catchAsync(async (req, res) => {
  const doc = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
  if (!doc) throw new ApiError(404, 'Notification not found');
  if (!doc.read) {
    doc.read = true;
    doc.readAt = new Date();
    await doc.save();
  }
  res.json({ success: true, data: formatNotification(doc) });
});

const markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  res.json({ success: true, data: { read: true } });
});

module.exports = { list, markRead, markAllRead };
