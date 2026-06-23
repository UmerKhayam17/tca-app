const ApiError = require('../../utils/ApiError');
const Session = require('../../models/Session');
const Class = require('../../models/Class');
const Section = require('../../models/Section');
const Subject = require('../../models/Subject');
const Room = require('../../models/timetable/Room');
const PeriodTemplate = require('../../models/timetable/PeriodTemplate');
const TeacherProfile = require('../../models/timetable/TeacherProfile');
const TeacherAssignment = require('../../models/timetable/TeacherAssignment');
const SubjectRequirement = require('../../models/timetable/SubjectRequirement');
const TimetableSettings = require('../../models/timetable/TimetableSettings');
const TimetableVersion = require('../../models/timetable/TimetableVersion');
const ScheduleSlot = require('../../models/timetable/ScheduleSlot');
const Student = require('../../models/Student');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySection = require('../../models/academy/AcademySection');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const { logAudit, listAuditLogs } = require('./auditService');
const { getSessionOrThrow, syncSessionFlags } = require('./sessionGuard');

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

  const newSession = await Session.create({
    name: body.name,
    startDate: body.startDate,
    endDate: body.endDate,
    workingDays: body.workingDays || source.workingDays,
    timezone: body.timezone || source.timezone,
    status: body.activate ? 'active' : 'active',
    isActive: !!body.activate,
    isClosed: false,
    clonedFrom: source._id,
    createdBy: userId,
    notes: body.notes || `Cloned structure from ${source.name}`,
  });

  if (body.activate) {
    await Session.updateMany({ _id: { $ne: newSession._id } }, { $set: { isActive: false, status: 'completed', isClosed: true } });
  }

  const targetId = newSession._id;
  const periodMap = new Map();
  const classMap = new Map();
  const sectionMap = new Map();
  const subjectMap = new Map();

  const sourcePeriods = await PeriodTemplate.find({ session: sourceSessionId });
  for (const tpl of sourcePeriods) {
    const created = await PeriodTemplate.create({
      session: targetId,
      name: tpl.name,
      slots: tpl.slots.map((s) => ({
        order: s.order,
        label: s.label,
        startTime: s.startTime,
        endTime: s.endTime,
        type: s.type,
      })),
      isDefault: tpl.isDefault,
      isActive: tpl.isActive,
      createdBy: userId,
    });
    periodMap.set(String(tpl._id), created._id);
  }

  const sourceRooms = await Room.find({ session: sourceSessionId });
  for (const room of sourceRooms) {
    await Room.create({
      session: targetId,
      name: room.name,
      code: `${room.code}-C${String(targetId).slice(-6)}`,
      capacity: room.capacity,
      type: room.type,
      equipment: room.equipment,
      isActive: room.isActive,
      createdBy: userId,
    });
  }

  const sourceClasses = await Class.find({ session: sourceSessionId });
  for (const cls of sourceClasses) {
    const newClass = await Class.create({
      name: cls.name,
      session: targetId,
      order: cls.order,
    });
    classMap.set(String(cls._id), newClass._id);

    const sections = await Section.find({ class: cls._id });
    for (const sec of sections) {
      const newSec = await Section.create({
        name: sec.name,
        class: newClass._id,
        teacher: sec.teacher,
        maxStudents: sec.maxStudents,
      });
      await Class.findByIdAndUpdate(newClass._id, { $addToSet: { sections: newSec._id } });
      sectionMap.set(String(sec._id), newSec._id);
    }

    const subjects = await Subject.find({ class: cls._id });
    for (const sub of subjects) {
      const newSub = await Subject.create({
        name: sub.name,
        code: sub.code,
        class: newClass._id,
        teacher: sub.teacher,
        totalMarks: sub.totalMarks,
        passingMarks: sub.passingMarks,
      });
      await Class.findByIdAndUpdate(newClass._id, { $addToSet: { subjects: newSub._id } });
      subjectMap.set(String(sub._id), newSub._id);
    }
  }

  const sourceProfiles = await TeacherProfile.find({ session: sourceSessionId });
  for (const profile of sourceProfiles) {
    await TeacherProfile.create({
      user: profile.user,
      session: targetId,
      subjects: profile.subjects.map((id) => subjectMap.get(String(id))).filter(Boolean),
      maxLecturesPerDay: profile.maxLecturesPerDay,
      maxLecturesPerWeek: profile.maxLecturesPerWeek,
      availability: profile.availability,
      isActive: profile.isActive,
      createdBy: userId,
    });
  }

  const sourceAssignments = await TeacherAssignment.find({ session: sourceSessionId, isActive: true });
  for (const row of sourceAssignments) {
    const newClassId = classMap.get(String(row.class));
    const newSectionId = sectionMap.get(String(row.section));
    const newSubjectId = subjectMap.get(String(row.subject));
    if (!newClassId || !newSectionId || !newSubjectId) continue;
    await TeacherAssignment.create({
      session: targetId,
      class: newClassId,
      section: newSectionId,
      subject: newSubjectId,
      teacher: row.teacher,
      isPrimary: row.isPrimary,
      priority: row.priority,
      isActive: true,
      createdBy: userId,
    });
  }

  const sourceReqs = await SubjectRequirement.find({ session: sourceSessionId, isActive: true });
  for (const req of sourceReqs) {
    const newClassId = classMap.get(String(req.class));
    const newSectionId = sectionMap.get(String(req.section));
    const newSubjectId = subjectMap.get(String(req.subject));
    if (!newClassId || !newSectionId || !newSubjectId) continue;
    await SubjectRequirement.create({
      session: targetId,
      class: newClassId,
      section: newSectionId,
      subject: newSubjectId,
      weeklyPeriods: req.weeklyPeriods,
      maxConsecutive: req.maxConsecutive,
      minGapBetween: req.minGapBetween,
      preferredDays: req.preferredDays,
      avoidFirstPeriod: req.avoidFirstPeriod,
      isLab: req.isLab,
      requiresRoomType: req.requiresRoomType,
      isActive: true,
      createdBy: userId,
    });
  }

  const sourceSettings = await TimetableSettings.findOne({ session: sourceSessionId });
  if (sourceSettings) {
    const defaultTpl = sourceSettings.defaultPeriodTemplate
      ? periodMap.get(String(sourceSettings.defaultPeriodTemplate))
      : null;
    await TimetableSettings.create({
      session: targetId,
      defaultPeriodTemplate: defaultTpl,
      defaultMaxTeacherPerDay: sourceSettings.defaultMaxTeacherPerDay,
      defaultMaxConsecutive: sourceSettings.defaultMaxConsecutive,
      allowDoublePeriods: sourceSettings.allowDoublePeriods,
      autoAssignRooms: sourceSettings.autoAssignRooms,
      conflictCheckOnDraft: sourceSettings.conflictCheckOnDraft,
      publishRequiresCompleteQuotas: sourceSettings.publishRequiresCompleteQuotas,
      gridStartDay: sourceSettings.gridStartDay,
    });
  }

  await logAudit({
    sessionId: sourceSessionId,
    action: 'SESSION_STRUCTURE_CLONED',
    userId,
    details: { targetSessionId: targetId, targetName: newSession.name },
  });
  await logAudit({
    sessionId: targetId,
    action: 'SESSION_CREATED',
    userId,
    details: { clonedFrom: sourceSessionId, sourceName: source.name },
  });

  return {
    session: newSession,
    maps: {
      classes: classMap.size,
      sections: sectionMap.size,
      subjects: subjectMap.size,
      periodTemplates: periodMap.size,
    },
  };
}

module.exports = {
  getSessionHistory,
  completeSession,
  archiveSession,
  activateSession,
  cloneSessionStructure,
};
