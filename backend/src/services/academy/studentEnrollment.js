/** Subject IDs the student is enrolled in. */
function selectedSubjectIds(student) {
  return (student.selectedSubjects || []).map((s) => String(s._id || s));
}

/** Student takes at least one subject (full package or explicit selection). */
function hasAnySubjectEnrollment(student) {
  if (selectedSubjectIds(student).length > 0) return true;
  return Boolean(student.isFullPackage);
}

/** Student is enrolled in a specific subject for tests/assessments. */
function isEnrolledInSubject(student, subjectId) {
  const ids = selectedSubjectIds(student);
  if (ids.length > 0) {
    return ids.includes(String(subjectId));
  }
  return Boolean(student.isFullPackage);
}

module.exports = {
  selectedSubjectIds,
  hasAnySubjectEnrollment,
  isEnrolledInSubject,
};
