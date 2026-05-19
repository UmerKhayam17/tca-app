const ScheduleSlot = require('../../models/timetable/ScheduleSlot');
const TimetableVersion = require('../../models/timetable/TimetableVersion');
const ApiError = require('../../utils/ApiError');
const { validateSlot } = require('./timetableConflictService');
const { assertSessionWritable } = require('../session/sessionGuard');

const slotPopulate = [
  { path: 'subject', select: 'name code' },
  { path: 'teacher', select: 'name email' },
  { path: 'room', select: 'name code type' },
];

async function listSlots(timetableVersionId) {
  return ScheduleSlot.find({ timetableVersion: timetableVersionId, cancelled: { $ne: true } })
    .populate(slotPopulate)
    .sort({ day: 1 });
}

async function upsertSlot(timetableVersionId, body, { excludeSlotId } = {}) {
  const version = await TimetableVersion.findById(timetableVersionId);
  if (!version) throw new ApiError(404, 'Timetable version not found');
  if (version.status !== 'draft') {
    throw new ApiError(400, 'Can only edit slots on draft timetables');
  }
  await assertSessionWritable(version.session);

  const payload = {
    timetableVersion: timetableVersionId,
    session: version.session,
    class: version.class,
    section: version.section,
    day: body.day,
    periodId: body.periodId,
    subject: body.subject,
    teacher: body.teacher,
    room: body.room || null,
    source: body.source || 'manual',
    locked: body.locked ?? false,
    isSubstitute: body.isSubstitute ?? false,
    substituteForTeacher: body.substituteForTeacher || null,
  };

  const existing = await ScheduleSlot.findOne({
    timetableVersion: timetableVersionId,
    day: payload.day,
    periodId: payload.periodId,
  });

  const validation = await validateSlot({
    sessionId: version.session,
    timetableVersionId,
    day: payload.day,
    periodId: payload.periodId,
    subjectId: payload.subject,
    teacherId: payload.teacher,
    roomId: payload.room,
    sectionId: version.section,
    excludeSlotId: excludeSlotId || existing?._id,
  });

  if (!validation.valid) {
    const summary = validation.errors.map((e) => e.message).filter(Boolean).join('; ');
    throw new ApiError(400, summary || 'Slot validation failed', validation.errors);
  }

  if (excludeSlotId) {
    const slot = await ScheduleSlot.findByIdAndUpdate(excludeSlotId, payload, {
      new: true,
      runValidators: true,
    }).populate(slotPopulate);
    if (!slot) throw new ApiError(404, 'Schedule slot not found');
    return slot;
  }

  if (existing) {
    const slot = await ScheduleSlot.findByIdAndUpdate(existing._id, payload, {
      new: true,
      runValidators: true,
    }).populate(slotPopulate);
    return slot;
  }

  const slot = await ScheduleSlot.create(payload);
  return ScheduleSlot.findById(slot._id).populate(slotPopulate);
}

async function moveSlot(slotId, body) {
  const slot = await ScheduleSlot.findById(slotId);
  if (!slot) throw new ApiError(404, 'Schedule slot not found');
  if (slot.locked) throw new ApiError(400, 'Slot is locked and cannot be moved');

  return upsertSlot(
    slot.timetableVersion,
    {
      day: body.day ?? slot.day,
      periodId: body.periodId ?? slot.periodId,
      subject: body.subject ?? slot.subject,
      teacher: body.teacher ?? slot.teacher,
      room: body.room !== undefined ? body.room : slot.room,
      source: slot.source,
      locked: slot.locked,
    },
    { excludeSlotId: slotId }
  );
}

async function deleteSlot(slotId) {
  const slot = await ScheduleSlot.findById(slotId);
  if (!slot) throw new ApiError(404, 'Schedule slot not found');

  const version = await TimetableVersion.findById(slot.timetableVersion);
  if (version?.status !== 'draft') {
    throw new ApiError(400, 'Can only delete slots on draft timetables');
  }

  await ScheduleSlot.findByIdAndDelete(slotId);
  return { deleted: true };
}

async function getTeacherSchedule(sessionId, teacherId, { status = 'published' } = {}) {
  const versionQuery = { session: sessionId, status };
  const versions = await TimetableVersion.find(versionQuery).select('_id section class');
  const versionIds = versions.map((v) => v._id);

  const slots = await ScheduleSlot.find({
    session: sessionId,
    teacher: teacherId,
    timetableVersion: { $in: versionIds },
    cancelled: { $ne: true },
  })
    .populate(slotPopulate)
    .populate('section', 'name')
    .populate('class', 'name')
    .sort({ day: 1 });

  return { slots, versions };
}

async function getRoomSchedule(sessionId, roomId, { status = 'published' } = {}) {
  const versions = await TimetableVersion.find({ session: sessionId, status }).select('_id');
  const versionIds = versions.map((v) => v._id);

  const slots = await ScheduleSlot.find({
    session: sessionId,
    room: roomId,
    timetableVersion: { $in: versionIds },
    cancelled: { $ne: true },
  })
    .populate(slotPopulate)
    .populate('section', 'name')
    .populate('class', 'name')
    .sort({ day: 1 });

  return slots;
}

async function createSubstitution(body) {
  const version = await TimetableVersion.findOne({
    session: body.sessionId,
    section: body.sectionId,
    status: 'published',
  });
  if (!version) throw new ApiError(404, 'No published timetable for this section');

  const original = await ScheduleSlot.findOne({
    timetableVersion: version._id,
    day: body.day,
    periodId: body.periodId,
    teacher: body.originalTeacherId,
    cancelled: { $ne: true },
  });
  if (!original) throw new ApiError(404, 'Original slot not found');

  const validation = await validateSlot({
    sessionId: version.session,
    timetableVersionId: version._id,
    day: body.day,
    periodId: body.periodId,
    subjectId: original.subject,
    teacherId: body.substituteTeacherId,
    roomId: original.room,
    sectionId: version.section,
  });
  if (!validation.valid) {
    throw new ApiError(400, 'Substitution validation failed', validation.errors);
  }

  original.cancelled = true;
  await original.save();

  const slot = await ScheduleSlot.create({
    timetableVersion: version._id,
    session: version.session,
    class: version.class,
    section: version.section,
    day: body.day,
    periodId: body.periodId,
    subject: original.subject,
    teacher: body.substituteTeacherId,
    room: original.room,
    isSubstitute: true,
    substituteForTeacher: body.originalTeacherId,
    source: 'manual',
  });
  return ScheduleSlot.findById(slot._id).populate(slotPopulate);
}

module.exports = {
  listSlots,
  upsertSlot,
  moveSlot,
  deleteSlot,
  getTeacherSchedule,
  getRoomSchedule,
  createSubstitution,
};
