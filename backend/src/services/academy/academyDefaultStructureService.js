const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySection = require('../../models/academy/AcademySection');
const AcademySubject = require('../../models/academy/AcademySubject');
const Class = require('../../models/Class');
const Section = require('../../models/Section');
const Subject = require('../../models/Subject');
const {
  DEFAULT_ACADEMY_CLASSES,
  DEFAULT_ACADEMY_SECTIONS,
  DEFAULT_ACADEMY_SUBJECTS,
  subjectCodeForClass,
} = require('../../config/academyDefaultTemplate');
const { syncSubjectCount } = require('./academyClassService');

/**
 * Mirror Academy classes / sections / subjects into timetable Class / Section / Subject
 * so Timetable Builder, View, Assignments, and Requirements can resolve dropdowns.
 * Idempotent — matches by name (and subject code) within the session.
 */
async function syncAcademyToTimetableStructure(sessionId, userId) {
  if (!sessionId) {
    return { classesSynced: 0, sectionsSynced: 0, subjectsSynced: 0 };
  }

  const academyClasses = await AcademyClass.find({ sessionId }).sort({ className: 1 });
  let classesSynced = 0;
  let sectionsSynced = 0;
  let subjectsSynced = 0;

  for (const academyClass of academyClasses) {
    let timetableClass = await Class.findOne({ session: sessionId, name: academyClass.className });
    if (!timetableClass) {
      timetableClass = await Class.create({
        name: academyClass.className,
        session: sessionId,
        sections: [],
        subjects: [],
        order: 0,
        createdBy: userId,
      });
      classesSynced += 1;
    }

    const academySections = await AcademySection.find({ classId: academyClass._id }).sort({ sectionName: 1 });
    for (const academySection of academySections) {
      let section = await Section.findOne({ class: timetableClass._id, name: academySection.sectionName });
      if (!section) {
        section = await Section.create({
          name: academySection.sectionName,
          class: timetableClass._id,
          maxStudents: 40,
          createdBy: userId,
        });
        sectionsSynced += 1;
      }
      if (!timetableClass.sections.some((id) => String(id) === String(section._id))) {
        timetableClass.sections.push(section._id);
      }
    }

    const academySubjects = await AcademySubject.find({
      classId: academyClass._id,
      status: 'active',
    }).sort({ subjectName: 1 });

    for (const academySubject of academySubjects) {
      const code = String(academySubject.subjectCode || academySubject.subjectName)
        .trim()
        .toUpperCase();
      let subject = await Subject.findOne({ class: timetableClass._id, code });
      if (!subject) {
        subject = await Subject.findOne({
          class: timetableClass._id,
          name: academySubject.subjectName,
        });
      }
      if (!subject) {
        subject = await Subject.create({
          name: academySubject.subjectName,
          code,
          class: timetableClass._id,
          createdBy: userId,
        });
        subjectsSynced += 1;
      }
      if (!timetableClass.subjects.some((id) => String(id) === String(subject._id))) {
        timetableClass.subjects.push(subject._id);
      }
    }

    await timetableClass.save();
  }

  return { classesSynced, sectionsSynced, subjectsSynced };
}

/**
 * Ensure every session has the standard academy classes, sections, and subjects,
 * then mirror them into timetable Class / Section / Subject.
 * Idempotent — skips records that already exist.
 */
async function ensureDefaultAcademyStructure(sessionId, userId) {
  let classesCreated = 0;
  let sectionsCreated = 0;
  let subjectsCreated = 0;

  for (const className of DEFAULT_ACADEMY_CLASSES) {
    let cls = await AcademyClass.findOne({ sessionId, className });
    if (!cls) {
      cls = await AcademyClass.create({
        sessionId,
        className,
        status: 'active',
        totalSubjects: 0,
        createdBy: userId,
      });
      classesCreated += 1;
    }

    for (const sectionName of DEFAULT_ACADEMY_SECTIONS) {
      const sectionExists = await AcademySection.findOne({ classId: cls._id, sectionName });
      if (!sectionExists) {
        await AcademySection.create({
          sectionName,
          classId: cls._id,
          useClassSubjects: true,
          subjectIds: [],
          status: 'active',
          createdBy: userId,
        });
        sectionsCreated += 1;
      }
    }

    for (const template of DEFAULT_ACADEMY_SUBJECTS) {
      const subjectCode = subjectCodeForClass(className, template.codeSuffix);
      const exists = await AcademySubject.findOne({ classId: cls._id, subjectCode });
      if (exists) continue;

      await AcademySubject.create({
        subjectName: template.subjectName,
        subjectCode,
        classId: cls._id,
        status: 'active',
        createdBy: userId,
      });
      subjectsCreated += 1;
    }

    await syncSubjectCount(cls._id);
  }

  const timetableSync = await syncAcademyToTimetableStructure(sessionId, userId);

  return {
    classesCreated,
    sectionsCreated,
    subjectsCreated,
    timetableSync,
  };
}

module.exports = {
  ensureDefaultAcademyStructure,
  syncAcademyToTimetableStructure,
};
