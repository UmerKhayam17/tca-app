function letterGrade(pct) {
  if (pct >= 95) return 'A+';
  if (pct >= 85) return 'A';
  if (pct >= 75) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function gpaFromPct(pct) {
  if (pct >= 95) return 4.0;
  if (pct >= 85) return 3.7;
  if (pct >= 75) return 3.3;
  if (pct >= 60) return 3.0;
  if (pct >= 50) return 2.0;
  return 0.0;
}

function computeResultTotals(subjectMarks) {
  let totalMarks = 0;
  let obtainedMarks = 0;
  const enriched = (subjectMarks || []).map((sm) => {
    const pct = sm.total ? (sm.obtained / sm.total) * 100 : 0;
    const grade = sm.grade || letterGrade(pct);
    totalMarks += sm.total;
    obtainedMarks += sm.obtained;
    return { ...sm, grade };
  });
  const percentage = totalMarks ? (obtainedMarks / totalMarks) * 100 : 0;
  const grade = letterGrade(percentage);
  const gpa = gpaFromPct(percentage);
  return { subjectMarks: enriched, totalMarks, obtainedMarks, percentage, grade, gpa };
}

module.exports = { letterGrade, gpaFromPct, computeResultTotals };
