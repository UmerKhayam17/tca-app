const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const createConversation = catchAsync(async (req, res) => {
  const { type, participantIds, name, classId, subjectId } = req.body;
  if (['class_group', 'subject_group', 'teacher_group', 'staff_group'].includes(type) && !name) {
    throw new ApiError(400, 'Group name required');
  }
  const conv = await Conversation.create({
    type,
    participants: participantIds,
    admins: [req.user._id],
    name,
    class: classId,
    subject: subjectId,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: conv });
});

const listConversations = catchAsync(async (req, res) => {
  const rows = await Conversation.find({
    participants: req.user._id,
    isActive: true,
  })
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
  res.json({ success: true, data: rows });
});

const listMessages = catchAsync(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const conv = await Conversation.findById(req.params.id);
  if (!conv) throw new ApiError(404, 'Conversation not found');
  if (!conv.participants.map(String).includes(String(req.user._id))) {
    throw new ApiError(403, 'Not a participant');
  }
  const skip = (Number(page) - 1) * Number(limit);
  const messages = await Message.find({ conversation: conv._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('sender');
  res.json({ success: true, data: messages.reverse() });
});

const sendMessage = catchAsync(async (req, res) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) throw new ApiError(404, 'Conversation not found');
  if (!conv.participants.map(String).includes(String(req.user._id))) {
    throw new ApiError(403, 'Not a participant');
  }
  const msg = await Message.create({
    conversation: conv._id,
    sender: req.user._id,
    ...req.body,
  });
  conv.lastMessage = msg._id;
  await conv.save();
  req.app.get('io')?.to(`conv:${conv._id}`).emit('message:new', { conversationId: conv._id, message: msg });
  res.status(201).json({ success: true, data: msg });
});

const markRead = catchAsync(async (req, res) => {
  const { messageIds } = req.body;
  if (!Array.isArray(messageIds) || !messageIds.length) {
    throw new ApiError(400, 'messageIds array required');
  }
  for (const mid of messageIds) {
    // eslint-disable-next-line no-await-in-loop
    const m = await Message.findById(mid);
    if (!m || String(m.conversation) !== String(req.params.id)) continue;
    const already = m.readBy?.some((r) => String(r.user) === String(req.user._id));
    if (!already) {
      m.readBy = m.readBy || [];
      m.readBy.push({ user: req.user._id, readAt: new Date() });
      // eslint-disable-next-line no-await-in-loop
      await m.save();
    }
  }
  res.json({ success: true, message: 'Marked read' });
});

module.exports = { createConversation, listConversations, listMessages, sendMessage, markRead };
