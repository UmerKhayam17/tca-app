const mongoose = require('mongoose');

const { WEEKDAYS } = require('./timetable/constants');

const SESSION_STATUSES = ['active', 'completed', 'archived'];

const sessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: SESSION_STATUSES, default: 'active', index: true },
    isActive: { type: Boolean, default: false, index: true },
    workingDays: {
      type: [{ type: String, enum: WEEKDAYS }],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    },
    timezone: { type: String, default: 'Asia/Karachi', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isClosed: { type: Boolean, default: false },
    completedAt: { type: Date },
    archivedAt: { type: Date },
    clonedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

sessionSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Session', sessionSchema);
