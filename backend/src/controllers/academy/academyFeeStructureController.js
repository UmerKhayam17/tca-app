const catchAsync = require('../../utils/catchAsync');
const feeStructureService = require('../../services/academy/academyFeeStructureService');

const getByClass = catchAsync(async (req, res) => {
  const data = await feeStructureService.getByClass(req.params.classId);
  res.json({ success: true, data: data || null });
});

const create = catchAsync(async (req, res) => {
  const data = await feeStructureService.createStructure(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await feeStructureService.updateStructure(req.params.id, req.body);
  res.json({ success: true, data });
});

const preview = catchAsync(async (req, res) => {
  const data = await feeStructureService.previewFees(req.body);
  res.json({ success: true, data });
});

module.exports = { getByClass, create, update, preview };
