const ApiError = require('../../utils/ApiError');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademyFeeRecord = require('../../models/academy/AcademyFeeRecord');
const {
  getByClass,
  calculateFeesFromStructure,
} = require('./academyFeeStructureService');

async function generateStudentId() {
  const year = new Date().getFullYear();
  const prefix = `TCES-${year}-`;
  const last = await AcademyStudent.findOne({ studentId: new RegExp(`^${prefix}`) })
    .sort({ studentId: -1 })
    .select('studentId');
  let seq = 1;
  if (last?.studentId) {
    const part = last.studentId.split('-').pop();
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

async function validateSubjects(classId, subjectIds, isFullPackage) {
  if (isFullPackage) return [];
  if (!subjectIds?.length) throw new ApiError(400, 'Select at least one subject or full package');
  const subjects = await AcademySubject.find({ _id: { $in: subjectIds }, classId, status: 'active' });
  if (subjects.length !== subjectIds.length) {
    throw new ApiError(400, 'One or more subjects are invalid for this class');
  }
  return subjects.map((s) => s._id);
}

async function registerStudent(payload, userId) {
  const cls = await AcademyClass.findById(payload.classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  if (cls.status !== 'active') throw new ApiError(400, 'Class is not active');

  const feeStructure = await getByClass(payload.classId);
  if (!feeStructure) throw new ApiError(400, 'Configure fee structure for this class first');

  const isFullPackage = Boolean(payload.isFullPackage);
  const subjectIds = await validateSubjects(payload.classId, payload.selectedSubjects, isFullPackage);

  const fees = calculateFeesFromStructure(feeStructure, {
    selectedSubjectIds: subjectIds,
    isFullPackage,
  });

  const studentId = await generateStudentId();
  const student = await AcademyStudent.create({
    studentId,
    studentName: payload.studentName.trim(),
    fatherName: payload.fatherName.trim(),
    phone: payload.phone.trim(),
    gender: payload.gender,
    address: payload.address?.trim() || '',
    classId: payload.classId,
    selectedSubjects: isFullPackage ? [] : subjectIds,
    isFullPackage,
    ...fees,
    feeStructureId: feeStructure._id,
    status: payload.status || 'active',
    createdBy: userId,
  });

  const now = new Date();
  const receiptNumber = `RCP-${studentId}-ADM`;
  await AcademyFeeRecord.create({
    studentId: student._id,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    amount: fees.totalFee,
    feeType: 'admission',
    status: 'pending',
    dueDate: now,
    receiptNumber,
  });

  return student.populate([
    { path: 'classId', select: 'className' },
    { path: 'selectedSubjects', select: 'subjectName subjectCode' },
  ]);
}

async function updateStudent(id, payload) {
  const student = await AcademyStudent.findById(id);
  if (!student) throw new ApiError(404, 'Student not found');

  const classId = payload.classId || student.classId;
  const isFullPackage = payload.isFullPackage !== undefined ? payload.isFullPackage : student.isFullPackage;
  const needsFeeRecalc =
    payload.classId ||
    payload.selectedSubjects ||
    payload.isFullPackage !== undefined;

  if (payload.studentName) student.studentName = payload.studentName.trim();
  if (payload.fatherName) student.fatherName = payload.fatherName.trim();
  if (payload.phone) student.phone = payload.phone.trim();
  if (payload.gender) student.gender = payload.gender;
  if (payload.address !== undefined) student.address = payload.address?.trim() || '';
  if (payload.status) student.status = payload.status;
  if (payload.classId) student.classId = payload.classId;

  if (needsFeeRecalc) {
    const feeStructure = await getByClass(classId);
    if (!feeStructure) throw new ApiError(400, 'No active fee structure for class');
    const subjectIds = await validateSubjects(
      classId,
      payload.selectedSubjects || student.selectedSubjects,
      isFullPackage
    );
    student.isFullPackage = isFullPackage;
    student.selectedSubjects = isFullPackage ? [] : subjectIds;
    const fees = calculateFeesFromStructure(feeStructure, {
      selectedSubjectIds: subjectIds,
      isFullPackage,
    });
    Object.assign(student, fees);
    student.feeStructureId = feeStructure._id;
  }

  await student.save();
  return student.populate([
    { path: 'classId', select: 'className' },
    { path: 'selectedSubjects', select: 'subjectName subjectCode' },
  ]);
}

async function getStudent(id) {
  const student = await AcademyStudent.findById(id)
    .populate('classId', 'className totalSubjects')
    .populate('selectedSubjects', 'subjectName subjectCode')
    .populate('feeStructureId');
  if (!student) throw new ApiError(404, 'Student not found');
  return student;
}

async function listStudents({
  page = 1,
  limit = 20,
  search,
  classId,
  status,
  sort = '-createdAt',
}) {
  const q = {};
  if (classId) q.classId = classId;
  if (status) q.status = status;
  if (search?.trim()) {
    const s = search.trim();
    q.$or = [
      { studentName: { $regex: s, $options: 'i' } },
      { fatherName: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      { studentId: { $regex: s, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const perPage = Math.min(100, Math.max(1, limit));

  const [items, total] = await Promise.all([
    AcademyStudent.find(q)
      .populate('classId', 'className')
      .populate('selectedSubjects', 'subjectName')
      .sort(sort)
      .skip(skip)
      .limit(perPage),
    AcademyStudent.countDocuments(q),
  ]);

  return {
    items,
    pagination: {
      page: Math.max(1, page),
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage) || 1,
    },
  };
}

function studentsToCsv(rows) {
  const header = [
    'Student ID',
    'Name',
    'Father',
    'Phone',
    'Class',
    'Monthly Fee',
    'Admission Fee',
    'Total Fee',
    'Status',
  ];
  const lines = [header.join(',')];
  rows.forEach((s) => {
    const className = s.classId?.className || '';
    lines.push(
      [
        s.studentId,
        `"${(s.studentName || '').replace(/"/g, '""')}"`,
        `"${(s.fatherName || '').replace(/"/g, '""')}"`,
        s.phone,
        `"${className.replace(/"/g, '""')}"`,
        s.monthlyFee,
        s.admissionFee,
        s.totalFee,
        s.status,
      ].join(',')
    );
  });
  return lines.join('\n');
}

module.exports = {
  generateStudentId,
  registerStudent,
  updateStudent,
  getStudent,
  listStudents,
  studentsToCsv,
};
