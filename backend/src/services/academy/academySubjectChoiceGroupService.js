const ApiError = require('../../utils/ApiError');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademySubjectChoiceGroup = require('../../models/academy/AcademySubjectChoiceGroup');
const { populateCreatedBy } = require('../../utils/createdBy');
const { syncSubjectCount } = require('./academyClassService');

async function assertSubjectsBelongToClass(classId, subjectIds, minCount = 1) {
  const unique = [...new Set(subjectIds.map(String))];
  if (unique.length < minCount) {
    throw new ApiError(400, `A choice group needs at least ${minCount} subject(s)`);
  }
  const docs = await AcademySubject.find({ _id: { $in: unique }, classId, status: 'active' }).select('_id');
  if (docs.length !== unique.length) {
    throw new ApiError(400, 'All subjects must belong to this class and be active');
  }
  return unique;
}

async function assertNoOverlap(classId, subjectIds, excludeGroupId) {
  const q = { classId, status: 'active', subjectIds: { $in: subjectIds } };
  if (excludeGroupId) q._id = { $ne: excludeGroupId };
  const overlap = await AcademySubjectChoiceGroup.findOne(q).select('groupName');
  if (overlap) {
    throw new ApiError(409, `A subject is already in choice group "${overlap.groupName}"`);
  }
}

async function listByClass(classId) {
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  return populateCreatedBy(
    AcademySubjectChoiceGroup.find({ classId })
      .populate('subjectIds', 'subjectName subjectCode status')
      .sort({ groupName: 1 })
  );
}

async function createGroup(payload, userId) {
  const cls = await AcademyClass.findById(payload.classId);
  if (!cls) throw new ApiError(404, 'Class not found');

  const minSubjects = payload.minSubjects ?? 2;
  const subjectIds = await assertSubjectsBelongToClass(payload.classId, payload.subjectIds, minSubjects);
  await assertNoOverlap(payload.classId, subjectIds);

  const pickCount = payload.pickCount ?? 1;
  if (pickCount > subjectIds.length) {
    throw new ApiError(400, 'pickCount cannot exceed number of subjects in the group');
  }

  const doc = await AcademySubjectChoiceGroup.create({
    classId: payload.classId,
    groupName: payload.groupName.trim(),
    subjectIds,
    pickCount,
    status: payload.status || 'active',
    createdBy: userId,
  });

  return doc.populate('subjectIds', 'subjectName subjectCode status');
}

async function updateGroup(id, payload) {
  const doc = await AcademySubjectChoiceGroup.findById(id);
  if (!doc) throw new ApiError(404, 'Choice group not found');

  if (payload.groupName) doc.groupName = payload.groupName.trim();
  if (payload.status) doc.status = payload.status;

  if (payload.subjectIds) {
    const subjectIds = await assertSubjectsBelongToClass(doc.classId, payload.subjectIds, 2);
    await assertNoOverlap(doc.classId, subjectIds, doc._id);
    doc.subjectIds = subjectIds;
  }

  const pickCount = payload.pickCount ?? doc.pickCount;
  if (pickCount > doc.subjectIds.length) {
    throw new ApiError(400, 'pickCount cannot exceed number of subjects in the group');
  }
  doc.pickCount = pickCount;

  await doc.save();
  return doc.populate('subjectIds', 'subjectName subjectCode status');
}

async function deleteGroup(id) {
  const doc = await AcademySubjectChoiceGroup.findById(id);
  if (!doc) throw new ApiError(404, 'Choice group not found');
  await doc.deleteOne();
  return { deleted: true };
}

async function removeSubjectFromGroups(subjectId) {
  await AcademySubjectChoiceGroup.updateMany(
    { subjectIds: subjectId },
    { $pull: { subjectIds: subjectId } }
  );
  await AcademySubjectChoiceGroup.deleteMany({ subjectIds: { $size: 0 } });
}

async function findGroupForSubject(subjectId) {
  return AcademySubjectChoiceGroup.findOne({ subjectIds: subjectId }).populate(
    'subjectIds',
    'subjectName subjectCode status'
  );
}

