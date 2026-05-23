const mongoose = require('mongoose');

const datasheetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    columns: { type: [String], default: [] },
    rows: { type: [[String]], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

datasheetSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Datasheet', datasheetSchema);
