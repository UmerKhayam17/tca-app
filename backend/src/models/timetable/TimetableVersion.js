const mongoose = require('mongoose');
const { TIMETABLE_STATUSES } = require('./constants');

const timetableVersionSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    periodTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'PeriodTemplate', required: true },
    status: { type: String, enum: TIMETABLE_STATUSES, default: 'draft', index: true },
    version: { type: Number, default: 1, min: 1 },
    effectiveFrom: { type: Date },
    publishedAt: { type: Date },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true, default: '' },
    generationMeta: {
      engine: { type: String },
      jobId: { type: String },
      score: { type: Number },
      unplacedCount: { type: Number },
      ranAt: { type: Date },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

timetableVersionSchema.index(
  { session: 1, section: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'published' },
  }
);

module.exports = mongoose.model('TimetableVersion', timetableVersionSchema);
