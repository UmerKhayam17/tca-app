const AcademyStudent = require('../../models/academy/AcademyStudent');

/**
 * Fix legacy null unique-key values and align indexes after schema changes.
 */
async function ensureAcademyStudentIndexes() {
  try {
    await AcademyStudent.updateMany(
      { $or: [{ studentId: null }, { studentId: '' }] },
      { $unset: { studentId: '' } }
    );
    await AcademyStudent.updateMany(
      { $or: [{ registrationNumber: null }, { registrationNumber: '' }] },
      { $unset: { registrationNumber: '' } }
    );
    await AcademyStudent.updateMany(
      { $or: [{ rollNumber: null }, { rollNumber: '' }] },
      { $unset: { rollNumber: '' } }
    );
    await AcademyStudent.syncIndexes();
  } catch (err) {
    console.warn('AcademyStudent index sync skipped:', err.message);
  }
}

module.exports = { ensureAcademyStudentIndexes };
