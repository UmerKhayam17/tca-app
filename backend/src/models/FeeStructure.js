const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    type: { type: String, enum: ['monthly', 'one_time', 'annual'], required: true },
    amount: { type: Number, required: true, min: 0 },
    dueDay: { type: Number, default: 10, min: 1, max: 28 },
    finePerDay: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

feeStructureSchema.index({ class: 1, session: 1, name: 1 });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
