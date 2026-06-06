const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema(
  {
    institutionName: { type: String, trim: true },
    className: { type: String, trim: true },
    totalMarks: { type: Number, min: 0 },
    obtainedMarks: { type: Number, min: 0 },
    percentage: { type: Number, min: 0, max: 100 },
    year: { type: String, trim: true },
  },
  { _id: false }
);

const academyStudentSchema = new mongoose.Schema(
  {
    studentId: { type: String, unique: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    /** URL path to student photo (e.g. /uploads/students/...). */
    photoImage: { type: String, trim: true },
    fatherName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    nationality: { type: String, trim: true, default: 'Pakistan' },
    guardianName: { type: String, trim: true },
    guardianRelation: { type: String, trim: true },
    fatherGuardianCnic: { type: String, trim: true },
    guardianOccupation: { type: String, trim: true },
    guardianWorkAddress: { type: String, trim: true },
    guardianEmail: { type: String, trim: true },
    studentEmail: { type: String, trim: true },
    postalAddress: { type: String, trim: true },
    contactPhoneRes: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    permanentAddress: { type: String, trim: true },
    currentSchoolCollege: { type: String, trim: true },
    academicHistory: [academicRecordSchema],
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    /** @deprecated use postalAddress */
    address: { type: String, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademyClass', required: true, index: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademySection', index: true },
    selectedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AcademySubject' }],
    isFullPackage: { type: Boolean, default: false },
    monthlyFee: { type: Number, required: true, min: 0 },
    admissionFee: { type: Number, required: true, min: 0 },
    /** One-time discount on monthly/subject fee (first payment). */
    monthlyFeeDiscount: { type: Number, default: 0, min: 0 },
    /** One-time discount on admission fee (first payment). */
    admissionFeeDiscount: { type: Number, default: 0, min: 0 },
    /** Total discount applied (monthly + admission); kept for legacy records and summaries. */
    discountAmount: { type: Number, default: 0, min: 0 },
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

academyStudentSchema.index({
  studentName: 'text',
  fatherName: 'text',
  phone: 'text',
  studentId: 'text',
  guardianName: 'text',
});

module.exports = mongoose.model('AcademyStudent', academyStudentSchema);
