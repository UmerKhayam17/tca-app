const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySection = require('../../models/academy/AcademySection');
const AcademySubject = require('../../models/academy/AcademySubject');
const {
  DEFAULT_ACADEMY_CLASSES,
  DEFAULT_ACADEMY_SECTIONS,
  DEFAULT_ACADEMY_SUBJECTS,
  subjectCodeForClass,
} = require('../../config/academyDefaultTemplate');
const { syncSubjectCount } = require('./academyClassService');

/**
 * Ensure every session has the standard academy classes, sections, and subjects.
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

  return { classesCreated, sectionsCreated, subjectsCreated };
}

module.exports = { ensureDefaultAcademyStructure };
