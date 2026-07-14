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
  { name: 'manage_conversations', module: 'chat', action: 'create', description: 'Create chat groups' },
  { name: 'use_chat', module: 'chat', action: 'read', description: 'Participate in chat' },
  { name: 'view_timetables', module: 'config', action: 'read', description: 'View timetables' },
  { name: 'manage_timetables', module: 'config', action: 'update', description: 'Manage timetables' },
  { name: 'manage_academy_classes', module: 'studentManagement', action: 'create', description: 'Academy classes (tuition)' },
  { name: 'manage_academy_subjects', module: 'studentManagement', action: 'create', description: 'Academy subjects per class' },
  { name: 'manage_academy_fee_structures', module: 'studentManagement', action: 'create', description: 'Academy fee structures' },
  { name: 'manage_academy_students', module: 'studentManagement', action: 'create', description: 'Register academy students' },
  { name: 'view_academy_students', module: 'studentManagement', action: 'read', description: 'View academy students' },
  { name: 'manage_academy_fees', module: 'studentManagement', action: 'update', description: 'Record academy fee payments' },
  { name: 'view_academy_fee_reports', module: 'studentManagement', action: 'read', description: 'Academy fee reports' },
  { name: 'manage_academy_salaries', module: 'studentManagement', action: 'update', description: 'Teacher salary payroll' },
  { name: 'view_academy_salaries', module: 'studentManagement', action: 'read', description: 'View teacher salaries' },
  { name: 'manage_academy_expenses', module: 'studentManagement', action: 'create', description: 'Academy expenses' },
  { name: 'view_academy_expenses', module: 'studentManagement', action: 'read', description: 'View academy expenses' },
  { name: 'manage_datasheets', module: 'datasheets', action: 'create', description: 'Create and edit datasheets' },
  { name: 'view_datasheets', module: 'datasheets', action: 'read', description: 'View datasheets' },
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

async function upsertAllPermissions() {
  for (const def of PERMISSIONS) {
    await Permission.findOneAndUpdate({ name: def.name }, def, { upsert: true, new: true });
  }
}

async function permissionIdsByNames(names) {
  const ids = await Promise.all(
    names.map(async (name) => {
      const p = await Permission.findOne({ name });
      return p?._id;
    })
  );
  return ids.filter(Boolean);
}

function buildDefaultRoleDefs(allPermissionIds) {
  const adminModulePerms = new Map();
  Object.keys(MODULES).forEach((moduleName) => {
    adminModulePerms.set(moduleName, MODULES[moduleName].actions);
  });

  return {
    admin: {
      name: 'admin',
      permissions: allPermissionIds,
      description: 'Full control',
      modulePermissions: adminModulePerms,
    },
    teacher: {
      name: 'teacher',
      permissionNames: [
        'mark_attendance',
        'correct_attendance',
        'view_attendance',
        'enter_exam_marks',
        'view_results',
        'manage_announcements',
        'use_chat',
        'view_students',
        'view_timetables',
        'view_datasheets',
        'manage_datasheets',
      ],
      description: 'Academic',
      modulePermissions: new Map([
        ['attendance', ['view', 'create', 'edit', 'correct']],
        ['exam', ['view', 'create', 'edit']],
        ['announcement', ['view', 'create', 'edit', 'delete']],
        ['student', ['view']],
        ['studentManagement', ['view']],
        ['timetable', ['view']],
        ['chat', ['view', 'create', 'participate']],
        ['datasheets', ['view', 'create', 'edit', 'delete']],
      ]),
    },
    student: {
      name: 'student',
      permissionNames: ['view_attendance', 'view_results', 'use_chat', 'view_timetables'],
      description: 'Student and Parent portal',
      modulePermissions: new Map([
        ['attendance', ['view']],
        ['exam', ['view']],
        ['timetable', ['view']],
        ['chat', ['view', 'create', 'participate']],
        ['datasheets', ['view']],
      ]),
    },
    parent: {
      name: 'parent',
      permissionNames: [
        'view_attendance',
        'view_results',
        'use_chat',
        'view_timetables',
        'view_academy_students',
        'view_academy_fee_reports',
      ],
      description: 'Parent portal',
      modulePermissions: new Map([
        ['student', ['view']],
        ['attendance', ['view']],
        ['exam', ['view']],
        ['timetable', ['view']],
        ['chat', ['view', 'create', 'participate']],
        ['fee', ['view']],
      ]),
    },
    accountant: {
      name: 'accountant',
      permissionNames: [
        'activate_student',
        'view_students',
        'generate_vouchers',
        'record_fee_payment',
        'view_fee_reports',
        'view_academy_students',
        'manage_academy_fees',
        'view_academy_fee_reports',
        'manage_academy_salaries',
        'view_academy_salaries',
        'manage_academy_expenses',
        'view_academy_expenses',
        'use_chat',
        'view_attendance',
        'view_results',
        'view_datasheets',
        'manage_datasheets',
      ],
      description: 'Finance',
      modulePermissions: new Map([
        ['student', ['view', 'activate']],
        ['fee', ['view', 'create', 'edit', 'generate', 'record']],
        ['studentManagement', ['view', 'record', 'generate', 'create', 'edit', 'delete']],
        ['salary', ['view', 'process', 'generate', 'record']],
        ['academyExpense', ['view', 'create', 'edit', 'delete', 'record']],
        ['attendance', ['view']],
        ['exam', ['view']],
        ['chat', ['view', 'create', 'participate']],
        ['datasheets', ['view', 'create', 'edit', 'delete']],
      ]),
    },
  };
}

