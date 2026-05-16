const mongoose = require('mongoose');

const academySubjectSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademyClass', required: true, index: true },
    subjectCode: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

academySubjectSchema.index({ classId: 1, subjectCode: 1 }, { unique: true });

module.exports = mongoose.model('AcademySubject', academySubjectSchema);
