const mongoose = require('mongoose');

const academySubjectChoiceGroupSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademyClass', required: true, index: true },
    groupName: { type: String, required: true, trim: true },
    subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AcademySubject' }],
    pickCount: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

academySubjectChoiceGroupSchema.index({ classId: 1, groupName: 1 }, { unique: true });

module.exports = mongoose.model('AcademySubjectChoiceGroup', academySubjectChoiceGroupSchema);
