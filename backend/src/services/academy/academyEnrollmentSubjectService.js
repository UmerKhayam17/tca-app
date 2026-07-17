const ApiError = require('../../utils/ApiError');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademySection = require('../../models/academy/AcademySection');
const AcademyClass = require('../../models/academy/AcademyClass');

async function getAllowedSubjects(classId, sectionId, status = 'active') {
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');

  const q = { classId };
  if (status) q.status = status;

  if (sectionId) {
    const section = await AcademySection.findById(sectionId);
    if (!section) throw new ApiError(404, 'Section not found');
    if (String(section.classId) !== String(classId)) {
      throw new ApiError(400, 'Section does not belong to this class');
    }
    if (!section.useClassSubjects) {
      q._id = { $in: section.subjectIds };
    }
  }

  return AcademySubject.find(q).sort({ subjectName: 1 });
}

/** Build choice groups from subjects that share choiceGroupName. */
function buildChoiceGroupsFromSubjects(subjects) {
  const byGroup = new Map();

  for (const sub of subjects) {
    if (sub.enrollmentType !== 'choice') continue;
    const groupName = String(sub.choiceGroupName || '').trim();
    if (!groupName) continue;
    const key = groupName.toLowerCase();
    if (!byGroup.has(key)) {
      byGroup.set(key, {
        _id: groupName,
        groupName,
        pickCount: Math.max(1, Number(sub.pickCount) || 1),
        subjects: [],
      });
    }
    const group = byGroup.get(key);
    group.subjects.push(sub);
    group.pickCount = Math.max(group.pickCount, Math.max(1, Number(sub.pickCount) || 1));
  }

  return [...byGroup.values()]
    .filter((g) => g.subjects.length >= 2)
    .sort((a, b) => a.groupName.localeCompare(b.groupName));
}

async function getEnrollmentLayout(classId, sectionId) {
  const subjects = await getAllowedSubjects(classId, sectionId, 'active');
  const choiceGroups = buildChoiceGroupsFromSubjects(subjects);
  const groupedIds = new Set(choiceGroups.flatMap((g) => g.subjects.map((s) => String(s._id))));
  const coreSubjects = subjects.filter((s) => !groupedIds.has(String(s._id)));

  return {
    hasChoiceGroups: choiceGroups.length > 0,
    coreSubjects,
    choiceGroups,
  };
}

async function validateEnrollmentSubjects(classId, sectionId, selectedSubjectIds, isFullPackage) {
  const layout = await getEnrollmentLayout(classId, sectionId);
  const selected = (selectedSubjectIds || []).map(String);

  if (isFullPackage) {
    if (!layout.hasChoiceGroups) {
      return layout.coreSubjects.map((s) => s._id);
    }

    const result = layout.coreSubjects.map((s) => s._id);

    for (const group of layout.choiceGroups) {
      const groupIds = group.subjects.map((s) => String(s._id));
      const picks = selected.filter((id) => groupIds.includes(id));
      if (picks.length !== group.pickCount) {
        throw new ApiError(
          400,
          `Select exactly ${group.pickCount} subject(s) from "${group.groupName}"`
        );
      }
      if (new Set(picks).size !== picks.length) {
        throw new ApiError(400, `Duplicate selection in "${group.groupName}"`);
      }
      picks.forEach((id) => {
        const sub = group.subjects.find((s) => String(s._id) === id);
        if (sub) result.push(sub._id);
      });
    }

    return result;
  }

  if (!layout.hasChoiceGroups) {
    if (!selected.length) throw new ApiError(400, 'Select at least one subject or full package');
    const allowed = new Set(layout.coreSubjects.map((s) => String(s._id)));
    if (!selected.every((id) => allowed.has(id))) {
      throw new ApiError(400, 'One or more subjects are invalid for this class/section');
    }
    return layout.coreSubjects.filter((s) => selected.includes(String(s._id))).map((s) => s._id);
  }

  const coreIds = layout.coreSubjects.map((s) => String(s._id));
  const result = [];

  const corePicks = selected.filter((id) => coreIds.includes(id));
  if (new Set(corePicks).size !== corePicks.length) {
    throw new ApiError(400, 'Duplicate subject selection');
  }
  result.push(...corePicks);

  for (const group of layout.choiceGroups) {
    const groupIds = group.subjects.map((s) => String(s._id));
    const picks = selected.filter((id) => groupIds.includes(id));
    if (picks.length > group.pickCount) {
      throw new ApiError(
        400,
        `Select at most ${group.pickCount} subject(s) from "${group.groupName}"`
      );
    }
    if (picks.length > 0 && picks.length !== group.pickCount) {
      throw new ApiError(
        400,
        `Select exactly ${group.pickCount} subject(s) from "${group.groupName}"`
      );
    }
    if (new Set(picks).size !== picks.length) {
      throw new ApiError(400, `Duplicate selection in "${group.groupName}"`);
    }
    result.push(...picks);
  }

  const allowed = new Set([
    ...coreIds,
    ...layout.choiceGroups.flatMap((g) => g.subjects.map((s) => String(s._id))),
  ]);

  if (!selected.length) {
    throw new ApiError(400, 'Select at least one subject or full package');
  }

  if (selected.length !== result.length || !selected.every((id) => allowed.has(id))) {
    throw new ApiError(400, 'Invalid subject selection for this class');
  }

  const allSubjects = [...layout.coreSubjects, ...layout.choiceGroups.flatMap((g) => g.subjects)];
  return result.map((id) => {
    const sub = allSubjects.find((s) => String(s._id) === id);
    if (!sub) throw new ApiError(400, 'Invalid subject selection');
    return sub._id;
  });
}

module.exports = {
  getAllowedSubjects,
  getEnrollmentLayout,
  validateEnrollmentSubjects,
  buildChoiceGroupsFromSubjects,
};
