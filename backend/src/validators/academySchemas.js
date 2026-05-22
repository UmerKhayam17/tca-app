const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const academyClassBody = Joi.object({
  className: Joi.string().trim().required(),
  totalSubjects: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});

const academyClassPatch = academyClassBody.min(1);

const academySubjectBody = Joi.object({
  subjectName: Joi.string().trim().required(),
  classId: objectId.required(),
  subjectCode: Joi.string().trim().required(),
  status: Joi.string().valid('active', 'inactive').optional(),
});

const academySubjectPatch = Joi.object({
  subjectName: Joi.string().trim(),
  subjectCode: Joi.string().trim(),
  status: Joi.string().valid('active', 'inactive'),
}).min(1);

const academyFeeStructureBody = Joi.object({
  classId: objectId.required(),
  perSubjectFee: Joi.number().min(0).required(),
  fullPackageFee: Joi.number().min(0).required(),
  admissionFee: Joi.number().min(0).required(),
  status: Joi.string().valid('active', 'inactive').optional(),
  effectiveDate: Joi.date().optional(),
});

const academyFeeStructurePatch = Joi.object({
  perSubjectFee: Joi.number().min(0),
  fullPackageFee: Joi.number().min(0),
  admissionFee: Joi.number().min(0),
  status: Joi.string().valid('active', 'inactive'),
  effectiveDate: Joi.date(),
}).min(1);

const academicRecord = Joi.object({
  institutionName: Joi.string().allow('').trim(),
  className: Joi.string().allow('').trim(),
  totalMarks: Joi.number().min(0).allow(null, ''),
  obtainedMarks: Joi.number().min(0).allow(null, ''),
  percentage: Joi.number().min(0).max(100).allow(null, ''),
  year: Joi.string().allow('').trim(),
});

const studentProfileFields = {
  dateOfBirth: Joi.date().required(),
  nationality: Joi.string().trim().default('Pakistan'),
  guardianName: Joi.string().allow('').trim(),
  guardianRelation: Joi.string().allow('').trim(),
  fatherGuardianCnic: Joi.string().allow('').trim(),
  guardianOccupation: Joi.string().allow('').trim(),
  guardianWorkAddress: Joi.string().allow('').trim(),
  guardianEmail: Joi.string().trim().allow('').empty('').email({ tlds: { allow: false } }),
  studentEmail: Joi.string().trim().allow('').empty('').email({ tlds: { allow: false } }),
  postalAddress: Joi.string().allow('').trim(),
  contactPhoneRes: Joi.string().allow('').trim(),
  mobileNo: Joi.string().trim(),
  permanentAddress: Joi.string().allow('').trim(),
  currentSchoolCollege: Joi.string().allow('').trim(),
  academicHistory: Joi.array().items(academicRecord).default([]),
  address: Joi.string().allow('').trim(),
};

const academyStudentRegister = Joi.object({
  studentName: Joi.string().trim().required(),
  fatherName: Joi.string().trim().required(),
  phone: Joi.string().trim(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  classId: objectId.required(),
  selectedSubjects: Joi.array().items(objectId).default([]),
  isFullPackage: Joi.boolean().default(false),
  discountAmount: Joi.number().min(0).default(0),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
  ...studentProfileFields,
}).or('phone', 'mobileNo');

const academyStudentPatch = Joi.object({
  studentName: Joi.string().trim(),
  fatherName: Joi.string().trim(),
  phone: Joi.string().trim(),
  gender: Joi.string().valid('male', 'female', 'other'),
  classId: objectId,
  selectedSubjects: Joi.array().items(objectId),
  isFullPackage: Joi.boolean(),
  discountAmount: Joi.number().min(0),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
  dateOfBirth: Joi.date(),
  nationality: Joi.string().trim(),
  guardianName: Joi.string().allow('').trim(),
  guardianRelation: Joi.string().allow('').trim(),
  fatherGuardianCnic: Joi.string().allow('').trim(),
  guardianOccupation: Joi.string().allow('').trim(),
  guardianWorkAddress: Joi.string().allow('').trim(),
  guardianEmail: Joi.string().trim().allow('').empty('').email({ tlds: { allow: false } }),
  studentEmail: Joi.string().trim().allow('').empty('').email({ tlds: { allow: false } }),
  postalAddress: Joi.string().allow('').trim(),
  contactPhoneRes: Joi.string().allow('').trim(),
  mobileNo: Joi.string().trim(),
  permanentAddress: Joi.string().allow('').trim(),
  currentSchoolCollege: Joi.string().allow('').trim(),
  academicHistory: Joi.array().items(academicRecord),
  address: Joi.string().allow('').trim(),
}).min(1);

const academyFeePay = Joi.object({
  paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'online', 'other').default('cash'),
  notes: Joi.string().allow('').optional(),
});

const academyFeeGenerate = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
  classId: objectId.optional(),
});

const feePreview = Joi.object({
  classId: objectId.required(),
  selectedSubjects: Joi.array().items(objectId).default([]),
  isFullPackage: Joi.boolean().default(false),
  discountAmount: Joi.number().min(0).default(0),
});

module.exports = {
  academyClassBody,
  academyClassPatch,
  academySubjectBody,
  academySubjectPatch,
  academyFeeStructureBody,
  academyFeeStructurePatch,
  academyStudentRegister,
  academyStudentPatch,
  academyFeePay,
  academyFeeGenerate,
  feePreview,
};
