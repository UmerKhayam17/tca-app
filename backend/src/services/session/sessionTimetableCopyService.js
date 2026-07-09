const Class = require('../../models/Class');
const Section = require('../../models/Section');
const Subject = require('../../models/Subject');
const Room = require('../../models/timetable/Room');
const PeriodTemplate = require('../../models/timetable/PeriodTemplate');
const TeacherProfile = require('../../models/timetable/TeacherProfile');
const TeacherAssignment = require('../../models/timetable/TeacherAssignment');
const SubjectRequirement = require('../../models/timetable/SubjectRequirement');
const TimetableSettings = require('../../models/timetable/TimetableSettings');
const { assertSessionWritable } = require('./sessionGuard');

/**
 * Copy timetable setup (periods, rooms, legacy classes/sections/subjects,
 * teacher profiles, assignments, requirements, settings) between sessions.
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

  const sourceClasses = await Class.find({ session: sourceSessionId });
  for (const cls of sourceClasses) {
    let newClass = await Class.findOne({ session: targetSessionId, name: cls.name });
    if (!newClass) {
      newClass = await Class.create({
        name: cls.name,
        session: targetSessionId,
        order: cls.order,
        createdBy: userId,
      });
    }
    classMap.set(String(cls._id), newClass._id);

    const sections = await Section.find({ class: cls._id });
    for (const sec of sections) {
      let newSec = await Section.findOne({ class: newClass._id, name: sec.name });
      if (!newSec) {
        newSec = await Section.create({
          name: sec.name,
          class: newClass._id,
          teacher: sec.teacher,
          maxStudents: sec.maxStudents,
        });
        await Class.findByIdAndUpdate(newClass._id, { $addToSet: { sections: newSec._id } });
      }
      sectionMap.set(String(sec._id), newSec._id);
    }

    const subjects = await Subject.find({ class: cls._id });
    for (const sub of subjects) {
      let newSub = await Subject.findOne({ class: newClass._id, code: sub.code });
      if (!newSub) {
        newSub = await Subject.create({
          name: sub.name,
          code: sub.code,
          class: newClass._id,
          teacher: sub.teacher,
          totalMarks: sub.totalMarks,
          passingMarks: sub.passingMarks,
        });
        await Class.findByIdAndUpdate(newClass._id, { $addToSet: { subjects: newSub._id } });
      }
      subjectMap.set(String(sub._id), newSub._id);
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

  const sourceReqs = await SubjectRequirement.find({ session: sourceSessionId, isActive: true });
  for (const req of sourceReqs) {
    const newClassId = classMap.get(String(req.class));
    const newSectionId = sectionMap.get(String(req.section));
    const newSubjectId = subjectMap.get(String(req.subject));
    if (!newClassId || !newSectionId || !newSubjectId) continue;

    const dup = await SubjectRequirement.findOne({
      session: targetSessionId,
      section: newSectionId,
      subject: newSubjectId,
    });
    if (dup) continue;

    await SubjectRequirement.create({
      session: targetSessionId,
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
