const FeeVoucher = require('../models/FeeVoucher');
const FeeStructure = require('../models/FeeStructure');
const Student = require('../models/Student');
const { slugPart } = require('../utils/rollNumber');

function buildReceiptNumber({ year, month, className, rollNumber }) {
  const ym = `${year}${String(month).padStart(2, '0')}`;
  const cls = slugPart(className);
  const roll = slugPart(rollNumber);
  const uniq = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${ym}-${cls}-${roll}-${uniq}`;
}

async function generateVoucherForStudent({
  student,
  feeStructure,
  month,
  year,
  generatedBy,
}) {
  const base = feeStructure.amount;
  const discountAmount = (base * (student.feeDiscount || 0)) / 100;
  const fine = 0;
  const netAmount = Math.max(0, base - discountAmount + fine);

  const dup = await FeeVoucher.findOne({
    student: student._id,
    feeStructure: feeStructure._id,
    month,
    year,
  });
  if (dup) return dup;

  const populatedClass = await Student.findById(student._id).populate('class');
  const cls = populatedClass?.class;
  const receiptNumber = buildReceiptNumber({
    year,
    month,
    className: cls?.name,
    rollNumber: student.rollNumber,
  });

  return FeeVoucher.create({
    student: student._id,
    feeStructure: feeStructure._id,
    month,
    year,
    amount: base,
    discount: discountAmount,
    fine,
    netAmount,
    status: 'pending',
    receiptNumber,
    generatedBy,
    createdBy: generatedBy,
  });
}

async function generateMonthlyVouchersForActiveStudents({ month, year, sessionId, userId }) {
  const structures = await FeeStructure.find({
    session: sessionId,
    type: 'monthly',
    isActive: true,
  }).populate('class');

  const students = await Student.find({
    status: 'active',
    session: sessionId,
  }).populate('class');

  const results = [];
  for (const student of students) {
    const struct = structures.find((s) => String(s.class?._id) === String(student.class?._id));
    if (!struct) continue;
    // eslint-disable-next-line no-await-in-loop
    const v = await generateVoucherForStudent({
      student,
      feeStructure: struct,
      month,
      year,
      generatedBy: userId,
    });
    results.push(v);
  }
  return results;
}

module.exports = {
  generateVoucherForStudent,
  generateMonthlyVouchersForActiveStudents,
  buildReceiptNumber,
};
