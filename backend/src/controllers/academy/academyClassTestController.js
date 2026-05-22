const catchAsync = require('../../utils/catchAsync');
const classTestService = require('../../services/academy/academyClassTestService');

const list = catchAsync(async (req, res) => {
  const data = await classTestService.listClassTests({
    classId: req.query.classId,
    seriesId: req.query.seriesId,
  });
  res.json({ success: true, data });
});

const create = catchAsync(async (req, res) => {
  const data = await classTestService.createClassTest(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const getEntry = catchAsync(async (req, res) => {
  const data = await classTestService.getClassTestMarksEntry(req.params.id);
  res.json({ success: true, data });
});

const saveMarks = catchAsync(async (req, res) => {
  const data = await classTestService.saveClassTestMarks(
    req.params.id,
    req.body.entries,
    req.user._id
  );
  res.status(201).json({ success: true, data });
});

const uploadTestPaper = catchAsync(async (req, res) => {
  const data = await classTestService.uploadStudentTestPaper(
    req.params.id,
    req.params.studentId,
    req.file
  );
  res.status(201).json({ success: true, data });
});

const remove = catchAsync(async (req, res) => {
  const deleteSeries = req.query.series === 'true' || req.query.series === '1';
  const data = await classTestService.removeClassTest(req.params.id, { deleteSeries });
  res.json({ success: true, data });
});

module.exports = { list, create, getEntry, saveMarks, uploadTestPaper, remove };
