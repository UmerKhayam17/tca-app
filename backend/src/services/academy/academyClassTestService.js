const ApiError = require('../../utils/ApiError');
const AcademyClassTest = require('../../models/academy/AcademyClassTest');
const AcademyAssessment = require('../../models/academy/AcademyAssessment');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademyClass = require('../../models/academy/AcademyClass');
const assessmentService = require('./academyAssessmentService');

async function createClassTest(body, userId) {
  const cls = await AcademyClass.findById(body.classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  const subject = await AcademySubject.findOne({ _id: body.subjectId, classId: body.classId });
  if (!subject) throw new ApiError(400, 'Subject not found for this class');

  const doc = await AcademyClassTest.create({
    classId: body.classId,
    subjectId: body.subjectId,
    title: body.title.trim(),
    assessmentType: body.assessmentType || 'quiz',
    examDate: body.examDate,
    totalMarks: body.totalMarks,
    status: 'open',
    createdBy: userId,
  });

  return AcademyClassTest.findById(doc._id)
    .populate('classId', 'className')
    .populate('subjectId', 'subjectName subjectCode')
    .lean();
}

async function listClassTests({ classId } = {}) {
  const q = {};
  if (classId) q.classId = classId;
  return AcademyClassTest.find(q)
    .populate('classId', 'className')
    .populate('subjectId', 'subjectName subjectCode')
    .sort({ examDate: -1, createdAt: -1 })
    .lean();
}

async function getClassTestById(id) {
  const test = await AcademyClassTest.findById(id)
    .populate('classId', 'className')
    .populate('subjectId', 'subjectName subjectCode')
    .lean();
  if (!test) throw new ApiError(404, 'Class test not found');
  return test;
}

async function getClassTestMarksEntry(testId) {
  const test = await getClassTestById(testId);
  const classId = test.classId?._id || test.classId;

  const students = await AcademyStudent.find({ classId, status: 'active' })
    .select('studentId studentName fatherName isFullPackage selectedSubjects')
    .sort({ studentName: 1 })
    .lean();

  const assessments = await AcademyAssessment.find({ classTestId: testId }).lean();
  const byStudent = {};
  assessments.forEach((a) => {
    byStudent[String(a.studentId)] = a;
  });

  return {
    test,
    students: students.map((student) => ({
      student: {
        _id: student._id,
        studentId: student.studentId,
        studentName: student.studentName,
        fatherName: student.fatherName,
      },
      assessment: byStudent[String(student._id)] || null,
    })),
  };
}

async function saveClassTestMarks(testId, entries, userId) {
  const test = await AcademyClassTest.findById(testId);
  if (!test) throw new ApiError(404, 'Class test not found');
  if (test.status === 'closed') throw new ApiError(400, 'This test is closed for editing');

  if (!Array.isArray(entries) || !entries.length) {
    throw new ApiError(400, 'No marks to save');
  }

  const classId = String(test.classId);
  const saved = [];

  for (const row of entries) {
    if (row.obtainedMarks === '' || row.obtainedMarks == null) continue;
    const obtained = Number(row.obtainedMarks);
    if (Number.isNaN(obtained) || obtained < 0) continue;
    if (obtained > test.totalMarks) {
      throw new ApiError(400, `Obtained marks cannot exceed ${test.totalMarks}`);
    }

    const student = await AcademyStudent.findById(row.studentId);
    if (!student || String(student.classId) !== classId) {
      throw new ApiError(400, 'Invalid student for this class');
    }

    const payload = {
      classTestId: testId,
      subjectId: test.subjectId,
      title: test.title,
      assessmentType: test.assessmentType,
      examDate: test.examDate,
      totalMarks: test.totalMarks,
      obtainedMarks: obtained,
      remarks: row.remarks || '',
    };

    if (row.assessmentId) {
      const updated = await assessmentService.updateAssessment(row.assessmentId, payload);
      saved.push(updated);
      continue;
    }

    const existing = await AcademyAssessment.findOne({
      classTestId: testId,
      studentId: row.studentId,
    });
    if (existing) {
      const updated = await assessmentService.updateAssessment(existing._id, payload);
      saved.push(updated);
    } else {
      const created = await assessmentService.createAssessment(row.studentId, payload, userId);
      saved.push(created);
    }
  }

  if (!saved.length) throw new ApiError(400, 'Enter at least one student mark');
  return { savedCount: saved.length, records: saved };
}

async function removeClassTest(id) {
  const test = await AcademyClassTest.findById(id);
  if (!test) throw new ApiError(404, 'Class test not found');
  await AcademyAssessment.deleteMany({ classTestId: id });
  await AcademyClassTest.findByIdAndDelete(id);
  return { ok: true };
}

module.exports = {
  createClassTest,
  listClassTests,
  getClassTestById,
  getClassTestMarksEntry,
  saveClassTestMarks,
  removeClassTest,
};
