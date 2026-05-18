const TimetableVersion = require('../../models/timetable/TimetableVersion');
const ScheduleSlot = require('../../models/timetable/ScheduleSlot');
const SubjectRequirement = require('../../models/timetable/SubjectRequirement');
const PeriodTemplate = require('../../models/timetable/PeriodTemplate');
const Session = require('../../models/Session');
const ApiError = require('../../utils/ApiError');
const { validateVersion } = require('./timetableConflictService');
const { assertSessionWritable } = require('../session/sessionGuard');
const { logAudit } = require('../session/auditService');

const versionPopulate = [
  { path: 'class', select: 'name' },
  { path: 'section', select: 'name' },
  { path: 'session', select: 'name workingDays' },
  { path: 'periodTemplate' },
  { path: 'publishedBy', select: 'name' },
];

async function listVersions({ sessionId, sectionId, classId, status }) {
  const q = {};
  if (sessionId) q.session = sessionId;
  if (sectionId) q.section = sectionId;
  if (classId) q.class = classId;
  if (status) q.status = status;
  return TimetableVersion.find(q).populate(versionPopulate).sort({ version: -1, createdAt: -1 });
}

async function getVersion(id) {
  const version = await TimetableVersion.findById(id).populate(versionPopulate);
  if (!version) throw new ApiError(404, 'Timetable version not found');
  return version;
}

async function getPublishedVersion(sessionId, sectionId) {
  return TimetableVersion.findOne({
    session: sessionId,
    section: sectionId,
    status: 'published',
  }).populate(versionPopulate);
}

async function createVersion(body, userId) {
  await assertSessionWritable(body.session);
  const last = await TimetableVersion.findOne({
    session: body.session,
    section: body.section,
  })
    .sort({ version: -1 })
    .select('version');

  const version = await TimetableVersion.create({
    ...body,
    version: (last?.version || 0) + 1,
    status: 'draft',
    createdBy: userId,
  });
  return TimetableVersion.findById(version._id).populate(versionPopulate);
}

async function duplicateVersion(id, userId) {
  const source = await TimetableVersion.findById(id);
  if (!source) throw new ApiError(404, 'Timetable version not found');

  const last = await TimetableVersion.findOne({
    session: source.session,
    section: source.section,
  })
    .sort({ version: -1 })
    .select('version');

  const newVersion = await TimetableVersion.create({
    session: source.session,
    class: source.class,
    section: source.section,
    periodTemplate: source.periodTemplate,
    version: (last?.version || 0) + 1,
    status: 'draft',
    effectiveFrom: source.effectiveFrom,
    notes: `Duplicated from v${source.version}`,
    createdBy: userId,
  });

  const slots = await ScheduleSlot.find({ timetableVersion: source._id });
  if (slots.length) {
    await ScheduleSlot.insertMany(
      slots.map((s) => ({
        timetableVersion: newVersion._id,
        session: s.session,
        class: s.class,
        section: s.section,
        day: s.day,
        periodId: s.periodId,
        subject: s.subject,
        teacher: s.teacher,
        room: s.room,
        source: s.source,
        locked: s.locked,
      }))
    );
  }

  return TimetableVersion.findById(newVersion._id).populate(versionPopulate);
}

async function getVersionGrid(id) {
  const version = await getVersion(id);
  const slots = await ScheduleSlot.find({ timetableVersion: id, cancelled: { $ne: true } })
    .populate('subject', 'name code')
    .populate('teacher', 'name email')
    .populate('room', 'name code type');

  const requirements = await SubjectRequirement.find({
    session: version.session._id || version.session,
    section: version.section._id || version.section,
    isActive: true,
  }).populate('subject', 'name code');

  const quotaProgress = requirements.map((req) => {
    const actual = slots.filter((s) => String(s.subject._id || s.subject) === String(req.subject._id || req.subject)).length;
    return {
      subject: req.subject,
      required: req.weeklyPeriods,
      actual,
      complete: actual >= req.weeklyPeriods,
    };
  });

  const session = await Session.findById(version.session._id || version.session);
  const template = version.periodTemplate;

  return {
    version,
    workingDays: session?.workingDays || [],
    periods: template?.slots || [],
    slots,
    quotaProgress,
  };
}

async function publishVersion(id, userId) {
  const version = await TimetableVersion.findById(id);
  if (!version) throw new ApiError(404, 'Timetable version not found');
  await assertSessionWritable(version.session);
  if (version.status === 'published') throw new ApiError(400, 'Version is already published');
  if (version.status === 'archived') throw new ApiError(400, 'Cannot publish an archived version');

  const validation = await validateVersion(id, { forPublish: true });
  if (!validation.valid) {
    throw new ApiError(400, 'Timetable has validation errors', validation.errors);
  }

  await TimetableVersion.updateMany(
    { session: version.session, section: version.section, status: 'published' },
    { $set: { status: 'archived' } }
  );

  version.status = 'published';
  version.publishedAt = new Date();
  version.publishedBy = userId;
  if (!version.effectiveFrom) version.effectiveFrom = new Date();
  await version.save();

  await logAudit({
    sessionId: version.session,
    action: 'TIMETABLE_PUBLISHED',
    userId,
    entityType: 'TimetableVersion',
    entityId: version._id,
    details: { version: version.version, sectionId: String(version.section) },
  });

  return TimetableVersion.findById(id).populate(versionPopulate);
}

async function archiveVersion(id) {
  const version = await TimetableVersion.findByIdAndUpdate(
    id,
    { status: 'archived' },
    { new: true }
  ).populate(versionPopulate);
  if (!version) throw new ApiError(404, 'Timetable version not found');
  return version;
}

async function deleteVersion(id) {
  const version = await TimetableVersion.findById(id);
  if (!version) throw new ApiError(404, 'Timetable version not found');
  if (version.status === 'published') {
    throw new ApiError(400, 'Cannot delete a published timetable. Archive it first.');
  }
  await ScheduleSlot.deleteMany({ timetableVersion: id });
  await TimetableVersion.findByIdAndDelete(id);
  return { deleted: true };
}

module.exports = {
  listVersions,
  getVersion,
  getPublishedVersion,
  createVersion,
  duplicateVersion,
  getVersionGrid,
  publishVersion,
  archiveVersion,
  deleteVersion,
};
