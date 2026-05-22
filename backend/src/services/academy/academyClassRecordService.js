const ApiError = require('../../utils/ApiError');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const AcademyFeeStructure = require('../../models/academy/AcademyFeeStructure');
const AcademyFeeRecord = require('../../models/academy/AcademyFeeRecord');
const AcademyClassTest = require('../../models/academy/AcademyClassTest');
const AcademyClassTimetable = require('../../models/academy/AcademyClassTimetable');

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function getClassRecord(classId) {
  const cls = await AcademyClass.findById(classId).populate('createdBy', 'name email').lean();
  if (!cls) throw new ApiError(404, 'Class not found');

  const [
    subjects,
    feeStructures,
    students,
    classTests,
    timetable,
    studentIds,
  ] = await Promise.all([
    AcademySubject.find({ classId })
      .populate('createdBy', 'name email')
      .sort({ subjectName: 1 })
      .lean(),
    AcademyFeeStructure.find({ classId })
      .populate('createdBy', 'name email')
      .sort({ effectiveDate: -1, createdAt: -1 })
      .lean(),
    AcademyStudent.find({ classId })
      .select('studentId studentName fatherName status isFullPackage gender phone')
      .sort({ studentName: 1 })
      .lean(),
    AcademyClassTest.find({ classId })
      .populate('subjectId', 'subjectName subjectCode')
      .sort({ examDate: -1 })
      .limit(30)
      .lean(),
    AcademyClassTimetable.find({ classId })
      .populate('subjectId', 'subjectName subjectCode')
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean(),
    AcademyStudent.find({ classId }).distinct('_id'),
  ]);

  let feeStats = { recordsCount: 0, totalPaid: 0, totalPending: 0 };
  if (studentIds.length) {
    const feeRecords = await AcademyFeeRecord.find({ studentId: { $in: studentIds } }).lean();
    feeStats.recordsCount = feeRecords.length;
    feeRecords.forEach((r) => {
      if (r.status === 'paid') feeStats.totalPaid += r.amount;
      if (r.status === 'pending' || r.status === 'overdue') feeStats.totalPending += r.amount;
    });
  }

  const activeFeeStructure =
    feeStructures.find((f) => f.status === 'active') || feeStructures[0] || null;

  const activeStudents = students.filter((s) => s.status === 'active').length;

  return {
    class: cls,
    subjects,
    feeStructure: activeFeeStructure,
    feeStructureHistory: feeStructures,
    students,
    classTests,
    timetable: timetable.map((slot) => ({
      ...slot,
      dayName: WEEKDAY_NAMES[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`,
    })),
    stats: {
      subjectCount: subjects.filter((s) => s.status === 'active').length,
      studentCount: students.length,
      activeStudentCount: activeStudents,
      classTestCount: await AcademyClassTest.countDocuments({ classId }),
      feeRecordsCount: feeStats.recordsCount,
      totalFeesPaid: feeStats.totalPaid,
      totalFeesPending: feeStats.totalPending,
    },
  };
}

module.exports = { getClassRecord, WEEKDAY_NAMES };
