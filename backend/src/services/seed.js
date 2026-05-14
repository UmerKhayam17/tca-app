const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const MODULES = require('../modules/moduleConfig');

const PERMISSIONS = [
  { name: 'manage_users', module: 'user', action: 'create', description: 'Manage users' },
  { name: 'manage_roles', module: 'user', action: 'update', description: 'Manage roles & permissions' },
  { name: 'manage_sessions', module: 'config', action: 'create', description: 'Academic sessions' },
  { name: 'manage_classes', module: 'config', action: 'create', description: 'Classes, sections, subjects' },
  { name: 'temporary_register_student', module: 'admission', action: 'create', description: 'Temporary student registration' },
  { name: 'activate_student', module: 'admission', action: 'approve', description: 'Activate student after fee' },
  { name: 'view_students', module: 'admission', action: 'read', description: 'List and view students' },
  { name: 'update_student_status', module: 'admission', action: 'update', description: 'Change student status' },
  { name: 'mark_attendance', module: 'attendance', action: 'create', description: 'Mark daily attendance' },
  { name: 'correct_attendance', module: 'attendance', action: 'update', description: 'Correct attendance' },
  { name: 'view_attendance', module: 'attendance', action: 'read', description: 'View attendance reports' },
  { name: 'manage_fee_structures', module: 'fee', action: 'create', description: 'Fee structures' },
  { name: 'generate_vouchers', module: 'fee', action: 'create', description: 'Generate fee vouchers' },
  { name: 'record_fee_payment', module: 'fee', action: 'update', description: 'Record fee payment' },
  { name: 'view_fee_reports', module: 'fee', action: 'read', description: 'Fee reports' },
  { name: 'manage_exams', module: 'exam', action: 'create', description: 'Create and manage exams' },
  { name: 'enter_exam_marks', module: 'exam', action: 'update', description: 'Enter marks' },
  { name: 'publish_results', module: 'exam', action: 'approve', description: 'Publish results' },
  { name: 'view_results', module: 'exam', action: 'read', description: 'View results' },
  { name: 'manage_announcements', module: 'announcement', action: 'create', description: 'Announcements' },
  { name: 'manage_assignments', module: 'assignment', action: 'create', description: 'Assignments' },
  { name: 'submit_assignment', module: 'assignment', action: 'update', description: 'Student submission' },
  { name: 'manage_conversations', module: 'chat', action: 'create', description: 'Create chat groups' },
  { name: 'use_chat', module: 'chat', action: 'read', description: 'Participate in chat' },
  { name: 'view_timetables', module: 'config', action: 'read', description: 'View timetables' },
  { name: 'manage_timetables', module: 'config', action: 'update', description: 'Manage timetables' },
];

async function ensureDefaultAdmin() {
  const email = env.seedAdminEmail;
  const adminRole = await Role.findOne({ name: 'admin' });
  if (!adminRole) {
    if (env.nodeEnv !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[seed] Admin role not found; cannot create default admin.');
    }
    return;
  }

  // Get all permissions
  const allPermissions = await Permission.find();
  const permissionIds = allPermissions.map((p) => p._id);

  // Create module permissions map with all modules and all their actions
  const modulePermissions = new Map();
  Object.keys(MODULES).forEach((moduleName) => {
    modulePermissions.set(moduleName, MODULES[moduleName].actions);
  });

  let user = await User.findOne({ email });

  if (!user) {
    const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12);
    await User.create({
      name: env.seedAdminName,
      email,
      password: passwordHash,
      phone: env.seedAdminPhone,
      role: adminRole._id,
      permissions: permissionIds,
      modulePermissions,
      isActive: true,
    });
    if (env.nodeEnv !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[seed] Default admin created: ${email}`);
    }
    return;
  }

  let changed = false;
  if (String(user.role) !== String(adminRole._id)) {
    user.role = adminRole._id;
    changed = true;
  }
  if (!user.isActive) {
    user.isActive = true;
    changed = true;
  }
  if (env.seedAdminResetPassword) {
    user.password = await bcrypt.hash(env.seedAdminPassword, 12);
    changed = true;
  }
  // Always ensure admin has all permissions
  if (!user.permissions || user.permissions.length === 0) {
    user.permissions = permissionIds;
    changed = true;
  }
  // Always ensure admin has all module permissions
  if (!user.modulePermissions || user.modulePermissions.size === 0) {
    user.modulePermissions = modulePermissions;
    changed = true;
  }
  if (changed) {
    await user.save();
    if (env.nodeEnv !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[seed] Default admin updated: ${email}`);
    }
  }
}

async function seedPermissionsAndRoles() {
  const existing = await Permission.countDocuments();
  if (existing === 0) {
    const createdPerms = await Permission.insertMany(PERMISSIONS);
    const byName = (n) => createdPerms.find((p) => p.name === n)._id;

    const allIds = createdPerms.map((p) => p._id);

    const accountantPerms = [
      'activate_student',
      'view_students',
      'generate_vouchers',
      'record_fee_payment',
      'view_fee_reports',
      'use_chat',
      'view_attendance',
      'view_results',
    ].map(byName);

    const teacherPerms = [
      'mark_attendance',
      'correct_attendance',
      'view_attendance',
      'enter_exam_marks',
      'view_results',
      'manage_assignments',
      'manage_announcements',
      'submit_assignment',
      'use_chat',
      'view_students',
      'view_timetables',
    ].map(byName);

    // Combined Parent/Student permissions
    const studentPerms = ['view_attendance', 'view_results', 'use_chat', 'view_timetables', 'submit_assignment'].map(
      byName
    );

    // Module permissions for each role
    const adminModulePerms = new Map();
    Object.keys(MODULES).forEach((moduleName) => {
      adminModulePerms.set(moduleName, MODULES[moduleName].actions);
    });

    const teacherModulePerms = new Map([
      ['attendance', ['view', 'create', 'edit', 'correct']],
      ['exam', ['view', 'create', 'edit']],
      ['assignment', ['view', 'create', 'edit', 'delete', 'submit']],
      ['announcement', ['view', 'create', 'edit', 'delete']],
      ['student', ['view']],
      ['timetable', ['view']],
      ['chat', ['view', 'create', 'participate']],
    ]);

    const studentModulePerms = new Map([
      ['attendance', ['view']],
      ['exam', ['view']],
      ['assignment', ['view', 'submit']],
      ['timetable', ['view']],
      ['chat', ['view', 'create', 'participate']],
    ]);

    const accountantModulePerms = new Map([
      ['student', ['view', 'activate']],
      ['fee', ['view', 'create', 'edit', 'generate', 'record']],
      ['attendance', ['view']],
      ['exam', ['view']],
      ['chat', ['view', 'create', 'participate']],
    ]);

    await Role.insertMany([
      { name: 'admin', permissions: allIds, description: 'Full control', modulePermissions: adminModulePerms },
      { name: 'teacher', permissions: teacherPerms, description: 'Academic', modulePermissions: teacherModulePerms },
      { name: 'student', permissions: studentPerms, description: 'Student and Parent portal', modulePermissions: studentModulePerms },
      { name: 'accountant', permissions: accountantPerms, description: 'Finance', modulePermissions: accountantModulePerms },
    ]);

    if (env.nodeEnv !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[seed] Permissions and roles initialized.');
    }
  }

  await ensureDefaultAdmin();
}

module.exports = { seedPermissionsAndRoles, ensureDefaultAdmin };
