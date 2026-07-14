const mongoose = require('mongoose');
const { PERIOD_TYPES } = require('./constants');

const periodSlotSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true, min: 1 },
    label: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    type: { type: String, enum: PERIOD_TYPES, default: 'lecture' },
  },
  { _id: true }
);

const breakSchema = new mongoose.Schema(
  {
    breakName: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const periodTemplateSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    name: { type: String, trim: true, default: 'Academy timetable configuration' },
    academyStartTime: { type: String, required: true, trim: true },
    academyEndTime: { type: String, required: true, trim: true },
    periodDurationMinutes: { type: Number, required: true, min: 1 },
    breaks: { type: [breakSchema], default: [] },
    slots: { type: [periodSlotSchema], default: [] },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

periodTemplateSchema.index({ session: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PeriodTemplate', periodTemplateSchema);
