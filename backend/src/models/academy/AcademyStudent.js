const mongoose = require('mongoose');

const academyStudentSchema = new mongoose.Schema(
  {
    studentId: { type: String, unique: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    address: { type: String, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademyClass', required: true, index: true },
    selectedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AcademySubject' }],
    isFullPackage: { type: Boolean, default: false },
    monthlyFee: { type: Number, required: true, min: 0 },
    admissionFee: { type: Number, required: true, min: 0 },
    totalFee: { type: Number, required: true, min: 0 },
    feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademyFeeStructure' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

academyStudentSchema.index({ studentName: 'text', fatherName: 'text', phone: 'text', studentId: 'text' });

module.exports = mongoose.model('AcademyStudent', academyStudentSchema);
