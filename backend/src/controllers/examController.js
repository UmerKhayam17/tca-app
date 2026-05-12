const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const { renderResultCardPdf } = require('../services/pdfService');

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
  const enriched = subjectMarks.map((sm) => {
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

const createExam = catchAsync(async (req, res) => {
  const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: exam });
});

const listExams = catchAsync(async (req, res) => {
  const { classId, sessionId } = req.query;
  const q = {};
  if (classId) q.class = classId;
  if (sessionId) q.session = sessionId;
  const exams = await Exam.find(q).populate('class').populate('session').sort({ startDate: -1 });
  res.json({ success: true, data: exams });
});

const enterMarks = catchAsync(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new ApiError(404, 'Exam not found');
  const saved = [];
  for (const row of req.body.marks) {
    const totals = computeResultTotals(row.subjectMarks);
    // eslint-disable-next-line no-await-in-loop
    const result = await Result.findOneAndUpdate(
      { student: row.studentId, exam: exam._id },
      {
        student: row.studentId,
        exam: exam._id,
        session: exam.session,
        subjectMarks: totals.subjectMarks,
        totalMarks: totals.totalMarks,
        obtainedMarks: totals.obtainedMarks,
        percentage: totals.percentage,
        grade: totals.grade,
        gpa: totals.gpa,
        proofImages: row.proofImages || [],
        enteredBy: req.user._id,
        isPublished: false,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    saved.push(result);
  }
  res.json({ success: true, data: saved });
});

const getExamResults = catchAsync(async (req, res) => {
  const results = await Result.find({ exam: req.params.id })
    .populate('student')
    .sort({ percentage: -1 });
  await Promise.all(
    results.map((r, i) => Result.updateOne({ _id: r._id }, { $set: { position: i + 1 } }))
  );
  const fresh = await Result.find({ exam: req.params.id }).populate('student').sort({ percentage: -1 });
  res.json({ success: true, data: fresh });
});

const studentResults = catchAsync(async (req, res) => {
  const results = await Result.find({ student: req.params.id, isPublished: true })
    .populate('exam')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: results });
});

const publishResult = catchAsync(async (req, res) => {
  const result = await Result.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true }).populate('exam');
  if (!result) throw new ApiError(404, 'Result not found');
  res.json({ success: true, data: result });
});

const resultPdf = catchAsync(async (req, res) => {
  const result = await Result.findById(req.params.id).populate('exam').populate('student');
  if (!result) throw new ApiError(404, 'Result not found');
  const buf = await renderResultCardPdf(result);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="result-${result._id}.pdf"`);
  res.send(buf);
});

module.exports = {
  createExam,
  listExams,
  enterMarks,
  getExamResults,
  studentResults,
  publishResult,
  resultPdf,
};
