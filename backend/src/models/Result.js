const mongoose = require('mongoose');

const subjectMarkSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    obtained: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    grade: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    subjectMarks: { type: [subjectMarkSchema], required: true, default: [] },
    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    gpa: { type: Number },
    grade: { type: String, trim: true },
    position: { type: Number },
    remarks: { type: String, trim: true },
    proofImages: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
