const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 40 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

subjectSchema.index({ class: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
