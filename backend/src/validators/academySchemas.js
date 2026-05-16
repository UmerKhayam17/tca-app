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

const academyStudentRegister = Joi.object({
  studentName: Joi.string().trim().required(),
  fatherName: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  address: Joi.string().allow('').optional(),
  classId: objectId.required(),
  selectedSubjects: Joi.array().items(objectId).default([]),
  isFullPackage: Joi.boolean().default(false),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
});

const academyStudentPatch = Joi.object({
  studentName: Joi.string().trim(),
  fatherName: Joi.string().trim(),
  phone: Joi.string().trim(),
  gender: Joi.string().valid('male', 'female', 'other'),
  address: Joi.string().allow(''),
  classId: objectId,
  selectedSubjects: Joi.array().items(objectId),
  isFullPackage: Joi.boolean(),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
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