async function ensureDefaultRoles() {
  const allPermissions = await Permission.find();
  const allIds = allPermissions.map((p) => p._id);
  const defs = buildDefaultRoleDefs(allIds);
  let createdAny = false;

  for (const def of Object.values(defs)) {
    const exists = await Role.findOne({ name: def.name });
    if (exists) continue;

    const permissions =
      def.permissionNames != null ? await permissionIdsByNames(def.permissionNames) : def.permissions;

    await Role.create({
      name: def.name,
      permissions,
      description: def.description,
      modulePermissions: def.modulePermissions,
    });
    createdAny = true;
    if (env.nodeEnv !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[seed] Role created: ${def.name}`);
    }
  }

  return createdAny;
}

async function syncBuiltInRolePermissions() {
  const adminRole = await Role.findOne({ name: 'admin' });
  if (adminRole) {
    const all = await Permission.find();
    adminRole.permissions = all.map((p) => p._id);
    const mp = adminRole.modulePermissions || new Map();
    if (!mp.has('studentManagement')) {
      mp.set(
        'studentManagement',
        MODULES.studentManagement?.actions || ['view', 'create', 'edit', 'delete', 'record', 'generate']
      );
    }
    if (MODULES.config && !mp.has('config')) {
      mp.set('config', MODULES.config.actions);
    }
    adminRole.modulePermissions = mp;
    await adminRole.save();
  }

  const accountantRole = await Role.findOne({ name: 'accountant' });
  if (accountantRole) {
    const extra = await permissionIdsByNames([
      'view_academy_students',
      'manage_academy_fees',
      'view_academy_fee_reports',
      'manage_academy_salaries',
      'view_academy_salaries',
      'manage_academy_expenses',
      'view_academy_expenses',
    ]);
    const set = new Set((accountantRole.permissions || []).map(String));
    extra.forEach((id) => set.add(String(id)));
    accountantRole.permissions = [...set];
    const mp = accountantRole.modulePermissions || new Map();
    if (!mp.has('studentManagement')) {
      mp.set('studentManagement', ['view', 'record', 'generate', 'create', 'edit']);
    }
    if (!mp.has('salary')) {
      mp.set('salary', ['view', 'process', 'generate', 'record']);
    }
    if (!mp.has('academyExpense')) {
      mp.set('academyExpense', ['view', 'create', 'edit', 'record']);
    }
    accountantRole.modulePermissions = mp;
    await accountantRole.save();
  }

  const parentRole = await Role.findOne({ name: 'parent' });
  if (parentRole) {
    const parentPerms = await permissionIdsByNames([
      'view_attendance',
      'view_results',
      'use_chat',
      'view_timetables',
      'view_academy_students',
      'view_academy_fee_reports',
    ]);
    parentRole.permissions = parentPerms;
    parentRole.modulePermissions = new Map([
      ['student', ['view']],
      ['attendance', ['view']],
      ['exam', ['view']],
      ['timetable', ['view']],
      ['chat', ['view', 'create', 'participate']],
      ['fee', ['view']],
    ]);
    await parentRole.save();
  }
}

/** Rename old `academy*` collections to clean names; drop leftover junk. */
async function dropLegacyDuplicateCollections() {
  const mongoose = require('mongoose');
  const db = mongoose.connection.db;
  if (!db) return;

  const renames = [
    ['academystudents', 'students'],
    ['academyclasses', 'classes'],
    ['academysections', 'sections'],
    ['academysubjects', 'subjects'],
    ['academyfeestructures', 'feestructures'],
    ['academyfeerecords', 'feerecords'],
    ['academyattendances', 'attendances'],
    ['academyassessments', 'assessments'],
    ['academyclasstests', 'classtests'],
    ['academyexpenses', 'expenses'],
    ['academysalaryrecords', 'salaryrecords'],
  ];

  const dropOnly = [
    'feevouchers',
    'timetables',
    'academyclasstimetables',
    'subjectrequirements',
  ];

  const existing = await db.listCollections().toArray();
  const names = new Set(existing.map((c) => c.name));

  for (const [from, to] of renames) {
    if (!names.has(from)) continue;
    if (names.has(to)) {
      await db.dropCollection(from);
      // eslint-disable-next-line no-console
      console.log(`[seed] Dropped duplicate old collection: ${from} (kept ${to})`);
    } else {
      await db.renameCollection(from, to);
      names.delete(from);
      names.add(to);
      // eslint-disable-next-line no-console
      console.log(`[seed] Renamed collection ${from} → ${to}`);
    }
  }

  // Flatten legacy choice-group docs onto subjects, then drop those collections.
  for (const collName of ['subjectchoicegroups', 'academysubjectchoicegroups']) {
    if (!names.has(collName)) continue;
    const groups = await db.collection(collName).find({}).toArray();
    let stamped = 0;
    for (const grp of groups) {
      const subjectIds = grp.subjectIds || [];
      if (!subjectIds.length || !grp.groupName) continue;
      const pickCount = Math.max(1, Number(grp.pickCount) || 1);
      const result = await db.collection('subjects').updateMany(
        { _id: { $in: subjectIds } },
        {
          $set: {
            enrollmentType: 'choice',
            choiceGroupName: String(grp.groupName).trim(),
            pickCount,
          },
        }
      );
      stamped += result.modifiedCount || 0;
    }
    await db.dropCollection(collName);
    names.delete(collName);
    // eslint-disable-next-line no-console
    console.log(
      `[seed] Migrated ${groups.length} choice group(s) → subjects (${stamped} updated), dropped ${collName}`
    );
  }

  for (const name of dropOnly) {
    if (!names.has(name)) continue;
    await db.dropCollection(name);
    // eslint-disable-next-line no-console
    console.log(`[seed] Dropped legacy collection: ${name}`);
  }
}

async function seedPermissionsAndRoles() {
  const { ensureAcademyClassIndexes } = require('./academy/academySessionImportService');
  const { ensureDefaultAcademyStructure } = require('./academy/academyDefaultStructureService');
  const Session = require('../models/Session');
  await ensureAcademyClassIndexes();
  await dropLegacyDuplicateCollections();
  await upsertAllPermissions();
  const rolesCreated = await ensureDefaultRoles();
  await syncBuiltInRolePermissions();
  await ensureDefaultAdmin();

  const sessions = await Session.find().select('_id');
  const adminUser = await User.findOne({ email: env.seedAdminEmail });
  const userId = adminUser?._id;
  if (userId) {
    for (const s of sessions) {
      await ensureDefaultAcademyStructure(s._id, userId);
    }
  }

  if (rolesCreated && env.nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[seed] Default roles initialized.');
  }
}

module.exports = { seedPermissionsAndRoles, ensureDefaultAdmin, dropLegacyDuplicateCollections };
