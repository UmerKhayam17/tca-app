const TeacherProfile = require('../../models/timetable/TeacherProfile');
const ApiError = require('../../utils/ApiError');

const populateOpts = [
  { path: 'user', select: 'name email phone isActive' },
  { path: 'subjects', select: 'name code' },
  { path: 'preferredRooms', select: 'name code type' },
];

async function listTeacherProfiles({ sessionId, isActive, userId }) {
  const q = {};
  if (sessionId) q.session = sessionId;
  if (isActive !== undefined) q.isActive = isActive === 'true' || isActive === true;
  if (userId) q.user = userId;
  return TeacherProfile.find(q).populate(populateOpts).sort({ createdAt: -1 });
}

async function getTeacherProfile(id) {
  const profile = await TeacherProfile.findById(id).populate(populateOpts);
  if (!profile) throw new ApiError(404, 'Teacher profile not found');
  return profile;
}

async function createTeacherProfile(body, userId) {
  const existing = await TeacherProfile.findOne({ user: body.user, session: body.session });
  if (existing) throw new ApiError(409, 'Teacher profile already exists for this session');
  return TeacherProfile.create({ ...body, createdBy: userId });
}

async function updateTeacherProfile(id, body) {
  const profile = await TeacherProfile.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).populate(populateOpts);
  if (!profile) throw new ApiError(404, 'Teacher profile not found');
  return profile;
}

async function deleteTeacherProfile(id) {
  const profile = await TeacherProfile.findByIdAndDelete(id);
  if (!profile) throw new ApiError(404, 'Teacher profile not found');
  return { deleted: true };
}

module.exports = {
  listTeacherProfiles,
  getTeacherProfile,
  createTeacherProfile,
  updateTeacherProfile,
  deleteTeacherProfile,
};
