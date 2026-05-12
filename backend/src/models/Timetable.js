const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    periods: { type: [periodSchema], default: [] },
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    schedule: { type: [dayScheduleSchema], required: true, default: [] },
    effectiveFrom: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timetableSchema.index({ class: 1, section: 1, session: 1, isActive: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
