const ApiError = require('../../utils/ApiError');
const AcademyFeeRecord = require('../../models/academy/AcademyFeeRecord');
const AcademyStudent = require('../../models/academy/AcademyStudent');

function receiptNumber(studentDoc, month, year, feeType) {
  const sid = studentDoc.studentId || studentDoc._id.toString().slice(-6);
  return `RCP-${sid}-${feeType === 'admission' ? 'ADM' : `${year}${String(month).padStart(2, '0')}`}`;
}

async function listFeeRecords({
  page = 1,
  limit = 20,
  studentId,
  status,
  month,
  year,
  classId,
}) {
  const q = {};
  if (studentId) q.studentId = studentId;
  if (status) q.status = status;
  if (month) q.month = Number(month);
  if (year) q.year = Number(year);

  let studentFilter;
  if (classId) {
    const students = await AcademyStudent.find({ classId }).select('_id');
    studentFilter = students.map((s) => s._id);
    q.studentId = { $in: studentFilter };
  }

  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const perPage = Math.min(100, Math.max(1, limit));

  const [items, total] = await Promise.all([
    AcademyFeeRecord.find(q)
      .populate({
        path: 'studentId',
        select: 'studentId studentName fatherName phone classId monthlyFee',
        populate: { path: 'classId', select: 'className' },
      })
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(perPage),
    AcademyFeeRecord.countDocuments(q),
  ]);

  return {
    items,
    pagination: { page: Math.max(1, page), limit: perPage, total, pages: Math.ceil(total / perPage) || 1 },
  };
}

async function generateMonthlyFees({ month, year, classId }, userId) {
  const studentQ = { status: 'active' };
  if (classId) studentQ.classId = classId;
  const students = await AcademyStudent.find(studentQ);
  const dueDate = new Date(year, month - 1, 10);
  const created = [];
  const skipped = [];

  for (const student of students) {
    const exists = await AcademyFeeRecord.findOne({
      studentId: student._id,
      month,
      year,
      feeType: 'monthly',
    });
    if (exists) {
      skipped.push(student._id);
      continue;
    }
    const record = await AcademyFeeRecord.create({
      studentId: student._id,
      month,
      year,
      amount: student.monthlyFee,
      feeType: 'monthly',
      status: 'pending',
      dueDate,
      receiptNumber: receiptNumber(student, month, year, 'monthly'),
      recordedBy: userId,
    });
    created.push(record);
  }

  return { created: created.length, skipped: skipped.length };
}

async function recordPayment(feeRecordId, { paymentMethod, notes }, userId) {
  const record = await AcademyFeeRecord.findById(feeRecordId).populate('studentId');
  if (!record) throw new ApiError(404, 'Fee record not found');
  if (record.status === 'paid') throw new ApiError(400, 'Fee already paid');

  record.status = 'paid';
  record.paidAt = new Date();
  record.paymentMethod = paymentMethod || 'cash';
  record.notes = notes || '';
  record.recordedBy = userId;
  if (!record.receiptNumber && record.studentId) {
    record.receiptNumber = receiptNumber(record.studentId, record.month, record.year, record.feeType);
  }
  await record.save();
  return record;
}

async function getStudentFeeHistory(studentId) {
  const student = await AcademyStudent.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found');
  const records = await AcademyFeeRecord.find({ studentId }).sort({ year: -1, month: -1 });
  return { student, records };
}

module.exports = {
  listFeeRecords,
  generateMonthlyFees,
  recordPayment,
  getStudentFeeHistory,
  receiptNumber,
};
