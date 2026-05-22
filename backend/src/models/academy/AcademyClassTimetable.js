const mongoose = require('mongoose');

const academyClassTimetableSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademyClass',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademySubject',
      required: true,
    },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    room: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

academyClassTimetableSchema.index(
  { classId: 1, dayOfWeek: 1, startTime: 1, subjectId: 1 },
  { unique: true }
);

module.exports = mongoose.model('AcademyClassTimetable', academyClassTimetableSchema);
