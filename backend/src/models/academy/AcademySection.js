const mongoose = require('mongoose');

const academySectionSchema = new mongoose.Schema(
  {
    sectionName: { type: String, required: true, trim: true },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademyClass',
      required: true,
      index: true,
    },
    useClassSubjects: { type: Boolean, default: true },
    subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AcademySubject' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

academySectionSchema.index({ classId: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.model('AcademySection', academySectionSchema);
