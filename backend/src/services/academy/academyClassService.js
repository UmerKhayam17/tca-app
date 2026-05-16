const ApiError = require('../../utils/ApiError');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySubject = require('../../models/academy/AcademySubject');

async function listClasses({ status, search }) {
  const q = {};
  if (status) q.status = status;
  if (search) {
    q.className = { $regex: search.trim(), $options: 'i' };
  }
  return AcademyClass.find(q).populate('createdBy', 'name email').sort({ className: 1 });
}

async function createClass(payload, userId) {
  const exists = await AcademyClass.findOne({ className: payload.className.trim() });
  if (exists) throw new ApiError(409, 'Class name already exists');
  return AcademyClass.create({
    ...payload,
    className: payload.className.trim(),
    createdBy: userId,
  });
}

async function updateClass(id, payload) {
  const doc = await AcademyClass.findById(id);
  if (!doc) throw new ApiError(404, 'Class not found');
  if (payload.className && payload.className.trim() !== doc.className) {
    const dup = await AcademyClass.findOne({ className: payload.className.trim(), _id: { $ne: id } });
    if (dup) throw new ApiError(409, 'Class name already exists');
    doc.className = payload.className.trim();
  }
  if (payload.totalSubjects !== undefined) doc.totalSubjects = payload.totalSubjects;
  if (payload.status) doc.status = payload.status;
  await doc.save();
  return doc;
}

async function deleteClass(id) {
  const doc = await AcademyClass.findById(id);
  if (!doc) throw new ApiError(404, 'Class not found');
  const subjectCount = await AcademySubject.countDocuments({ classId: id });
  if (subjectCount > 0) {
    throw new ApiError(400, 'Cannot delete class with subjects. Remove subjects first.');
  }
  await doc.deleteOne();
  return { deleted: true };
}

async function syncSubjectCount(classId) {
  const count = await AcademySubject.countDocuments({ classId, status: 'active' });
  await AcademyClass.findByIdAndUpdate(classId, { totalSubjects: count });
}

module.exports = {
  listClasses,
  createClass,
  updateClass,
  deleteClass,
  syncSubjectCount,
};
