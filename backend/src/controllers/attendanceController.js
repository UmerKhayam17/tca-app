const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Section = require('../models/Section');
const { queueAttendanceAbsent } = require('../jobs/queues');

const mark = catchAsync(async (req, res) => {
  const { classId, sectionId, date, entries } = req.body;
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const results = [];
  for (const e of entries) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await Attendance.findOneAndUpdate(
      { student: e.studentId, date: day },
      {
        $set: {
          class: classId,
          section: sectionId,
          date: day,
          status: e.status,
          reason: e.reason,
          markedBy: req.user._id,
        },
        $setOnInsert: { createdBy: req.user._id },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (e.status === 'absent') {
      const student = await Student.findById(e.studentId).populate('class').populate('section');
      const cls = await Class.findById(classId);
      const sec = await Section.findById(sectionId);
      await queueAttendanceAbsent({
        studentName: student?.studentName || student?.fatherName,
        className: cls?.name,
        sectionName: sec?.name,
        date: day.toISOString().slice(0, 10),
        parentUserId: student?.parentUserId,
      });
    }
    results.push(doc);
  }

  res.status(201).json({ success: true, data: results });
});

const byClass = catchAsync(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new ApiError(400, 'date query required');
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const rows = await Attendance.find({
    class: req.params.classId,
    date: day,
  })
    .populate('student')
    .populate('section');
  res.json({ success: true, data: rows });
});

const byStudent = catchAsync(async (req, res) => {
  const rows = await Attendance.find({ student: req.params.id })
    .sort({ date: -1 })
    .populate('class')
    .populate('section');
  res.json({ success: true, data: rows });
});

const correct = catchAsync(async (req, res) => {
  const { status, reason } = req.body;
  const att = await Attendance.findById(req.params.id);
  if (!att) throw new ApiError(404, 'Attendance not found');
  const prev = att.status;
  att.status = status;
  if (reason) att.reason = reason;
  att.editHistory = att.editHistory || [];
  att.editHistory.push({ by: req.user._id, from: prev, to: status, date: new Date() });
  await att.save();
  res.json({ success: true, data: att });
});

const monthlyReport = catchAsync(async (req, res) => {
  const { month, year, classId, studentId } = req.query;
  if (!month || !year) throw new ApiError(400, 'month and year required');
  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
  const q = { date: { $gte: start, $lte: end } };
  if (classId) q.class = classId;
  if (studentId) q.student = studentId;
  const rows = await Attendance.find(q);
  const summary = { total: rows.length, present: 0, absent: 0, late: 0, leave: 0 };
  rows.forEach((r) => {
    summary[r.status] += 1;
  });
  res.json({ success: true, data: { summary, rows } });
});

module.exports = { mark, byClass, byStudent, correct, monthlyReport };
