const catchAsync = require('../../utils/catchAsync');
const importService = require('../../services/academy/academySessionImportService');

const importEnrollment = catchAsync(async (req, res) => {
  const { sourceSessionId, classIds, includeFeeStructure } = req.body;
  const data = await importService.importEnrollmentFromSession(
    req.params.sessionId,
    { sourceSessionId, classIds, includeFeeStructure },
    req.user._id
  );
  res.status(201).json({ success: true, data });
});

module.exports = { importEnrollment };
