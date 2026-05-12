const mongoose = require('mongoose');

const fileAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String },
    url: { type: String },
    type: { type: String },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    fileUrl: { type: String },
    submittedAt: { type: Date, default: Date.now },
    marks: { type: Number },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, required: true },
    attachments: [fileAttachmentSchema],
    totalMarks: { type: Number },
    submissions: [submissionSchema],
    status: {
      type: String,
      enum: ['active', 'closed', 'graded'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
