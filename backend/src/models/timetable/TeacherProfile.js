const mongoose = require('mongoose');
const { WEEKDAYS } = require('./constants');

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String, enum: WEEKDAYS, required: true },
    periodIds: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { _id: false }
);

const teacherProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AcademySubject' }],
    maxLecturesPerDay: { type: Number, default: 6, min: 1 },
    maxLecturesPerWeek: { type: Number, default: 30, min: 1 },
    availability: { type: [availabilitySchema], default: [] },
    preferredRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

teacherProfileSchema.index({ user: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
