const ApiError = require('../../utils/ApiError');
const Session = require('../../models/Session');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySection = require('../../models/academy/AcademySection');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademySubjectChoiceGroup = require('../../models/academy/AcademySubjectChoiceGroup');
const AcademyFeeStructure = require('../../models/academy/AcademyFeeStructure');
const { assertSessionWritable, getSessionOrThrow } = require('../session/sessionGuard');
const { syncSubjectCount } = require('./academyClassService');

/**
 * Copy academy classes, sections, subjects (and optional fee structures)
 * from a source session into a target session.
 *
 * @param {string} targetSessionId - writable session receiving the copy
 * @param {object} opts
 * @param {string} opts.sourceSessionId
 * @param {string[]} [opts.classIds] - source class ids; omit/empty = all classes in source session
 * @param {boolean} [opts.includeFeeStructure=true]
 */
async function importEnrollmentFromSession(targetSessionId, opts, userId) {
  const { sourceSessionId, classIds, includeFeeStructure = true } = opts;

  if (!sourceSessionId) throw new ApiError(400, 'sourceSessionId is required');
  if (String(sourceSessionId) === String(targetSessionId)) {
    throw new ApiError(400, 'Source and target session must be different');
  }

  await assertSessionWritable(targetSessionId);
  await getSessionOrThrow(sourceSessionId);

  const sourceQuery = { sessionId: sourceSessionId };
  if (Array.isArray(classIds) && classIds.length > 0) {
    sourceQuery._id = { $in: classIds };
  }

  const sourceClasses = await AcademyClass.find(sourceQuery).sort({ className: 1 });
  if (!sourceClasses.length) {
    throw new ApiError(404, 'No classes found in the source session for this import');
  }

  const classMap = new Map();
  const subjectMap = new Map();
  const skipped = [];
  let classesCreated = 0;
  let subjectsCreated = 0;
  let sectionsCreated = 0;
  let feeStructuresCreated = 0;

  for (const srcClass of sourceClasses) {
    const existing = await AcademyClass.findOne({
      sessionId: targetSessionId,
      className: srcClass.className,
    });
    if (existing) {
      skipped.push({ className: srcClass.className, reason: 'Already exists in target session' });
      classMap.set(String(srcClass._id), existing._id);
      continue;
    }

    const newClass = await AcademyClass.create({
      sessionId: targetSessionId,
      className: srcClass.className,
      status: srcClass.status,
      totalSubjects: 0,
      createdBy: userId,
    });
    classMap.set(String(srcClass._id), newClass._id);
    classesCreated += 1;

    const sourceSubjects = await AcademySubject.find({ classId: srcClass._id }).sort({ subjectName: 1 });
    for (const sub of sourceSubjects) {
      const dupCode = await AcademySubject.findOne({
        classId: newClass._id,
        subjectCode: sub.subjectCode,
      });
      if (dupCode) {
        subjectMap.set(String(sub._id), dupCode._id);
        continue;
      }
      const createdSub = await AcademySubject.create({
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        classId: newClass._id,
        status: sub.status,
        createdBy: userId,
      });
      subjectMap.set(String(sub._id), createdSub._id);
      subjectsCreated += 1;
    }
    await syncSubjectCount(newClass._id);

    if (includeFeeStructure) {
      const feeRow = await AcademyFeeStructure.findOne({
        classId: srcClass._id,
        status: 'active',
      }).sort({ effectiveDate: -1 });
      if (feeRow) {
        const hasFee = await AcademyFeeStructure.findOne({
          classId: newClass._id,
          status: 'active',
        });
        if (!hasFee) {
          await AcademyFeeStructure.create({
            classId: newClass._id,
            perSubjectFee: feeRow.perSubjectFee,
            fullPackageFee: feeRow.fullPackageFee,
            admissionFee: feeRow.admissionFee,
            status: 'active',
            effectiveDate: new Date(),
            createdBy: userId,
          });
          feeStructuresCreated += 1;
        }
      }
    }
  }

  const sourceClassIds = sourceClasses.map((c) => c._id);
  const sourceSections = await AcademySection.find({ classId: { $in: sourceClassIds } }).sort({
    sectionName: 1,
  });

  for (const sec of sourceSections) {
    const newClassId = classMap.get(String(sec.classId));
    if (!newClassId) continue;

    const dupSec = await AcademySection.findOne({
      classId: newClassId,
      sectionName: sec.sectionName,
    });
    if (dupSec) continue;

    let useClassSubjects = sec.useClassSubjects;
    let subjectIds = [];

    if (!useClassSubjects) {
      subjectIds = (sec.subjectIds || [])
        .map((id) => subjectMap.get(String(id)))
        .filter(Boolean);
      if (subjectIds.length === 0) {
        useClassSubjects = true;
      }
    }

    await AcademySection.create({
      sectionName: sec.sectionName,
      classId: newClassId,
      useClassSubjects,
      subjectIds,
      status: sec.status,
      createdBy: userId,
    });
    sectionsCreated += 1;
  }

  const sourceChoiceGroups = await AcademySubjectChoiceGroup.find({
    classId: { $in: sourceClassIds },
    status: 'active',
  });

  for (const grp of sourceChoiceGroups) {
    const newClassId = classMap.get(String(grp.classId));
    if (!newClassId) continue;

    const mappedSubjects = (grp.subjectIds || [])
      .map((id) => subjectMap.get(String(id)))
      .filter(Boolean);
    if (mappedSubjects.length < 2) continue;

    const exists = await AcademySubjectChoiceGroup.findOne({
      classId: newClassId,
      groupName: grp.groupName,
    });
    if (exists) continue;

    await AcademySubjectChoiceGroup.create({
      classId: newClassId,
      groupName: grp.groupName,
      subjectIds: mappedSubjects,
      pickCount: grp.pickCount,
      status: grp.status,
      createdBy: userId,
    });
  }

  return {
    classes: classesCreated,
    sections: sectionsCreated,
    subjects: subjectsCreated,
    feeStructures: feeStructuresCreated,
    skipped,
    importedClassNames: sourceClasses.map((c) => c.className),
  };
}

/** Drop legacy unique index on className alone (allows same name in different sessions). */
async function ensureAcademyClassIndexes() {
  try {
    const indexes = await AcademyClass.collection.indexes();
    const legacy = indexes.find((idx) => idx.name === 'className_1');
    if (legacy) {
      await AcademyClass.collection.dropIndex('className_1');
    }
  } catch (err) {
    if (err.code !== 27 && err.codeName !== 'IndexNotFound') {
      // eslint-disable-next-line no-console
      console.warn('[academy] className_1 index drop skipped:', err.message);
    }
  }
  await AcademyClass.syncIndexes();
}

module.exports = {
  importEnrollmentFromSession,
  ensureAcademyClassIndexes,
};
