const mongoose = require('mongoose');

const academyClassSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', index: true },
    className: { type: String, required: true, trim: true },
    totalSubjects: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

academyClassSchema.index({ sessionId: 1, className: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('AcademyClass', academyClassSchema);
