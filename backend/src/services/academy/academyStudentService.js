const ApiError = require('../../utils/ApiError');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const AcademyClass = require('../../models/academy/AcademyClass');
const AcademySubject = require('../../models/academy/AcademySubject');
const AcademyFeeRecord = require('../../models/academy/AcademyFeeRecord');
const {
  getByClass,
  calculateFeesWithDiscount,
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

function normalizeAcademicHistory(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && (r.institutionName || r.className || r.year))
    .map((r) => ({
      institutionName: (r.institutionName || '').trim(),
      className: (r.className || '').trim(),
      totalMarks: r.totalMarks != null && r.totalMarks !== '' ? Number(r.totalMarks) : undefined,
      obtainedMarks: r.obtainedMarks != null && r.obtainedMarks !== '' ? Number(r.obtainedMarks) : undefined,
      percentage: r.percentage != null && r.percentage !== '' ? Number(r.percentage) : undefined,
      year: (r.year || '').trim(),
    }));
}

function pickStudentProfile(payload) {
  const postal = payload.postalAddress?.trim() || payload.address?.trim() || '';
  return {
    dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
    nationality: (payload.nationality || 'Pakistan').trim(),
    guardianName: payload.guardianName?.trim() || '',
    guardianRelation: payload.guardianRelation?.trim() || '',
    fatherGuardianCnic: payload.fatherGuardianCnic?.trim() || '',
    guardianOccupation: payload.guardianOccupation?.trim() || '',
    guardianWorkAddress: payload.guardianWorkAddress?.trim() || '',
    guardianEmail: payload.guardianEmail?.trim() || '',
    studentEmail: payload.studentEmail?.trim() || '',
    postalAddress: postal,
    address: postal,
    contactPhoneRes: payload.contactPhoneRes?.trim() || '',
    permanentAddress: payload.permanentAddress?.trim() || '',
    currentSchoolCollege: payload.currentSchoolCollege?.trim() || '',
    academicHistory: normalizeAcademicHistory(payload.academicHistory),
  };
}

function applyProfileToStudent(student, payload) {
  const profile = pickStudentProfile(payload);
  if (payload.dateOfBirth !== undefined) student.dateOfBirth = profile.dateOfBirth;
  if (payload.nationality !== undefined) student.nationality = profile.nationality;
  if (payload.guardianName !== undefined) student.guardianName = profile.guardianName;
  if (payload.guardianRelation !== undefined) student.guardianRelation = profile.guardianRelation;
  if (payload.fatherGuardianCnic !== undefined) student.fatherGuardianCnic = profile.fatherGuardianCnic;
  if (payload.guardianOccupation !== undefined) student.guardianOccupation = profile.guardianOccupation;
  if (payload.guardianWorkAddress !== undefined) student.guardianWorkAddress = profile.guardianWorkAddress;
  if (payload.guardianEmail !== undefined) student.guardianEmail = profile.guardianEmail;
  if (payload.studentEmail !== undefined) student.studentEmail = profile.studentEmail;
  if (payload.postalAddress !== undefined || payload.address !== undefined) {
    student.postalAddress = profile.postalAddress;
    student.address = profile.postalAddress;
  }
  if (payload.contactPhoneRes !== undefined) student.contactPhoneRes = profile.contactPhoneRes;
  if (payload.permanentAddress !== undefined) student.permanentAddress = profile.permanentAddress;
  if (payload.currentSchoolCollege !== undefined) student.currentSchoolCollege = profile.currentSchoolCollege;
  if (payload.academicHistory !== undefined) student.academicHistory = profile.academicHistory;
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

  const fees = calculateFeesWithDiscount(feeStructure, {
    selectedSubjectIds: subjectIds,
    isFullPackage,
    discountAmount: payload.discountAmount,
  });

  const studentId = await generateStudentId();
  const phone = (payload.phone || payload.mobileNo || '').trim();
  const profile = pickStudentProfile(payload);

  const student = await AcademyStudent.create({
    studentId,
    studentName: payload.studentName.trim(),
    fatherName: payload.fatherName.trim(),
    phone,
    gender: payload.gender,
    ...profile,
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
    payload.isFullPackage !== undefined ||
    payload.discountAmount !== undefined;

  if (payload.studentName) student.studentName = payload.studentName.trim();
  if (payload.fatherName) student.fatherName = payload.fatherName.trim();
  if (payload.phone) student.phone = payload.phone.trim();
  if (payload.mobileNo) student.phone = payload.mobileNo.trim();
  if (payload.gender) student.gender = payload.gender;
  applyProfileToStudent(student, payload);
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
    const discountAmount =
      payload.discountAmount !== undefined ? payload.discountAmount : student.discountAmount;
    const fees = calculateFeesWithDiscount(feeStructure, {
      selectedSubjectIds: subjectIds,
      isFullPackage,
      discountAmount,
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

async function deleteStudent(id) {
  const student = await AcademyStudent.findById(id);
  if (!student) throw new ApiError(404, 'Student not found');

  const paidCount = await AcademyFeeRecord.countDocuments({
    studentId: id,
    status: 'paid',
  });
  if (paidCount > 0) {
    throw new ApiError(400, 'Cannot delete student with paid fee records. Set status to inactive instead.');
  }

  await AcademyFeeRecord.deleteMany({ studentId: id });
  await student.deleteOne();
  return { deleted: true, studentId: student.studentId };
}

module.exports = {
  generateStudentId,
  registerStudent,
  updateStudent,
  getStudent,
  listStudents,
  studentsToCsv,
  deleteStudent,
};
