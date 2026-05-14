const catchAsync = require('../utils/catchAsync');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const listRoles = catchAsync(async (req, res) => {
  const roles = await Role.find().select('_id name description isCustom').sort({ name: 1 });
  res.json({ success: true, data: roles });
});

const listPermissions = catchAsync(async (req, res) => {
  const rows = await Permission.find().sort({ module: 1, name: 1 }).lean();
  res.json({ success: true, data: rows });
});

module.exports = { listRoles, listPermissions };
