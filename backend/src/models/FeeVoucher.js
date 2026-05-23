const mongoose = require('mongoose');

const feeVoucherSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    feeStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    fine: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'waived'],
      default: 'pending',
      index: true,
    },
    paidAt: { type: Date },
    paymentMethod: { type: String, trim: true },
    receiptNumber: { type: String, unique: true, sparse: true, trim: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

feeVoucherSchema.index({ student: 1, year: 1, month: 1, feeStructure: 1 });

module.exports = mongoose.model('FeeVoucher', feeVoucherSchema);