async function assignSubjectToGroup(classId, subjectId, opts, userId) {
  const { groupId, groupName, pickCount = 1 } = opts;

  await assertNoOverlap(classId, [subjectId]);

  if (groupId) {
    const group = await AcademySubjectChoiceGroup.findOne({ _id: groupId, classId });
    if (!group) throw new ApiError(404, 'Choice group not found');
    if (!group.subjectIds.some((id) => String(id) === String(subjectId))) {
      group.subjectIds.push(subjectId);
      if (pickCount > group.subjectIds.length) {
        throw new ApiError(400, 'pickCount cannot exceed number of subjects in the group');
      }
      group.pickCount = pickCount;
      await group.save();
    }
    return group.populate('subjectIds', 'subjectName subjectCode status');
  }

  const trimmedName = (groupName || '').trim();
  if (!trimmedName) {
    throw new ApiError(400, 'Choice group name is required for student-choice subjects');
  }

  const existing = await AcademySubjectChoiceGroup.findOne({ classId, groupName: trimmedName });
  if (existing) {
    if (!existing.subjectIds.some((id) => String(id) === String(subjectId))) {
      existing.subjectIds.push(subjectId);
      if (pickCount > existing.subjectIds.length) {
        throw new ApiError(400, 'pickCount cannot exceed number of subjects in the group');
      }
      existing.pickCount = pickCount;
      await existing.save();
    }
    return existing.populate('subjectIds', 'subjectName subjectCode status');
  }

  return createGroup(
    {
      classId,
      groupName: trimmedName,
      subjectIds: [subjectId],
      pickCount,
      minSubjects: 1,
    },
    userId
  );
}

async function createGroupWithSubjects(classId, payload, userId) {
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');

  const groupName = payload.groupName?.trim();
  if (!groupName) throw new ApiError(400, 'Group name is required');

  const rows = payload.subjects || [];
  if (rows.length < 2) throw new ApiError(400, 'At least 2 subjects are required in a group');
  if (rows.length > 10) throw new ApiError(400, 'Maximum 10 subjects per group');

  const nameTaken = await AcademySubjectChoiceGroup.findOne({ classId, groupName });
  if (nameTaken) throw new ApiError(409, 'A group with this name already exists');

  const createdIds = [];
  const codes = new Set();

  for (const row of rows) {
    const subjectName = row.subjectName?.trim();
    const subjectCode = row.subjectCode?.trim().toUpperCase();
    if (!subjectName || !subjectCode) {
      throw new ApiError(400, 'Each subject must have a name and code');
    }
    if (codes.has(subjectCode)) {
      throw new ApiError(400, `Duplicate subject code in group: ${subjectCode}`);
    }
    codes.add(subjectCode);

    const dup = await AcademySubject.findOne({ classId, subjectCode });
    if (dup) throw new ApiError(409, `Subject code already exists for this class: ${subjectCode}`);

    const doc = await AcademySubject.create({
      subjectName,
      classId,
      subjectCode,
      status: 'active',
      createdBy: userId,
    });
    createdIds.push(doc._id);
  }

  await assertNoOverlap(classId, createdIds);

  const pickCount = payload.pickCount ?? 1;
  if (pickCount > createdIds.length) {
    throw new ApiError(400, 'pickCount cannot exceed number of subjects in the group');
  }

  const group = await AcademySubjectChoiceGroup.create({
    classId,
    groupName,
    subjectIds: createdIds,
    pickCount,
    status: 'active',
    createdBy: userId,
  });

  await syncSubjectCount(classId);
  return group.populate('subjectIds', 'subjectName subjectCode status');
}

async function syncSubjectEnrollment(classId, subjectId, payload, userId) {
  if (payload.enrollmentType === 'required' || payload.enrollmentType === undefined) {
    if (payload.enrollmentType === 'required') {
      await removeSubjectFromGroups(subjectId);
    }
    return null;
  }

  if (payload.enrollmentType !== 'choice') {
    return null;
  }

  await removeSubjectFromGroups(subjectId);
  return assignSubjectToGroup(
    classId,
    subjectId,
    {
      groupId: payload.choiceGroupId,
      groupName: payload.choiceGroupName,
      pickCount: payload.pickCount ?? 1,
    },
    userId
  );
}

module.exports = {
  listByClass,
  createGroup,
  updateGroup,
  deleteGroup,
  removeSubjectFromGroups,
  findGroupForSubject,
  assignSubjectToGroup,
  syncSubjectEnrollment,
  createGroupWithSubjects,
};
