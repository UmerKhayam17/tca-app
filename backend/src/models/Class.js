const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

classSchema.index({ session: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
