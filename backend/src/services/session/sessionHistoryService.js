const ApiError = require('../../utils/ApiError');
const Session = require('../../models/Session');
const Class = require('../../models/Class');
const Section = require('../../models/Section');
const Subject = require('../../models/Subject');
const TimetableVersion = require('../../models/timetable/TimetableVersion');
const ScheduleSlot = require('../../models/timetable/ScheduleSlot');
const Student = require('../../models/Student');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySection = require('../../models/academy/AcademySection');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const { logAudit, listAuditLogs } = require('./auditService');
const { getSessionOrThrow, syncSessionFlags } = require('./sessionGuard');
const { shiftFullSessionConfiguration } = require('./sessionShiftService');

async function getAcademySessionSummary(sessionId) {
  const classes = await AcademyClass.find({ sessionId }).sort({ className: 1 }).lean();
  const classIds = classes.map((c) => c._id);
  const sections = classIds.length
    ? await AcademySection.find({ classId: { $in: classIds } })
        .sort({ sectionName: 1 })
        .lean()
    : [];
  const studentCount = classIds.length
    ? await AcademyStudent.countDocuments({ classId: { $in: classIds }, status: 'active' })
    : 0;

  const sectionsByClass = sections.reduce((acc, sec) => {
    const key = String(sec.classId);
    if (!acc[key]) acc[key] = [];
    acc[key].push({ _id: sec._id, sectionName: sec.sectionName, status: sec.status });
    return acc;
  }, {});

  return {
    classCount: classes.length,
    sectionCount: sections.length,
    studentCount,
    classes: classes.map((c) => ({
      _id: c._id,
      className: c.className,
      status: c.status,
      sections: sectionsByClass[String(c._id)] || [],
    })),
  };
}

async function getSessionHistory(sessionId) {
  const session = await getSessionOrThrow(sessionId);

  const [classes, versions, auditLogs, studentCount, academy] = await Promise.all([
    Class.find({ session: sessionId }).populate('sections').populate('subjects'),
    TimetableVersion.find({ session: sessionId })
      .populate('class', 'name')
      .populate('section', 'name')
      .sort({ section: 1, version: -1 }),
    listAuditLogs(sessionId, { limit: 200 }),
    Student.countDocuments({ session: sessionId }),
    getAcademySessionSummary(sessionId),
  ]);

  const sectionCount = classes.reduce((n, c) => n + (c.sections?.length || 0), 0);
  const slotCount = await ScheduleSlot.countDocuments({
    timetableVersion: { $in: versions.map((v) => v._id) },
  });

  const versionsByStatus = versions.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  return {
    session,
    summary: {
      classCount: classes.length,
      sectionCount,
      studentCount,
      timetableVersions: versions.length,
      scheduleSlots: slotCount,
      versionsByStatus,
    },
    academy,
    classes: classes.map((c) => ({
      _id: c._id,
      name: c.name,
      sections: (c.sections || []).map((s) => ({ _id: s._id, name: s.name })),
      subjects: (c.subjects || []).map((s) => ({ _id: s._id, name: s.name, code: s.code })),
    })),
    timetableVersions: versions,
    auditLogs,
  };
}

async function completeSession(sessionId, userId) {
  const session = await getSessionOrThrow(sessionId);
  if (session.status !== 'active') {
    throw new ApiError(400, 'Only an active session can be completed');
  }

  syncSessionFlags(session, 'completed');
  session.completedAt = new Date();
  await session.save();

  const draftResult = await TimetableVersion.updateMany(
    { session: sessionId, status: 'draft' },
    { $set: { status: 'archived', notes: 'Auto-archived when session completed' } }
  );

  await logAudit({
    sessionId,
    action: 'SESSION_COMPLETED',
    userId,
    details: {
      name: session.name,
      draftsArchived: draftResult.modifiedCount,
    },
  });

  return Session.findById(sessionId);
}

async function archiveSession(sessionId, userId) {
  const session = await getSessionOrThrow(sessionId);
  if (session.status === 'archived') {
    throw new ApiError(400, 'Session is already archived');
  }

  syncSessionFlags(session, 'archived');
  session.archivedAt = new Date();
  if (!session.completedAt) session.completedAt = new Date();
  await session.save();

  await TimetableVersion.updateMany(
    { session: sessionId, status: { $in: ['draft', 'published'] } },
    { $set: { status: 'archived' } }
  );

  await logAudit({
    sessionId,
    action: 'SESSION_ARCHIVED',
    userId,
    details: { name: session.name },
  });

  return Session.findById(sessionId);
}

async function activateSession(sessionId, userId) {
  const session = await getSessionOrThrow(sessionId);
  if (session.status === 'archived') {
    throw new ApiError(400, 'Archived sessions cannot be reactivated. Create a new session instead.');
  }
  if (session.status === 'completed' || session.isClosed) {
    throw new ApiError(400, 'Completed sessions cannot be reactivated. Create a new session or shift configuration from session history.');
  }

  await Session.updateMany({ _id: { $ne: sessionId } }, { $set: { isActive: false, status: 'completed', isClosed: true } });

  syncSessionFlags(session, 'active');
  session.archivedAt = undefined;
  await session.save();

  await logAudit({
    sessionId,
    action: 'SESSION_ACTIVATED',
    userId,
    details: { name: session.name },
  });

  return Session.findById(sessionId);
}

async function cloneSessionStructure(sourceSessionId, body, userId) {
  const source = await getSessionOrThrow(sourceSessionId);

  const name = body.name?.trim();
  if (!name) throw new ApiError(400, 'Session name is required');
  const duplicate = await Session.findOne({ name });
  if (duplicate) {
    throw new ApiError(409, `A session named "${name}" already exists`);
  }

  const newSession = await Session.create({
    name,
    startDate: body.startDate,
    endDate: body.endDate,
    workingDays: body.workingDays || source.workingDays,
    timezone: body.timezone || source.timezone,
    status: body.activate ? 'active' : 'active',
    isActive: !!body.activate,
    isClosed: false,
    clonedFrom: source._id,
    createdBy: userId,
    notes: body.notes || `Shifted configuration from ${source.name}`,
  });

  if (body.activate) {
    await Session.updateMany({ _id: { $ne: newSession._id } }, { $set: { isActive: false, status: 'completed', isClosed: true } });
  }

  syncSessionFlags(newSession, body.activate ? 'active' : 'active');
  await newSession.save();

  const shift = await shiftFullSessionConfiguration(
    newSession._id,
    { sourceSessionId, includeFeeStructure: body.includeFeeStructure !== false },
    userId
  );

  await logAudit({
    sessionId: sourceSessionId,
    action: 'SESSION_STRUCTURE_CLONED',
    userId,
    details: { targetSessionId: newSession._id, targetName: newSession.name },
  });

  return {
    session: newSession,
    shift,
    maps: {
      classes: shift.timetable.classes,
      sections: shift.timetable.sections,
      subjects: shift.timetable.subjects,
      periodTemplates: shift.timetable.periodTemplates,
    },
  };
}

module.exports = {
  getSessionHistory,
  completeSession,
  archiveSession,
  activateSession,
  cloneSessionStructure,
  shiftFullSessionConfiguration,
};
