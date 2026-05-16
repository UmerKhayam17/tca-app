/**
 * Canonical list of all academy modules (RBAC + UI routing).
 * Single source of truth — `moduleConfig.js` builds the permission map from this file.
 *
 * - `key` — stored on User.modulePermissions (MongoDB Map keys)
 * - `panelSlug` — frontend panel route segment (must match `ModuleKey` in frontend permissions)
 * - `label` / `icon` — sidebar display (Lucide icon name string)
 * - `actions` — allowed operations for staff module-permission matrix
 */

const SYSTEM_MODULES = [
  {
    key: 'exam',
    panelSlug: 'exams',
    label: 'Exam & Results',
    icon: 'Award',
    description: 'Exams, marks, results, and report cards',
    order: 60,
    actions: ['view', 'create', 'edit', 'delete', 'publish'],
  },
  {
    key: 'assignment',
    panelSlug: 'assignments',
    label: 'Assignments',
    icon: 'BookOpen',
    description: 'Homework, submissions, and grading',
    order: 50,
    actions: ['view', 'create', 'edit', 'delete', 'submit'],
  },
  {
    key: 'attendance',
    panelSlug: 'attendance',
    label: 'Attendance',
    icon: 'ClipboardList',
    description: 'Daily attendance and corrections',
    order: 40,
    actions: ['view', 'create', 'edit', 'delete', 'correct'],
  },
  {
    key: 'student',
    panelSlug: 'students',
    label: 'Students',
    icon: 'GraduationCap',
    description: 'Admission, profiles, and student records',
    order: 30,
    actions: ['view', 'create', 'edit', 'delete', 'activate', 'suspend'],
  },
  {
    key: 'studentManagement',
    panelSlug: 'student-management',
    label: 'Student Management',
    icon: 'School',
    description: 'Classes, subjects, fee structure, enrollment & tuition fees',
    order: 32,
    actions: ['view', 'create', 'edit', 'delete', 'record', 'generate'],
  },
  {
    key: 'fee',
    panelSlug: 'fees',
    label: 'Fees',
    icon: 'Wallet',
    description: 'Fee structures, vouchers, and payments',
    order: 70,
    actions: ['view', 'create', 'edit', 'delete', 'generate', 'record'],
  },
  {
    key: 'timetable',
    panelSlug: 'timetable',
    label: 'Timetable',
    icon: 'Calendar',
    description: 'Class and exam schedules',
    order: 45,
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'announcement',
    panelSlug: 'announcements',
    label: 'Announcements',
    icon: 'Bell',
    description: 'Notices and school-wide messages',
    order: 80,
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'chat',
    panelSlug: 'chat',
    label: 'Chat',
    icon: 'MessageSquare',
    description: 'Messaging between staff, parents, and students',
    order: 90,
    actions: ['view', 'create', 'edit', 'delete', 'participate'],
  },
  {
    key: 'library',
    panelSlug: 'library',
    label: 'Library',
    icon: 'BookOpen',
    description: 'Books, issuance, and inventory',
    order: 100,
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'reports',
    panelSlug: 'reports',
    label: 'Reports',
    icon: 'BarChart3',
    description: 'Analytics and exports',
    order: 110,
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'datasheets',
    panelSlug: 'datasheets',
    label: 'Datasheets',
    icon: 'FileText',
    description: 'Spreadsheets and structured data',
    order: 120,
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'salary',
    panelSlug: 'salary',
    label: 'Salary',
    icon: 'DollarSign',
    description: 'Staff payroll',
    order: 75,
    actions: ['view', 'create', 'edit', 'delete', 'process'],
  },
  {
    key: 'config',
    panelSlug: 'settings',
    label: 'Configuration',
    icon: 'Settings',
    description: 'Sessions, classes, sections, subjects (system setup)',
    order: 200,
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'role',
    panelSlug: 'settings',
    label: 'Roles & permissions',
    icon: 'UserCog',
    description: 'Role definitions and permission overrides',
    order: 210,
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'user',
    panelSlug: 'users',
    label: 'Staff / users',
    icon: 'UserCog',
    description: 'Staff accounts, salary, and module access',
    order: 220,
    actions: ['view', 'create', 'edit', 'delete'],
  },
];

/**
 * Map shape expected by `moduleUtils` and `userController` (key → { name, description, actions }).
 */
function buildModulesMap() {
  const map = {};
  SYSTEM_MODULES.forEach((mod) => {
    map[mod.key] = {
      name: mod.label,
      description: mod.description,
      actions: mod.actions,
    };
  });
  return map;
}

/**
 * Payload for GET /config/system-modules (sidebar + permission UI).
 */
function getSystemModulesForApi() {
  return [...SYSTEM_MODULES]
    .sort((a, b) => a.order - b.order)
    .map((mod) => ({
      key: mod.key,
      panelSlug: mod.panelSlug,
      label: mod.label,
      icon: mod.icon,
      description: mod.description,
      actions: mod.actions,
      order: mod.order,
    }));
}

module.exports = {
  SYSTEM_MODULES,
  buildModulesMap,
  getSystemModulesForApi,
};
