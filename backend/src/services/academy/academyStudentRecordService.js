const ApiError = require('../../utils/ApiError');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademyFeeRecord = require('../../models/academy/AcademyFeeRecord');
const AcademyAttendance = require('../../models/academy/AcademyAttendance');
const AcademyClassTimetable = require('../../models/academy/AcademyClassTimetable');
const AcademyAssessment = require('../../models/academy/AcademyAssessment');

function resolveClassId(student) {
  const c = student.classId;
  if (!c) return null;
  return c._id ? c._id : c;
}

function resolveEnrolledSubjectIds(student, allClassSubjects) {
  if (student.isFullPackage) {
    return allClassSubjects.map((s) => String(s._id));
  }
  const selected = student.selectedSubjects || [];
  return selected.map((s) => String(s._id || s));
}

function attendanceSummary(records) {
  const counts = { present: 0, absent: 0, late: 0, leave: 0, total: records.length };
  records.forEach((r) => {
    if (counts[r.status] != null) counts[r.status] += 1;
  });
  const attended = counts.present + counts.late;
  const rate = counts.total ? Math.round((attended / counts.total) * 100) : null;
  return { ...counts, attendanceRate: rate };
}

function feeSummary(records) {
  let totalPaid = 0;
  let totalPending = 0;
  const byStatus = { pending: 0, paid: 0, overdue: 0, waived: 0 };
  records.forEach((r) => {
    if (byStatus[r.status] != null) byStatus[r.status] += 1;
    if (r.status === 'paid') totalPaid += r.amount;
    if (r.status === 'pending' || r.status === 'overdue') totalPending += r.amount;
  });
  return {
    recordsCount: records.length,
    totalPaid,
    totalPending,
    byStatus,
  };
}

function assessmentSummary(assessments) {
  if (!assessments.length) {
    return { count: 0, averagePercentage: null, highestPercentage: null, lowestPercentage: null };
  }
  const pcts = assessments
    .map((a) => (a.totalMarks > 0 ? (a.obtainedMarks / a.totalMarks) * 100 : null))
    .filter((p) => p != null);
  const avg = pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : null;
  return {
    count: assessments.length,
    averagePercentage: avg,
    highestPercentage: pcts.length ? Math.round(Math.max(...pcts)) : null,
    lowestPercentage: pcts.length ? Math.round(Math.min(...pcts)) : null,
  };
}

async function getStudentRecord(id) {
  const student = await AcademyStudent.findById(id)
    .populate('classId', 'className totalSubjects')
    .populate('selectedSubjects', 'subjectName subjectCode')
    .populate('feeStructureId');
  if (!student) throw new ApiError(404, 'Student not found');

  const classId = resolveClassId(student);

  const [allClassSubjects, feeRecords, attendanceRecords, assessments, classTimetable] =
    await Promise.all([
      classId
        ? AcademySubject.find({ classId, status: 'active' }).sort({ subjectName: 1 })
        : [],
      AcademyFeeRecord.find({ studentId: id }).sort({ year: -1, month: -1, createdAt: -1 }),
      AcademyAttendance.find({ studentId: id })
        .sort({ date: -1 })
        .limit(200)
        .populate('subjectId', 'subjectName subjectCode'),
      AcademyAssessment.find({ studentId: id })
        .sort({ examDate: -1 })
        .populate('subjectId', 'subjectName subjectCode'),
      classId
        ? AcademyClassTimetable.find({ classId })
            .populate('subjectId', 'subjectName subjectCode')
            .sort({ dayOfWeek: 1, startTime: 1 })
        : [],
    ]);

  const enrolledIds = new Set(resolveEnrolledSubjectIds(student, allClassSubjects));
  const enrollmentSubjects = student.isFullPackage ? allClassSubjects : student.selectedSubjects;

  const timetable = classTimetable.filter((slot) => {
    const sid = slot.subjectId?._id || slot.subjectId;
    return enrolledIds.has(String(sid));
  });

  return {
    student,
    enrollment: {
      isFullPackage: student.isFullPackage,
      subjectCount: enrollmentSubjects?.length || 0,
      classSubjectsTotal: allClassSubjects.length,
      subjects: enrollmentSubjects,
    },
    timetable,
    attendance: {
      summary: attendanceSummary(attendanceRecords),
      records: attendanceRecords,
    },
    fees: {
      summary: feeSummary(feeRecords),
      records: feeRecords,
    },
    assessments: {
      summary: assessmentSummary(assessments),
      records: assessments,
    },
  };
}

module.exports = { getStudentRecord };
