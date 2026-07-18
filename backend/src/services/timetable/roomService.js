const Room = require('../../models/timetable/Room');
const AcademyClass = require('../../models/academy/AcademyClass');
const ApiError = require('../../utils/ApiError');
const { assertSessionWritable } = require('../session/sessionGuard');

const roomPopulate = [
  { path: 'assignedClass', select: 'className sessionId' },
];

async function assertExclusiveClassAssignment(sessionId, classId, excludeRoomId) {
  if (!classId) return;
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  if (String(cls.sessionId) !== String(sessionId)) {
    throw new ApiError(400, 'Class does not belong to this session');
  }
  const q = { session: sessionId, assignedClass: classId };
  if (excludeRoomId) q._id = { $ne: excludeRoomId };
  const taken = await Room.findOne(q).select('name code');
  if (taken) {
    throw new ApiError(
      409,
      `Class is already assigned to room ${taken.code || taken.name}. Unassign it first.`
    );
  }
}

async function listRooms({ sessionId, isActive, type }) {
  const q = {};
  if (sessionId) q.session = sessionId;
  if (isActive !== undefined) q.isActive = isActive === 'true' || isActive === true;
  if (type) q.type = type;
  return Room.find(q).populate(roomPopulate).sort({ code: 1 });
}

async function getRoom(id) {
  const room = await Room.findById(id).populate(roomPopulate);
  if (!room) throw new ApiError(404, 'Room not found');
  return room;
}

async function createRoom(body, userId) {
  await assertSessionWritable(body.session);
  const assignedClass = body.assignedClass || null;
  await assertExclusiveClassAssignment(body.session, assignedClass, null);
  const room = await Room.create({
    ...body,
    assignedClass,
    createdBy: userId,
  });
  return Room.findById(room._id).populate(roomPopulate);
}

async function updateRoom(id, body) {
  const existing = await Room.findById(id);
  if (!existing) throw new ApiError(404, 'Room not found');
  await assertSessionWritable(existing.session);

  const next = { ...body };
  if (Object.prototype.hasOwnProperty.call(body, 'assignedClass')) {
    next.assignedClass = body.assignedClass || null;
    await assertExclusiveClassAssignment(existing.session, next.assignedClass, id);
  }

  const room = await Room.findByIdAndUpdate(id, next, { new: true, runValidators: true }).populate(
    roomPopulate
  );
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
