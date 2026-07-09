/** Default academy classes created for every academic session. */
const DEFAULT_ACADEMY_CLASSES = ['9th', '10th', '1st Year', '2nd Year'];

/** One default section per class so student registration is ready immediately. */
const DEFAULT_ACADEMY_SECTIONS = ['A'];

/** Same core subjects for every class (codes vary by grade suffix). */
const DEFAULT_ACADEMY_SUBJECTS = [
  { subjectName: 'English', codeSuffix: 'ENG' },
  { subjectName: 'Urdu', codeSuffix: 'URD' },
  { subjectName: 'Mathematics', codeSuffix: 'MATH' },
  { subjectName: 'Physics', codeSuffix: 'PHY' },
  { subjectName: 'Chemistry', codeSuffix: 'CHEM' },
  { subjectName: 'Biology', codeSuffix: 'BIO' },
  { subjectName: 'Computer Science', codeSuffix: 'CS' },
  { subjectName: 'Islamiat', codeSuffix: 'ISL' },
  { subjectName: 'Pakistan Studies', codeSuffix: 'PST' },
];

function gradeCodeForClass(className) {
  const n = String(className).toLowerCase().trim();
  if (/\b9\b|9th/.test(n)) return '09';
  if (/\b10\b|10th/.test(n)) return '10';
  if (/1st|first|\b11\b/.test(n)) return '11';
  if (/2nd|second|\b12\b/.test(n)) return '12';
  return '00';
}

function subjectCodeForClass(className, codeSuffix) {
  return `${codeSuffix}-${gradeCodeForClass(className)}`;
}

module.exports = {
  DEFAULT_ACADEMY_CLASSES,
  DEFAULT_ACADEMY_SECTIONS,
  DEFAULT_ACADEMY_SUBJECTS,
  gradeCodeForClass,
  subjectCodeForClass,
};
