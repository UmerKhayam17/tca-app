// Dynamic per-role module permissions, persisted in localStorage.
// Levels (in increasing power): none < view < mark < grade < process < crud < full
// "process" / "mark" / "grade" are role-flavoured aliases that all imply read+write
// on a constrained scope (kept distinct so labels in the UI match the spec sheet).

import { Role } from "./auth";

export type PermLevel =
  | "none"
  | "view"
  | "mark"
  | "grade"
  | "process"
  | "crud"
  | "full";

export const PERM_RANK: Record<PermLevel, number> = {
  none: 0, view: 1, mark: 2, grade: 3, process: 4, crud: 5, full: 6,
};

export const canRead  = (p: PermLevel) => PERM_RANK[p] >= PERM_RANK.view;
export const canWrite = (p: PermLevel) => PERM_RANK[p] >= PERM_RANK.mark;
export const canCRUD  = (p: PermLevel) => PERM_RANK[p] >= PERM_RANK.crud;

export type ModuleKey =
  | "dashboard"
  | "users"
  | "students"
  | "attendance"
  | "timetable"
  | "assignments"
  | "exams"
  | "fees"
  | "salary"
  | "library"
  | "chat"
  | "announcements"
  | "reports"
  | "datasheets"
  | "settings"
  | "permissions"
  | "permission-catalog";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  icon: string;       // lucide icon name
  desc: string;
}

export const MODULES: ModuleDef[] = [
  { key: "dashboard",     label: "Dashboard",       icon: "LayoutDashboard", desc: "Overview & key metrics" },
  { key: "users",         label: "Staff management", icon: "UserCog",         desc: "Teachers, accountants, access & salary" },
  { key: "students",      label: "Student Records", icon: "GraduationCap",   desc: "Profiles & academic data" },
  { key: "attendance",    label: "Attendance",      icon: "ClipboardList",   desc: "Daily attendance" },
  { key: "timetable",     label: "Timetable",       icon: "Calendar",        desc: "Class & exam schedule" },
  { key: "assignments",   label: "Assignments",     icon: "BookOpen",        desc: "Homework & grading" },
  { key: "exams",         label: "Exam & Results",  icon: "Award",           desc: "Marks and report cards" },
  { key: "fees",          label: "Fee Management",  icon: "Wallet",          desc: "Collect and track fees" },
  { key: "salary",        label: "Salary",          icon: "DollarSign",      desc: "Staff payroll" },
  { key: "library",       label: "Library",         icon: "BookOpen",        desc: "Books & issuance" },
  { key: "chat",          label: "Chat",            icon: "MessageSquare",   desc: "Real-time messaging" },
  { key: "announcements", label: "Announcements",   icon: "Bell",            desc: "Publish notices" },
  { key: "reports",       label: "Reports",         icon: "BarChart3",       desc: "Analytics & exports" },
  { key: "datasheets",    label: "Datasheets",      icon: "FileText",        desc: "Create & manage spreadsheets" },
  { key: "permissions",   label: "Permissions",     icon: "KeyRound",        desc: "Users, roles, API & module access" },
  { key: "permission-catalog", label: "All API permissions", icon: "ListTree", desc: "Full table of permission definitions" },
  { key: "settings",      label: "Settings",        icon: "Settings",        desc: "System configuration" },
];

// Default matrix — mirrors the reference spec sheet
export const DEFAULT_PERMISSIONS: Record<Role, Record<ModuleKey, PermLevel>> = {
  admin: {
    dashboard: "full", users: "crud", students: "crud", attendance: "crud",
    timetable: "crud", assignments: "crud", exams: "crud", fees: "crud",
    salary: "crud", library: "crud", chat: "full", announcements: "crud",
    reports: "full", datasheets: "full", settings: "full", permissions: "full", "permission-catalog": "full",
  },
  accountant: {
    dashboard: "view", users: "none", students: "view", attendance: "none",
    timetable: "none", assignments: "none", exams: "none", fees: "crud",
    salary: "process", library: "none", chat: "view", announcements: "none",
    reports: "view", datasheets: "crud", settings: "none", permissions: "none", "permission-catalog": "none",
  },
  teacher: {
    dashboard: "view", users: "none", students: "grade", attendance: "mark",
    timetable: "view", assignments: "grade", exams: "grade", fees: "none",
    salary: "view", library: "view", chat: "view", announcements: "view",
    reports: "view", datasheets: "crud", settings: "none", permissions: "none", "permission-catalog": "none",
  },
  parent: {
    dashboard: "view", users: "none", students: "view", attendance: "view",
    timetable: "view", assignments: "view", exams: "view", fees: "view",
    salary: "none", library: "view", chat: "view", announcements: "view",
    reports: "none", datasheets: "view", settings: "none", permissions: "none", "permission-catalog": "none",
  },
  student: {
    dashboard: "view", users: "none", students: "view", attendance: "view",
    timetable: "view", assignments: "view", exams: "view", fees: "view",
    salary: "none", library: "view", chat: "view", announcements: "view",
    reports: "none", datasheets: "view", settings: "none", permissions: "none", "permission-catalog": "none",
  },
};

