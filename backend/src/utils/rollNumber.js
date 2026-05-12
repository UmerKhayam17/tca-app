const Student = require('../models/Student');

function slugPart(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
    .slice(0, 12) || 'X';
}

async function generateRollNumber({ sessionName, className }) {
  const sessionPart = slugPart(sessionName);
  const classPart = slugPart(className);
  const prefix = `${sessionPart}-${classPart}`;
  const count = await Student.countDocuments({ rollNumber: new RegExp(`^${prefix}-`) });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}

module.exports = { generateRollNumber, slugPart };
