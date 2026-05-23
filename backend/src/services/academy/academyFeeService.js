const ApiError = require('../../utils/ApiError');
const AcademyFeeRecord = require('../../models/academy/AcademyFeeRecord');
const AcademyStudent = require('../../models/academy/AcademyStudent');
const { populateCreatedBy } = require('../../utils/createdBy');

function receiptNumber(studentDoc, month, year, feeType) {
  const sid = studentDoc.studentId || studentDoc._id.toString().slice(-6);
  return `RCP-${sid}-${feeType === 'admission' ? 'ADM' : `${year}${String(month).padStart(2, '0')}`}`;
}

async function buildFeeQuery({ studentId, status, month, year, classId, feeType }) {
  const q = {};
  if (status) q.status = status;
  if (feeType) q.feeType = feeType;
  if (month) q.month = Number(month);
  if (year) q.year = Number(year);
  if (studentId) {
    q.studentId = studentId;
    return q;
  }
  if (classId) {
    const students = await AcademyStudent.find({ classId }).select('_id');
    q.studentId = { $in: students.map((s) => s._id) };
  }
  return q;
}

/** Mark pending vouchers past due date as overdue. */
async function syncOverdueFees(filter = {}) {
  const q = await buildFeeQuery(filter);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  await AcademyFeeRecord.updateMany(
    {
      ...q,
      status: 'pending',
      dueDate: { $lt: startOfToday },
    },
    { $set: { status: 'overdue' } }
  );
}

async function listFeeRecords({
  page = 1,
  limit = 20,
  studentId,
  status,
  month,
  year,
  classId,
  feeType,
}) {
  await syncOverdueFees({ studentId, status, month, year, classId, feeType });

  const q = await buildFeeQuery({ studentId, status, month, year, classId, feeType });

  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const perPage = Math.min(100, Math.max(1, limit));

  const [items, total] = await Promise.all([
    populateCreatedBy(
      AcademyFeeRecord.find(q).populate({
        path: 'studentId',
        select: 'studentId studentName fatherName phone classId monthlyFee',
        populate: { path: 'classId', select: 'className' },
      })
    )
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
      createdBy: userId,
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
  await syncOverdueFees({ studentId });
  const records = await AcademyFeeRecord.find({ studentId }).sort({ year: -1, month: -1 });
  return { student, records };
}

async function getFeeSummary({ month, year, classId, studentId }) {
  await syncOverdueFees({ month, year, classId, studentId });
  const q = await buildFeeQuery({ month, year, classId, studentId });
  const records = await AcademyFeeRecord.find(q).lean();

  const byStatus = { pending: 0, paid: 0, overdue: 0, waived: 0 };
  let totalPaid = 0;
  let totalPending = 0;

  records.forEach((r) => {
    if (byStatus[r.status] != null) byStatus[r.status] += 1;
    if (r.status === 'paid') totalPaid += r.amount;
    if (r.status === 'pending' || r.status === 'overdue') totalPending += r.amount;
  });

  let activeStudents = 0;
  if (!studentId) {
    const studentQ = { status: 'active' };
    if (classId) studentQ.classId = classId;
    activeStudents = await AcademyStudent.countDocuments(studentQ);
  }

  return {
    recordsCount: records.length,
    totalPaid,
    totalPending,
    totalAmount: records.reduce((s, r) => s + r.amount, 0),
    byStatus,
    activeStudents,
  };
}

module.exports = {
  listFeeRecords,
  generateMonthlyFees,
  recordPayment,
  getStudentFeeHistory,
  getFeeSummary,
  receiptNumber,
};
