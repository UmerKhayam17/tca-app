const ApiError = require('../../utils/ApiError');
const AcademySection = require('../../models/academy/AcademySection');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySubject = require('../../models/academy/AcademySubject');

async function normalizeSubjects(classId, useClassSubjects, subjectIds = []) {
  if (useClassSubjects) return [];
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    throw new ApiError(400, 'Select at least one subject for section override');
  }
  const docs = await AcademySubject.find({ _id: { $in: subjectIds }, classId, status: 'active' }).select('_id');
  if (docs.length !== subjectIds.length) {
    throw new ApiError(400, 'One or more section subjects are invalid for this class');
  }
  return docs.map((d) => d._id);
}

async function listByClass(classId, { status } = {}) {
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');

  const q = { classId };
  if (status) q.status = status;

  return AcademySection.find(q)
    .populate('subjectIds', 'subjectName subjectCode status')
    .sort({ sectionName: 1 });
}

async function createSection(payload, userId) {
  const cls = await AcademyClass.findById(payload.classId);
  if (!cls) throw new ApiError(404, 'Class not found');

  const sectionName = String(payload.sectionName || '').trim();
  if (!sectionName) throw new ApiError(400, 'Section name is required');

  const dup = await AcademySection.findOne({ classId: payload.classId, sectionName });
  if (dup) throw new ApiError(409, 'Section already exists for this class');

  const useClassSubjects = payload.useClassSubjects !== false;
  const normalizedSubjectIds = await normalizeSubjects(payload.classId, useClassSubjects, payload.subjectIds);

  const doc = await AcademySection.create({
    sectionName,
    classId: payload.classId,
    useClassSubjects,
    subjectIds: normalizedSubjectIds,
    status: payload.status || 'active',
    createdBy: userId,
  });
  return doc.populate('subjectIds', 'subjectName subjectCode status');
}

async function updateSection(id, payload) {
  const doc = await AcademySection.findById(id);
  if (!doc) throw new ApiError(404, 'Section not found');

  if (payload.sectionName !== undefined) {
    const sectionName = String(payload.sectionName || '').trim();
    if (!sectionName) throw new ApiError(400, 'Section name is required');
    const dup = await AcademySection.findOne({
      _id: { $ne: id },
      classId: doc.classId,
      sectionName,
    });
    if (dup) throw new ApiError(409, 'Section already exists for this class');
    doc.sectionName = sectionName;
  }

  if (payload.status !== undefined) {
    doc.status = payload.status;
  }

  const useClassSubjects =
    payload.useClassSubjects !== undefined ? payload.useClassSubjects : doc.useClassSubjects;
  const hasSubjectsPatch = payload.subjectIds !== undefined || payload.useClassSubjects !== undefined;
  if (hasSubjectsPatch) {
    const requestedIds = payload.subjectIds !== undefined ? payload.subjectIds : doc.subjectIds;
    doc.useClassSubjects = useClassSubjects;
    doc.subjectIds = await normalizeSubjects(doc.classId, useClassSubjects, requestedIds);
  }

  await doc.save();
  return doc.populate('subjectIds', 'subjectName subjectCode status');
}

async function deleteSection(id) {
  const doc = await AcademySection.findById(id);
  if (!doc) throw new ApiError(404, 'Section not found');
  await doc.deleteOne();
  return { deleted: true };
}

module.exports = {
  listByClass,
  createSection,
  updateSection,
  deleteSection,
};
