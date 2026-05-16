const mongoose = require('mongoose');

const academyClassSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    totalSubjects: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

academyClassSchema.index({ className: 1 }, { unique: true });

module.exports = mongoose.model('AcademyClass', academyClassSchema);
