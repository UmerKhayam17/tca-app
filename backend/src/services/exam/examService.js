const ApiError = require('../../utils/ApiError');
const Exam = require('../../models/Exam');
const Result = require('../../models/Result');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademyClass = require('../../models/academy/AcademyClass');
const { computeResultTotals } = require('./examGrading');

function resolveClassId(student) {
  const c = student.classId;
  return c?._id ? c._id : c;
}

function enrolledSubjectIds(student, allClassSubjects) {
  if (student.isFullPackage) {
    return allClassSubjects.map((s) => String(s._id));
  }
  return (student.selectedSubjects || []).map((s) => String(s._id || s));
}

async function createExam(body, userId) {
  const cls = await AcademyClass.findById(body.academyClass);
  if (!cls) throw new ApiError(404, 'Class not found');
  return Exam.create({
    title: body.title,
    type: body.type,
    academyClass: body.academyClass,
    sessionLabel: body.sessionLabel || '',
    startDate: body.startDate,
    endDate: body.endDate,
    dateSheet: body.dateSheet || [],
    status: body.status || 'scheduled',
    createdBy: userId,
  });
}

async function listExams({ classId } = {}) {
  const q = {};
  if (classId) q.academyClass = classId;
  return Exam.find(q)
    .populate('academyClass', 'className')
    .sort({ startDate: -1 })
    .lean();
}

async function getExamById(id) {
  const exam = await Exam.findById(id).populate('academyClass', 'className').lean();
  if (!exam) throw new ApiError(404, 'Exam not found');
  return exam;
}

async function updateExam(id, patch) {
  const exam = await Exam.findByIdAndUpdate(id, patch, { new: true })
    .populate('academyClass', 'className')
    .lean();
  if (!exam) throw new ApiError(404, 'Exam not found');
  return exam;
}

async function getExamStudents(examId) {
  const exam = await Exam.findById(examId).lean();
  if (!exam) throw new ApiError(404, 'Exam not found');

  const [students, subjects, results] = await Promise.all([
    AcademyStudent.find({ classId: exam.academyClass, status: 'active' })
      .populate('selectedSubjects', 'subjectName subjectCode')
      .lean(),
    AcademySubject.find({ classId: exam.academyClass, status: 'active' }).sort({ subjectName: 1 }).lean(),
    Result.find({ exam: examId }).lean(),
  ]);

  const resultByStudent = {};
  results.forEach((r) => {
    resultByStudent[String(r.academyStudent)] = r;
  });

  const rows = students.map((student) => {
    const enrolled = enrolledSubjectIds(student, subjects);
    const enrolledSubjects = subjects.filter((s) => enrolled.includes(String(s._id)));
    const existing = resultByStudent[String(student._id)];
    return {
      student: {
        _id: student._id,
        studentId: student.studentId,
        studentName: student.studentName,
        fatherName: student.fatherName,
        isFullPackage: student.isFullPackage,
      },
      subjects: enrolledSubjects,
      result: existing || null,
    };
  });

  return { exam, subjects, students: rows };
}

async function enterMarks(examId, marksRows, userId) {
  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const saved = [];
  for (const row of marksRows) {
    const totals = computeResultTotals(row.subjectMarks);
    // eslint-disable-next-line no-await-in-loop
    const result = await Result.findOneAndUpdate(
      { academyStudent: row.studentId, exam: exam._id },
      {
        academyStudent: row.studentId,
        exam: exam._id,
        subjectMarks: totals.subjectMarks,
        totalMarks: totals.totalMarks,
        obtainedMarks: totals.obtainedMarks,
        percentage: totals.percentage,
        grade: totals.grade,
        gpa: totals.gpa,
        proofImages: row.proofImages || [],
        enteredBy: userId,
        isPublished: false,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    saved.push(result);
  }
  return saved;
}

async function getExamResults(examId) {
  const results = await Result.find({ exam: examId })
    .populate('academyStudent', 'studentId studentName fatherName classId')
    .populate('subjectMarks.subject', 'subjectName subjectCode')
    .sort({ percentage: -1 })
    .lean();

  await Promise.all(
    results.map((r, i) => Result.updateOne({ _id: r._id }, { $set: { position: i + 1 } }))
  );

  return Result.find({ exam: examId })
    .populate('academyStudent', 'studentId studentName fatherName classId')
    .populate('subjectMarks.subject', 'subjectName subjectCode')
    .sort({ percentage: -1 })
    .lean();
}

async function publishResult(resultId) {
  const result = await Result.findByIdAndUpdate(
    resultId,
    { isPublished: true },
    { new: true }
  )
    .populate('exam')
    .populate('academyStudent', 'studentId studentName');
  if (!result) throw new ApiError(404, 'Result not found');
  return result;
}

async function publishAllForExam(examId) {
  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError(404, 'Exam not found');
  const res = await Result.updateMany({ exam: examId }, { $set: { isPublished: true } });
  await Exam.findByIdAndUpdate(examId, { status: 'completed' });
  return { modifiedCount: res.modifiedCount };
}

async function studentPublishedResults(academyStudentId) {
  return Result.find({ academyStudent: academyStudentId, isPublished: true })
    .populate('exam', 'title type sessionLabel startDate endDate status')
    .populate('subjectMarks.subject', 'subjectName subjectCode')
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  createExam,
  listExams,
  getExamById,
  updateExam,
  getExamStudents,
  enterMarks,
  getExamResults,
  publishResult,
  publishAllForExam,
  studentPublishedResults,
};
