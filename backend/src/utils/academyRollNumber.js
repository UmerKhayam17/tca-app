const AcademyStudent = require('../models/academy/AcademyStudent');
const AcademyClass = require('../models/academy/AcademyClass');
const Session = require('../models/Session');
const { slugPart } = require('./rollNumber');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function classRollPrefix(classId) {
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new Error('Class not found');
  const session = cls.sessionId ? await Session.findById(cls.sessionId) : null;
  const sessionPart = slugPart(session?.name || 'SESSION');
  const classPart = slugPart(cls.className || 'CLASS');
  return `${sessionPart}-${classPart}`;
}

/** Temporary roll assigned at admission intake (replaced on activation). */
async function generateTemporaryRollNumber(classId) {
  const prefix = `TMP-${await classRollPrefix(classId)}`;
  const count = await AcademyStudent.countDocuments({
    rollNumber: new RegExp(`^${escapeRegex(prefix)}-`),
  });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}

/** Official class roll number — assigned when admission is completed. */
async function generateAcademyRollNumber(classId) {
  const prefix = await classRollPrefix(classId);
  const count = await AcademyStudent.countDocuments({
    status: 'active',
    rollNumber: new RegExp(`^${escapeRegex(prefix)}-\\d{3}$`),
  });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}

module.exports = { generateAcademyRollNumber, generateTemporaryRollNumber };
