const mongoose = require('mongoose');
const { encrypt } = require('../utils/encryption');

function looksEncrypted(val) {
  const s = String(val);
  const i = s.indexOf(':');
  if (i <= 0) return false;
  const iv = s.slice(0, i);
  return /^[0-9a-f]{32}$/i.test(iv);
}

const documentSchema = new mongoose.Schema(
  {
    name: { type: String },
    url: { type: String },
    type: { type: String },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rollNumber: { type: String, unique: true, sparse: true, trim: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    studentName: { type: String, trim: true },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, trim: true },
    cnicOrBForm: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    address: { type: String, trim: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    parentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    previousSchool: { type: String, trim: true },
    documents: [documentSchema],
    status: {
      type: String,
      enum: ['pending_fee', 'active', 'inactive', 'expelled', 'rejected'],
      default: 'pending_fee',
      index: true,
    },
    admissionDate: { type: Date },
    feeDiscount: { type: Number, default: 0, min: 0, max: 100 },
    contactNumber: { type: String, trim: true },
    desiredClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    admissionFeeAmount: { type: Number },
    paymentDate: { type: Date },
    voucherNumber: { type: String, trim: true },
    paymentMethod: { type: String, trim: true },
    receiptNumber: { type: String, trim: true },
    portalEmail: { type: String, trim: true },
    notificationSent: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

studentSchema.index({ status: 1, session: 1 });

studentSchema.pre('save', function encryptSensitive(next) {
  if (this.isModified('cnicOrBForm') && this.cnicOrBForm && !looksEncrypted(this.cnicOrBForm)) {
    this.cnicOrBForm = encrypt(this.cnicOrBForm);
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
