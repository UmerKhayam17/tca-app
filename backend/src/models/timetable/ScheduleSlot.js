const mongoose = require('mongoose');
const { WEEKDAYS, SLOT_SOURCES } = require('./constants');

const scheduleSlotSchema = new mongoose.Schema(
  {
    timetableVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimetableVersion',
      required: true,
      index: true,
    },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    day: { type: String, enum: WEEKDAYS, required: true },
    periodId: { type: mongoose.Schema.Types.ObjectId, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    isSubstitute: { type: Boolean, default: false },
    substituteForTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: SLOT_SOURCES, default: 'manual' },
    locked: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

scheduleSlotSchema.index({ timetableVersion: 1, day: 1, periodId: 1 }, { unique: true });
scheduleSlotSchema.index({ session: 1, day: 1, periodId: 1, teacher: 1 });
scheduleSlotSchema.index({ session: 1, day: 1, periodId: 1, room: 1 });

module.exports = mongoose.model('ScheduleSlot', scheduleSlotSchema);
