const ApiError = require('../../utils/ApiError');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademyClassTimetable = require('../../models/academy/AcademyClassTimetable');

async function assertClassSubject(classId, subjectId) {
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  const subject = await AcademySubject.findOne({ _id: subjectId, classId });
  if (!subject) throw new ApiError(400, 'Subject not found for this class');
  return { cls, subject };
}

async function listByClass(classId) {
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  return AcademyClassTimetable.find({ classId })
    .populate('subjectId', 'subjectName subjectCode')
    .sort({ dayOfWeek: 1, startTime: 1 })
    .lean();
}

async function createSlot(payload) {
  await assertClassSubject(payload.classId, payload.subjectId);
  try {
    const doc = await AcademyClassTimetable.create({
      classId: payload.classId,
      subjectId: payload.subjectId,
      dayOfWeek: payload.dayOfWeek,
      startTime: payload.startTime,
      endTime: payload.endTime,
      room: payload.room || '',
    });
    return AcademyClassTimetable.findById(doc._id)
      .populate('subjectId', 'subjectName subjectCode')
      .lean();
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'A slot already exists at this day and time for this subject');
    }
    throw err;
  }
}

async function updateSlot(id, payload) {
  const slot = await AcademyClassTimetable.findById(id);
  if (!slot) throw new ApiError(404, 'Timetable slot not found');
  if (payload.subjectId) {
    await assertClassSubject(slot.classId, payload.subjectId);
    slot.subjectId = payload.subjectId;
  }
  if (payload.dayOfWeek !== undefined) slot.dayOfWeek = payload.dayOfWeek;
  if (payload.startTime !== undefined) slot.startTime = payload.startTime;
  if (payload.endTime !== undefined) slot.endTime = payload.endTime;
  if (payload.room !== undefined) slot.room = payload.room;
  await slot.save();
  return AcademyClassTimetable.findById(id)
    .populate('subjectId', 'subjectName subjectCode')
    .lean();
}

async function deleteSlot(id) {
  const slot = await AcademyClassTimetable.findByIdAndDelete(id);
  if (!slot) throw new ApiError(404, 'Timetable slot not found');
  return { deleted: true };
}

module.exports = { listByClass, createSlot, updateSlot, deleteSlot };
