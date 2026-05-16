const mongoose = require('mongoose');
const { WEEKDAYS } = require('./constants');

const timetableSettingsSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
    defaultPeriodTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'PeriodTemplate' },
    defaultMaxTeacherPerDay: { type: Number, default: 6, min: 1 },
    defaultMaxConsecutive: { type: Number, default: 2, min: 1 },
    allowDoublePeriods: { type: Boolean, default: true },
    autoAssignRooms: { type: Boolean, default: true },
    conflictCheckOnDraft: { type: Boolean, default: true },
    publishRequiresCompleteQuotas: { type: Boolean, default: true },
    gridStartDay: { type: String, enum: WEEKDAYS, default: 'monday' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TimetableSettings', timetableSettingsSchema);
