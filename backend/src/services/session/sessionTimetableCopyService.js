const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySection = require('../../models/academy/AcademySection');
const AcademySubject = require('../../models/academy/AcademySubject');
const Room = require('../../models/timetable/Room');
const PeriodTemplate = require('../../models/timetable/PeriodTemplate');
const TeacherProfile = require('../../models/timetable/TeacherProfile');
const TeacherAssignment = require('../../models/timetable/TeacherAssignment');
const TimetableSettings = require('../../models/timetable/TimetableSettings');
const { assertSessionWritable } = require('./sessionGuard');

/**
 * Copy timetable setup (periods, rooms, academy classes/sections/subjects,
 * teacher profiles, assignments, settings) between sessions.
 */
async function copyTimetableSetupBetweenSessions(sourceSessionId, targetSessionId, userId) {
  await assertSessionWritable(targetSessionId);

  const periodMap = new Map();
  const classMap = new Map();
  const sectionMap = new Map();
  const subjectMap = new Map();

  const sourcePeriods = await PeriodTemplate.find({ session: sourceSessionId });
  for (const tpl of sourcePeriods) {
    const existing = await PeriodTemplate.findOne({ session: targetSessionId, name: tpl.name });
    if (existing) {
      periodMap.set(String(tpl._id), existing._id);
      continue;
    }
    const created = await PeriodTemplate.create({
      session: targetSessionId,
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
    const dup = await Room.findOne({ session: targetSessionId, code: room.code });
    if (dup) continue;
    await Room.create({
      session: targetSessionId,
      name: room.name,
      code: room.code,
      capacity: room.capacity,
      type: room.type,
      equipment: room.equipment,
      isActive: room.isActive,
      createdBy: userId,
    });
  }

  const sourceClasses = await AcademyClass.find({ sessionId: sourceSessionId });
  for (const cls of sourceClasses) {
    let newClass = await AcademyClass.findOne({ sessionId: targetSessionId, className: cls.className });
    if (!newClass) {
      newClass = await AcademyClass.create({
        className: cls.className,
        sessionId: targetSessionId,
        totalSubjects: cls.totalSubjects,
        status: cls.status || 'active',
        createdBy: userId,
      });
    }
    classMap.set(String(cls._id), newClass._id);

    const sections = await AcademySection.find({ classId: cls._id });
    for (const sec of sections) {
      let newSec = await AcademySection.findOne({ classId: newClass._id, sectionName: sec.sectionName });
      if (!newSec) {
        newSec = await AcademySection.create({
          sectionName: sec.sectionName,
          classId: newClass._id,
          useClassSubjects: sec.useClassSubjects !== false,
          subjectIds: [],
          status: sec.status || 'active',
          createdBy: userId,
        });
      }
      sectionMap.set(String(sec._id), newSec._id);
    }

    const subjects = await AcademySubject.find({ classId: cls._id });
    for (const sub of subjects) {
      let newSub = await AcademySubject.findOne({ classId: newClass._id, subjectCode: sub.subjectCode });
      if (!newSub) {
        newSub = await AcademySubject.create({
          subjectName: sub.subjectName,
          subjectCode: sub.subjectCode,
          classId: newClass._id,
          status: sub.status || 'active',
          createdBy: userId,
        });
      }
      subjectMap.set(String(sub._id), newSub._id);
    }

    // Remap section subject overrides after subjects exist
    for (const sec of sections) {
      const newSecId = sectionMap.get(String(sec._id));
      if (!newSecId || sec.useClassSubjects !== false) continue;
      const mappedIds = (sec.subjectIds || []).map((id) => subjectMap.get(String(id))).filter(Boolean);
      await AcademySection.findByIdAndUpdate(newSecId, {
        useClassSubjects: false,
        subjectIds: mappedIds,
      });
    }
  }

  const sourceProfiles = await TeacherProfile.find({ session: sourceSessionId });
  for (const profile of sourceProfiles) {
    const mappedSubjects = profile.subjects
      .map((id) => subjectMap.get(String(id)))
      .filter(Boolean);
    const exists = await TeacherProfile.findOne({ user: profile.user, session: targetSessionId });
    if (exists) {
      exists.subjects = [...new Set([...exists.subjects.map(String), ...mappedSubjects.map(String)])];
      exists.maxLecturesPerDay = profile.maxLecturesPerDay;
      exists.maxLecturesPerWeek = profile.maxLecturesPerWeek;
      exists.availability = profile.availability;
      exists.isActive = profile.isActive;
      await exists.save();
      continue;
    }
    await TeacherProfile.create({
      user: profile.user,
      session: targetSessionId,
      subjects: mappedSubjects,
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

    const dup = await TeacherAssignment.findOne({
      session: targetSessionId,
      class: newClassId,
      section: newSectionId,
      subject: newSubjectId,
      teacher: row.teacher,
    });
    if (dup) continue;

    await TeacherAssignment.create({
      session: targetSessionId,
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

  const sourceSettings = await TimetableSettings.findOne({ session: sourceSessionId });
  if (sourceSettings) {
    const defaultTpl = sourceSettings.defaultPeriodTemplate
      ? periodMap.get(String(sourceSettings.defaultPeriodTemplate))
      : null;
    const existing = await TimetableSettings.findOne({ session: targetSessionId });
    const payload = {
      defaultPeriodTemplate: defaultTpl,
      defaultMaxTeacherPerDay: sourceSettings.defaultMaxTeacherPerDay,
      defaultMaxConsecutive: sourceSettings.defaultMaxConsecutive,
      allowDoublePeriods: sourceSettings.allowDoublePeriods,
      autoAssignRooms: sourceSettings.autoAssignRooms,
      conflictCheckOnDraft: sourceSettings.conflictCheckOnDraft,
      publishRequiresCompleteQuotas: sourceSettings.publishRequiresCompleteQuotas,
      gridStartDay: sourceSettings.gridStartDay,
    };
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
    } else {
      await TimetableSettings.create({ session: targetSessionId, ...payload });
    }
  }

  return {
    periodTemplates: periodMap.size,
    classes: classMap.size,
    sections: sectionMap.size,
    subjects: subjectMap.size,
  };
}

module.exports = { copyTimetableSetupBetweenSessions };
