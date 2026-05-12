const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const listRoles = catchAsync(async (req, res) => {
  const roles = await Role.find().populate('permissions').sort({ name: 1 });
  res.json({ success: true, data: roles });
});

const createRole = catchAsync(async (req, res) => {
  const { name, description, permissionIds } = req.body;
  const exists = await Role.findOne({ name });
  if (exists) throw new ApiError(409, 'Role name already exists');
  const role = await Role.create({
    name,
    description,
    permissions: permissionIds,
    isCustom: true,
  });
  res.status(201).json({ success: true, data: role });
});

const listPermissions = catchAsync(async (req, res) => {
  const permissions = await Permission.find().sort({ module: 1, name: 1 });
  res.json({ success: true, data: permissions });
});

module.exports = { listRoles, createRole, listPermissions };
