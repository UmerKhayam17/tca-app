const ApiError = require('../../utils/ApiError');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademyClass = require('../../models/academy/AcademyClass');
const { syncSubjectCount } = require('./academyClassService');
const { populateCreatedBy } = require('../../utils/createdBy');

async function listByClass(classId, { status } = {}) {
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  const q = { classId };
  if (status) q.status = status;
  return populateCreatedBy(AcademySubject.find(q)).sort({ subjectName: 1 });
}

async function createSubject(payload, userId) {
  const cls = await AcademyClass.findById(payload.classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  const code = payload.subjectCode.trim().toUpperCase();
  const dup = await AcademySubject.findOne({ classId: payload.classId, subjectCode: code });
  if (dup) throw new ApiError(409, 'Subject code already exists for this class');
  const subject = await AcademySubject.create({
    subjectName: payload.subjectName.trim(),
    classId: payload.classId,
    subjectCode: code,
    status: payload.status || 'active',
    createdBy: userId,
  });
  await syncSubjectCount(payload.classId);
  return subject;
}

async function updateSubject(id, payload) {
  const doc = await AcademySubject.findById(id);
  if (!doc) throw new ApiError(404, 'Subject not found');
  if (payload.subjectName) doc.subjectName = payload.subjectName.trim();
  if (payload.subjectCode) {
    const code = payload.subjectCode.trim().toUpperCase();
    const dup = await AcademySubject.findOne({
      classId: doc.classId,
      subjectCode: code,
      _id: { $ne: id },
    });
    if (dup) throw new ApiError(409, 'Subject code already exists for this class');
    doc.subjectCode = code;
  }
  if (payload.status) doc.status = payload.status;
  await doc.save();
  await syncSubjectCount(doc.classId);
  return doc;
}

async function deleteSubject(id) {
  const doc = await AcademySubject.findById(id);
  if (!doc) throw new ApiError(404, 'Subject not found');
  const classId = doc.classId;
  await doc.deleteOne();
  await syncSubjectCount(classId);
  return { deleted: true };
}

module.exports = {
  listByClass,
  createSubject,
  updateSubject,
  deleteSubject,
};
