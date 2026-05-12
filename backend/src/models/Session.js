const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isClosed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
