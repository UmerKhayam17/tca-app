const ApiError = require('../../utils/ApiError');
const AcademyFeeStructure = require('../../models/academy/AcademyFeeStructure');
const AcademyClass = require('../../models/academy/AcademyClass');

async function getByClass(classId) {
  const cls = await AcademyClass.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  const row = await AcademyFeeStructure.findOne({ classId, status: 'active' })
    .sort({ effectiveDate: -1 })
    .populate('classId', 'className');
  return row;
}

async function createStructure(payload, userId) {
  const cls = await AcademyClass.findById(payload.classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  if (payload.status !== 'inactive') {
    await AcademyFeeStructure.updateMany(
      { classId: payload.classId, status: 'active' },
      { $set: { status: 'inactive' } }
    );
  }
  return AcademyFeeStructure.create({
    ...payload,
    createdBy: userId,
    effectiveDate: payload.effectiveDate || new Date(),
  });
}

async function updateStructure(id, payload) {
  const doc = await AcademyFeeStructure.findById(id);
  if (!doc) throw new ApiError(404, 'Fee structure not found');
  if (payload.perSubjectFee !== undefined) doc.perSubjectFee = payload.perSubjectFee;
  if (payload.fullPackageFee !== undefined) doc.fullPackageFee = payload.fullPackageFee;
  if (payload.admissionFee !== undefined) doc.admissionFee = payload.admissionFee;
  if (payload.effectiveDate) doc.effectiveDate = payload.effectiveDate;
  if (payload.status) {
    if (payload.status === 'active') {
      await AcademyFeeStructure.updateMany(
        { classId: doc.classId, status: 'active', _id: { $ne: id } },
        { $set: { status: 'inactive' } }
      );
    }
    doc.status = payload.status;
  }
  await doc.save();
  return doc.populate('classId', 'className');
}

function calculateFeesFromStructure(feeStructure, { selectedSubjectIds, isFullPackage }) {
  let monthlyFee;
  if (isFullPackage) {
    monthlyFee = feeStructure.fullPackageFee;
  } else {
    const count = Array.isArray(selectedSubjectIds) ? selectedSubjectIds.length : 0;
    if (count === 0 && !isFullPackage) {
      throw new ApiError(400, 'Select at least one subject or enroll in full package');
    }
    monthlyFee = count * feeStructure.perSubjectFee;
  }
  const admissionFee = feeStructure.admissionFee;
  const totalFee = monthlyFee + admissionFee;
  return { monthlyFee, admissionFee, totalFee };
}

async function previewFees({ classId, selectedSubjects, isFullPackage }) {
  const feeStructure = await getByClass(classId);
  if (!feeStructure) throw new ApiError(400, 'No active fee structure for this class');
  return {
    ...calculateFeesFromStructure(feeStructure, {
      selectedSubjectIds: selectedSubjects,
      isFullPackage,
    }),
    feeStructureId: feeStructure._id,
    perSubjectFee: feeStructure.perSubjectFee,
    fullPackageFee: feeStructure.fullPackageFee,
  };
}

module.exports = {
  getByClass,
  createStructure,
  updateStructure,
  calculateFeesFromStructure,
  previewFees,
};
