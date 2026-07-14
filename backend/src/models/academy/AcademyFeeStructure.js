const mongoose = require('mongoose');

const academyFeeStructureSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademyClass', required: true, index: true },
    perSubjectFee: { type: Number, required: true, min: 0 },
    fullPackageFee: { type: Number, required: true, min: 0 },
    admissionFee: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    effectiveDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'feestructures' }
);

academyFeeStructureSchema.index({ classId: 1, effectiveDate: -1 });

module.exports = mongoose.model('AcademyFeeStructure', academyFeeStructureSchema);
