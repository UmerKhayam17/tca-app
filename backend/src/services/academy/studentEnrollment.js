/** Subject IDs the student is enrolled in (full package = all active class subjects). */
function selectedSubjectIds(student) {
  return (student.selectedSubjects || []).map((s) => String(s._id || s));
}

/** Student takes at least one subject (full package or explicit selection). */
function hasAnySubjectEnrollment(student) {
  if (student.isFullPackage) return true;
  return selectedSubjectIds(student).length > 0;
}

/** Student is enrolled in a specific subject for tests/assessments. */
function isEnrolledInSubject(student, subjectId) {
  if (student.isFullPackage) return true;
  return selectedSubjectIds(student).includes(String(subjectId));
}

module.exports = {
  selectedSubjectIds,
  hasAnySubjectEnrollment,
  isEnrolledInSubject,
};
