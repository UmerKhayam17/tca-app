const SubjectRequirement = require('../../models/timetable/SubjectRequirement');
const ApiError = require('../../utils/ApiError');

const populateOpts = [
  { path: 'class', select: 'name' },
  { path: 'section', select: 'name' },
  { path: 'subject', select: 'name code' },
];

async function listSubjectRequirements({ sessionId, sectionId, classId }) {
  const q = { isActive: true };
  if (sessionId) q.session = sessionId;
  if (sectionId) q.section = sectionId;
  if (classId) q.class = classId;
  return SubjectRequirement.find(q).populate(populateOpts).sort({ createdAt: 1 });
}

async function getSubjectRequirement(id) {
  const row = await SubjectRequirement.findById(id).populate(populateOpts);
  if (!row) throw new ApiError(404, 'Subject requirement not found');
  return row;
}

async function createSubjectRequirement(body, userId) {
  return SubjectRequirement.create({ ...body, createdBy: userId });
}

async function updateSubjectRequirement(id, body) {
  const row = await SubjectRequirement.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).populate(populateOpts);
  if (!row) throw new ApiError(404, 'Subject requirement not found');
  return row;
}

async function deleteSubjectRequirement(id) {
  const row = await SubjectRequirement.findByIdAndDelete(id);
  if (!row) throw new ApiError(404, 'Subject requirement not found');
  return { deleted: true };
}

module.exports = {
  listSubjectRequirements,
  getSubjectRequirement,
  createSubjectRequirement,
  updateSubjectRequirement,
  deleteSubjectRequirement,
};
