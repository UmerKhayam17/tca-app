const mongoose = require('mongoose');

const dateSheetEntrySchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    date: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dateSheet: [dateSheetEntrySchema],
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
