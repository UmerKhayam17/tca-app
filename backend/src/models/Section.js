const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    maxStudents: { type: Number, default: 40 },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

sectionSchema.index({ class: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
