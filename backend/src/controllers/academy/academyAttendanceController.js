const catchAsync = require('../../utils/catchAsync');
const attendanceService = require('../../services/academy/academyAttendanceService');
const rt = require('../../services/realtime/academyRealtime');

const list = catchAsync(async (req, res) => {
  const date = req.query.date;
  if (!date) {
    return res.status(400).json({ success: false, message: 'date query required (YYYY-MM-DD)' });
  }
  const data = await attendanceService.listByDate({
    date,
    classId: req.query.classId,
  });
  res.json({ success: true, data });
});

const mark = catchAsync(async (req, res) => {
  const data = await attendanceService.markAttendance(req.body, req.user._id);
  rt.attendanceCrud('updated', req.body?.classId || 'batch');
  res.status(201).json({ success: true, data });
});

const summary = catchAsync(async (req, res) => {
  const data = await attendanceService.getSummary({
    month: req.query.month ? Number(req.query.month) : undefined,
    year: req.query.year ? Number(req.query.year) : undefined,
  });
  res.json({ success: true, data });
});

module.exports = { list, mark, summary };
