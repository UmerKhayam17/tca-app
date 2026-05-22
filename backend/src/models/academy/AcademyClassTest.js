const mongoose = require('mongoose');

const academyClassTestSchema = new mongoose.Schema(
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
    title: { type: String, required: true, trim: true },
    assessmentType: {
      type: String,
      enum: ['quiz', 'weekly', 'monthly', 'midterm', 'final', 'assignment', 'practice', 'other'],
      default: 'quiz',
    },
    examDate: { type: Date, required: true, index: true },
    totalMarks: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademyClassTest', academyClassTestSchema);
