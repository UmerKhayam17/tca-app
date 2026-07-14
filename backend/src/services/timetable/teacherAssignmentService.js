const TeacherAssignment = require('../../models/timetable/TeacherAssignment');
const ApiError = require('../../utils/ApiError');
const { assertSessionWritable } = require('../session/sessionGuard');

function academyClassTransform(doc) {
  if (!doc) return doc;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return { ...o, name: o.className || o.name };
}

function academySectionTransform(doc) {
  if (!doc) return doc;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return { ...o, name: o.sectionName || o.name };
}

function academySubjectTransform(doc) {
  if (!doc) return doc;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return { ...o, name: o.subjectName || o.name, code: o.subjectCode || o.code };
}

const populateOpts = [
  { path: 'class', select: 'className', transform: academyClassTransform },
  { path: 'section', select: 'sectionName', transform: academySectionTransform },
  { path: 'subject', select: 'subjectName subjectCode', transform: academySubjectTransform },
  { path: 'teacher', select: 'name email' },
];

async function listTeacherAssignments({ sessionId, sectionId, classId, teacherId, subjectId }) {
  const q = { isActive: true };
  if (sessionId) q.session = sessionId;
  if (sectionId) q.section = sectionId;
  if (classId) q.class = classId;
  if (teacherId) q.teacher = teacherId;
  if (subjectId) q.subject = subjectId;
  return TeacherAssignment.find(q).populate(populateOpts).sort({ priority: 1 });
}

async function getTeacherAssignment(id) {
  const row = await TeacherAssignment.findById(id).populate(populateOpts);
  if (!row) throw new ApiError(404, 'Teacher assignment not found');
  return row;
}

async function createTeacherAssignment(body, userId) {
  await assertSessionWritable(body.session);
  return TeacherAssignment.create({ ...body, createdBy: userId });
}

async function updateTeacherAssignment(id, body) {
  const existing = await TeacherAssignment.findById(id);
  if (!existing) throw new ApiError(404, 'Teacher assignment not found');
  await assertSessionWritable(existing.session);
  const row = await TeacherAssignment.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).populate(populateOpts);
  if (!row) throw new ApiError(404, 'Teacher assignment not found');
  return row;
}

async function deleteTeacherAssignment(id) {
  const existing = await TeacherAssignment.findById(id);
  if (!existing) throw new ApiError(404, 'Teacher assignment not found');
  await assertSessionWritable(existing.session);
  const row = await TeacherAssignment.findByIdAndDelete(id);
  if (!row) throw new ApiError(404, 'Teacher assignment not found');
  return { deleted: true };
}

module.exports = {
  listTeacherAssignments,
  getTeacherAssignment,
  createTeacherAssignment,
  updateTeacherAssignment,
  deleteTeacherAssignment,
};
