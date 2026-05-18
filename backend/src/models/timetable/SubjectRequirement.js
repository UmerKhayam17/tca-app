const mongoose = require('mongoose');
const { WEEKDAYS } = require('./constants');

const subjectRequirementSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    weeklyPeriods: { type: Number, required: true, min: 1 },
    maxConsecutive: { type: Number, default: 2, min: 1 },
    minGapBetween: { type: Number, default: 0, min: 0 },
    preferredDays: [{ type: String, enum: WEEKDAYS }],
    avoidFirstPeriod: { type: Boolean, default: false },
    isLab: { type: Boolean, default: false },
    requiresRoomType: { type: String, enum: ['classroom', 'lab', 'hall', 'computer', 'other', null], default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

subjectRequirementSchema.index({ session: 1, section: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('SubjectRequirement', subjectRequirementSchema);
