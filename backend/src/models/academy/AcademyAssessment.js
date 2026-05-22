const mongoose = require('mongoose');

const academyAssessmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademyStudent',
      required: true,
      index: true,
    },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademySubject' },
    title: { type: String, required: true, trim: true },
    assessmentType: {
      type: String,
      enum: ['quiz', 'monthly', 'midterm', 'final', 'assignment', 'other'],
      default: 'monthly',
    },
    examDate: { type: Date, required: true, index: true },
    totalMarks: { type: Number, required: true, min: 0 },
    obtainedMarks: { type: Number, required: true, min: 0 },
    remarks: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademyAssessment', academyAssessmentSchema);
