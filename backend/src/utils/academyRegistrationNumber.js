const AcademyStudent = require('../models/academy/AcademyStudent');

async function generateRegistrationNumber() {
  const year = new Date().getFullYear();
  const prefix = `REG-${year}-`;
  const last = await AcademyStudent.findOne({ registrationNumber: new RegExp(`^${prefix}`) })
    .sort({ registrationNumber: -1 })
    .select('registrationNumber');
  let seq = 1;
  if (last?.registrationNumber) {
    const part = last.registrationNumber.split('-').pop();
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = { generateRegistrationNumber };
