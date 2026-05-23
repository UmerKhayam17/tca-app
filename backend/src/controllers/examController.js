const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Result = require('../models/Result');
const examService = require('../services/exam/examService');
const { renderResultCardPdf } = require('../services/pdfService');

const createExam = catchAsync(async (req, res) => {
  const exam = await examService.createExam(req.body, req.user._id);
  res.status(201).json({ success: true, data: exam });
});

const listExams = catchAsync(async (req, res) => {
  const exams = await examService.listExams({ classId: req.query.classId });
  res.json({ success: true, data: exams });
});

const getExam = catchAsync(async (req, res) => {
  const exam = await examService.getExamById(req.params.id);
  res.json({ success: true, data: exam });
});

const updateExam = catchAsync(async (req, res) => {
  const exam = await examService.updateExam(req.params.id, req.body);
  res.json({ success: true, data: exam });
});

const getExamStudents = catchAsync(async (req, res) => {
  const data = await examService.getExamStudents(req.params.id);
  res.json({ success: true, data });
});

const enterMarks = catchAsync(async (req, res) => {
  const saved = await examService.enterMarks(req.params.id, req.body.marks, req.user._id);
  res.json({ success: true, data: saved });
});

const getExamResults = catchAsync(async (req, res) => {
  const results = await examService.getExamResults(req.params.id);
  res.json({ success: true, data: results });
});

const studentResults = catchAsync(async (req, res) => {
  const results = await examService.studentPublishedResults(req.params.id);
  res.json({ success: true, data: results });
});

const publishResult = catchAsync(async (req, res) => {
  const result = await examService.publishResult(req.params.id);
  res.json({ success: true, data: result });
});

const publishAll = catchAsync(async (req, res) => {
  const data = await examService.publishAllForExam(req.params.id);
  res.json({ success: true, data });
});

const resultPdf = catchAsync(async (req, res) => {
  const result = await Result.findById(req.params.id)
    .populate('exam')
    .populate('academyStudent', 'studentId studentName fatherName');
  if (!result) throw new ApiError(404, 'Result not found');
  const buf = await renderResultCardPdf(result);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="result-${result._id}.pdf"`);
  res.send(buf);
});

module.exports = {
  createExam,
  listExams,
  getExam,
  updateExam,
  getExamStudents,
  enterMarks,
  getExamResults,
  studentResults,
  publishResult,
  publishAll,
  resultPdf,
};
