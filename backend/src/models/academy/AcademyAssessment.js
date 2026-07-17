const mongoose = require('mongoose');

const academyAssessmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademyStudent',
      required: true,
      index: true,
    },
    classTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademyClassTest',
      index: true,
    },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademySubject' },
    title: { type: String, required: true, trim: true },
    assessmentType: {
      type: String,
      enum: ['quiz', 'weekly', 'monthly', 'midterm', 'final', 'assignment', 'practice', 'other'],
      default: 'monthly',
    },
    examDate: { type: Date, required: true, index: true },
    totalMarks: { type: Number, required: true, min: 0 },
    obtainedMarks: { type: Number, required: true, min: 0 },
    remarks: { type: String, trim: true },
    /** URL path to scanned/photo of the student's test paper (e.g. /uploads/test-papers/...). */
    testPaperImage: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'assessments' }
);

module.exports = mongoose.model('AcademyAssessment', academyAssessmentSchema);
