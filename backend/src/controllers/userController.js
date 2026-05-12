const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const listUsers = catchAsync(async (req, res) => {
  const users = await User.find().populate('role').populate('permissions').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

const createUser = catchAsync(async (req, res) => {
  const { name, email, password, phone, role, permissionIds } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already in use');
  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    password: hash,
    phone,
    role,
    permissions: permissionIds || [],
  });
  res.status(201).json({ success: true, data: user });
});

const updateUser = catchAsync(async (req, res) => {
  const updates = { ...req.body };
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 12);
  }
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('role')
    .populate('permissions');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

const patchPermissions = catchAsync(async (req, res) => {
  const { permissionIds } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { permissions: permissionIds },
    { new: true }
  )
    .populate('role')
    .populate('permissions');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

module.exports = { listUsers, createUser, updateUser, patchPermissions };
