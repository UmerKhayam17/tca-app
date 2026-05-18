const Room = require('../../models/timetable/Room');
const ApiError = require('../../utils/ApiError');
const { assertSessionWritable } = require('../session/sessionGuard');

async function listRooms({ sessionId, isActive, type }) {
  const q = {};
  if (sessionId) q.session = sessionId;
  if (isActive !== undefined) q.isActive = isActive === 'true' || isActive === true;
  if (type) q.type = type;
  return Room.find(q).sort({ code: 1 });
}

async function getRoom(id) {
  const room = await Room.findById(id);
  if (!room) throw new ApiError(404, 'Room not found');
  return room;
}

async function createRoom(body, userId) {
  await assertSessionWritable(body.session);
  return Room.create({ ...body, createdBy: userId });
}

async function updateRoom(id, body) {
  const existing = await Room.findById(id);
  if (!existing) throw new ApiError(404, 'Room not found');
  await assertSessionWritable(existing.session);
  const room = await Room.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!room) throw new ApiError(404, 'Room not found');
  return room;
}

async function deleteRoom(id) {
  const existing = await Room.findById(id);
  if (!existing) throw new ApiError(404, 'Room not found');
  await assertSessionWritable(existing.session);
  const room = await Room.findByIdAndDelete(id);
  if (!room) throw new ApiError(404, 'Room not found');
  return { deleted: true };
}

module.exports = { listRooms, getRoom, createRoom, updateRoom, deleteRoom };