const PERM_KEY = "tces_permissions_v1";
const PERM_EVT = "tces-permissions-change";

export const BACKEND_MODULE_KEY_MAP: Record<string, ModuleKey> = {
  exam: "exams",
  assignment: "assignments",
  attendance: "attendance",
  student: "students",
  fee: "fees",
  timetable: "timetable",
  announcement: "announcements",
  chat: "chat",
  library: "library",
  reports: "reports",
  datasheets: "datasheets",
  salary: "salary",
  config: "settings",
  role: "permissions",
  user: "users",
};

function backendActionsToPermLevel(actions: string[]): PermLevel {
  const set = new Set(actions.filter(Boolean).map((a) => String(a).toLowerCase()));
  if (set.has("create") || set.has("edit") || set.has("delete") || set.has("publish") || set.has("process") || set.has("generate") || set.has("record") || set.has("correct") || set.has("submit") || set.has("activate") || set.has("suspend")) {
    return "crud";
  }
  if (set.has("mark") || set.has("grade")) {
    return "crud";
  }
  if (set.has("view") || set.has("participate")) {
    return "view";
  }
  return "none";
}

function emptyPanelMatrix(): Record<ModuleKey, PermLevel> {
  const o = {} as Record<ModuleKey, PermLevel>;
  (Object.keys(DEFAULT_PERMISSIONS.admin) as ModuleKey[]).forEach((k) => {
    o[k] = "none";
  });
  return o;
}

/**
 * Combine default/local role matrix with modulePermissions from `/auth/me`.
 * When the API sends real module rows, the menu is built from that payload only (no extra modules from local defaults).
 * When the payload is empty, keep `rolePerms` (defaults + admin localStorage matrix).
 */
export function applyBackendModulePermissions(
  rolePerms: Record<ModuleKey, PermLevel>,
  backendPerms?: Record<string, string[]>,
): Record<ModuleKey, PermLevel> {
  if (!backendPerms || typeof backendPerms !== "object") return rolePerms;

  const hasExplicitBackend = Object.entries(backendPerms).some(
    ([, actions]) => Array.isArray(actions) && actions.length > 0,
  );
  if (!hasExplicitBackend) return rolePerms;

  const next: Record<ModuleKey, PermLevel> = emptyPanelMatrix();

  Object.entries(backendPerms).forEach(([moduleName, actions]) => {
    const key = BACKEND_MODULE_KEY_MAP[moduleName];
    if (!key || !Array.isArray(actions)) return;
    if (actions.length === 0) {
      next[key] = "none";
      return;
    }
    const level = backendActionsToPermLevel(actions);
    if (level !== "none") next[key] = level;
  });

  return next;
}

export const loadPermissions = (): Record<Role, Record<ModuleKey, PermLevel>> => {
  try {
    const raw = localStorage.getItem(PERM_KEY);
    if (!raw) return DEFAULT_PERMISSIONS;
    const parsed = JSON.parse(raw);
    // Merge with defaults so newly added modules still appear
    const merged: any = {};
    (Object.keys(DEFAULT_PERMISSIONS) as Role[]).forEach((r) => {
      merged[r] = { ...DEFAULT_PERMISSIONS[r], ...(parsed[r] || {}) };
    });
    return merged;
  } catch {
    return DEFAULT_PERMISSIONS;
  }
};

export const savePermissions = (
  perms: Record<Role, Record<ModuleKey, PermLevel>>,
) => {
  localStorage.setItem(PERM_KEY, JSON.stringify(perms));
  window.dispatchEvent(new Event(PERM_EVT));
};

export const resetPermissions = () => {
  localStorage.removeItem(PERM_KEY);
  window.dispatchEvent(new Event(PERM_EVT));
};

export const PERM_CHANGE_EVENT = PERM_EVT;

export const PERM_LABELS: Record<PermLevel, string> = {
  none: "None", view: "View", mark: "Mark/View", grade: "View/Grade",
  process: "Process", crud: "CRUD", full: "Full",
};

export const PERM_OPTIONS: PermLevel[] = ["none", "view", "mark", "grade", "process", "crud", "full"];
