// Per-role module defaults; live access comes from the server via `modulePermissions` on login.
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
  | "staff-management"
  | "student-management"
  | "students"
  | "attendance"
  | "timetable"
  | "exams"
  | "fees"
  | "salary"
  | "expenses"
  | "chat"
  | "announcements"
  | "reports"
  | "datasheets"
  | "system-config"
  | "settings"
  | "permissions"
  | "permission-catalog";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  /** Shorter label for sidebar when the full title would wrap or clip */
  shortLabel?: string;
  icon: string;       // lucide icon name
  desc: string;
}

export const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard", desc: "Overview & key metrics" },
  { key: "staff-management", label: "Staff management", icon: "UserCog", desc: "Teachers and accountants only" },
  { key: "students", label: "Student Records", icon: "GraduationCap", desc: "Enrollment, profiles, attendance & results" },
  {
    key: "student-management",
    label: "Academy setup",
    shortLabel: "Academy setup",
    icon: "School",
    desc: "Classes, subjects, fee structure & tuition billing",
  },
  { key: "attendance", label: "Attendance", icon: "ClipboardList", desc: "Daily attendance" },
  { key: "timetable", label: "Timetable", icon: "Calendar", desc: "Build, publish & view class schedules" },
  {
    key: "exams",
    label: "Tests & exams",
    shortLabel: "Tests & exams",
    icon: "Award",
    desc: "Ongoing tests and term exam results",
  },
  { key: "fees", label: "Fee Management", icon: "Wallet", desc: "Collect and track fees" },
  { key: "salary", label: "Teacher salary", icon: "DollarSign", desc: "Monthly teacher & staff payroll" },
  { key: "expenses", label: "Academy expenses", icon: "Receipt", desc: "Operating costs & expenses" },
  { key: "chat", label: "Chat", icon: "MessageSquare", desc: "Real-time messaging" },
  { key: "announcements", label: "Announcements", icon: "Bell", desc: "Publish notices" },
  { key: "reports", label: "Reports", icon: "BarChart3", desc: "Analytics & exports" },
  { key: "datasheets", label: "Datasheets", icon: "FileText", desc: "Create & manage spreadsheets" },
  { key: "users", label: "Users management", icon: "UserCog", desc: "Manage all users, roles, and access" },
  {
    key: "system-config",
    label: "System configuration",
    shortLabel: "System config",
    icon: "SlidersHorizontal",
    desc: "Sessions, classes, timetable setup & rules",
  },
  { key: "permissions", label: "Permissions", icon: "KeyRound", desc: "Users, roles, API & module access" },
  {
    key: "permission-catalog",
    label: "API permissions",
    shortLabel: "API permissions",
    icon: "ListTree",
    desc: "Full table of permission definitions",
  },
  { key: "settings", label: "Settings", icon: "Settings", desc: "Local permission matrix (browser)" },
];

/** Sidebar section order — modules appear under the first group that lists them. */
export const SIDEBAR_NAV_GROUPS: { id: string; label: string; modules: ModuleKey[] }[] = [
  { id: "overview", label: "Overview", modules: ["dashboard"] },
  {
    id: "academics",
    label: "Students & academics",
    modules: ["students", "student-management", "attendance", "timetable", "exams"],
  },
  { id: "finance", label: "Finance", modules: ["fees", "salary", "expenses"] },
  { id: "communication", label: "Communication", modules: ["chat", "announcements"] },
  { id: "resources", label: "Resources", modules: ["reports", "datasheets"] },
  {
    id: "administration",
    label: "Administration",
    modules: ["users", "staff-management", "system-config", "permissions", "permission-catalog", "settings"],
  },
];

// Default matrix — mirrors the reference spec sheet
export const DEFAULT_PERMISSIONS: Record<Role, Record<ModuleKey, PermLevel>> = {
  admin: {
    dashboard: "full", users: "crud", "staff-management": "crud", "student-management": "crud", students: "crud", attendance: "crud",
    timetable: "crud", exams: "crud", fees: "crud",
    salary: "crud", expenses: "crud", chat: "full", announcements: "crud",
    reports: "full", datasheets: "full", "system-config": "crud", settings: "full", permissions: "full", "permission-catalog": "full",
  },
  accountant: {
    dashboard: "view", users: "none", "staff-management": "none", "student-management": "process", students: "view", attendance: "none",
    timetable: "none", exams: "none", fees: "crud",
    salary: "process", expenses: "crud", chat: "view", announcements: "none",
    reports: "view", datasheets: "crud", "system-config": "none", settings: "none", permissions: "none", "permission-catalog": "none",
  },
  teacher: {
    dashboard: "view", users: "none", "staff-management": "none", "student-management": "view", students: "grade", attendance: "mark",
    timetable: "view", exams: "grade", fees: "none",
    salary: "view", expenses: "none", chat: "view", announcements: "view",
    reports: "view", datasheets: "crud", "system-config": "none", settings: "none", permissions: "none", "permission-catalog": "none",
  },
  parent: {
    dashboard: "view", users: "none", "staff-management": "none", "student-management": "none", students: "view", attendance: "view",
    timetable: "view", exams: "view", fees: "view",
    salary: "none", expenses: "none", chat: "view", announcements: "view",
    reports: "none", datasheets: "view", "system-config": "none", settings: "view", permissions: "none", "permission-catalog": "none",
  },
  student: {
    dashboard: "view", users: "none", "staff-management": "none", "student-management": "none", students: "view", attendance: "view",
    timetable: "view", exams: "view", fees: "view",
    salary: "none", expenses: "none", chat: "view", announcements: "view",
    reports: "none", datasheets: "view", "system-config": "none", settings: "view", permissions: "none", "permission-catalog": "none",
  },
};

const PERM_KEY = "tces_permissions_v1";
const PERM_EVT = "tces-permissions-change";

export const BACKEND_MODULE_KEY_MAP: Record<string, ModuleKey> = {
  exam: "exams",
  attendance: "attendance",
  student: "students",
  studentManagement: "student-management",
  fee: "fees",
  timetable: "timetable",
  announcement: "announcements",
  chat: "chat",
  reports: "reports",
  datasheets: "datasheets",
  salary: "salary",
  academyExpense: "expenses",
  config: "system-config",
  role: "permissions",
  user: "users",
};

const PANEL_MODULE_TO_BACKEND_KEY: Partial<Record<ModuleKey, string>> = (() => {
  const m: Partial<Record<ModuleKey, string>> = {};
  (Object.entries(BACKEND_MODULE_KEY_MAP) as [string, ModuleKey][]).forEach(([backendKey, panelKey]) => {
    m[panelKey] = backendKey;
  });
  return m;
})();

/** Fine-grained UI gates from backend `modulePermissions` action lists or from coarse `PermLevel` defaults. */
export interface ModuleActionCaps {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** Chat: send messages (backend action `participate`). */
  canParticipate: boolean;
}

export function emptyActionCaps(): ModuleActionCaps {
  return {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canParticipate: false,
  };
}

export function sessionHasExplicitModulePayload(
  backendPerms?: Record<string, string[]>,
): boolean {
  if (!backendPerms || typeof backendPerms !== "object") return false;
  return Object.values(backendPerms).some(
    (actions) => Array.isArray(actions) && actions.length > 0,
  );
}

/** Map Mongo action strings to UI capabilities (matrix toggles are independent). */
export function capsFromBackendActions(actions: string[]): ModuleActionCaps {
  const s = new Set((actions || []).map((a) => String(a).toLowerCase()));
  const has = (x: string) => s.has(x);
  const canParticipate = has("participate");
  const canCreate = has("create") || has("generate") || has("publish") || has("approve");
  const canEdit =
    has("edit")
    || has("correct")
    || has("record")
    || has("mark")
    || has("grade")
    || has("process")
    || has("submit")
    || has("activate")
    || has("suspend");
  const canDelete = has("delete");
  const canView =
    has("view")
    || canParticipate
    || canCreate
    || canEdit
    || canDelete;
  return { canView, canCreate, canEdit, canDelete, canParticipate };
}

/** When there is no per-action payload, infer caps from the legacy level matrix. */
export function capsFromPermLevel(p: PermLevel): ModuleActionCaps {
  if (!p || p === "none") return emptyActionCaps();
  if (p === "full" || p === "crud") {
    return { canView: true, canCreate: true, canEdit: true, canDelete: true, canParticipate: true };
  }
  if (p === "view") {
    return { canView: true, canCreate: false, canEdit: false, canDelete: false, canParticipate: false };
  }
  if (p === "mark") {
    return { canView: true, canCreate: false, canEdit: true, canDelete: false, canParticipate: false };
  }
  if (p === "grade") {
    return { canView: true, canCreate: true, canEdit: true, canDelete: false, canParticipate: false };
  }
  if (p === "process") {
    return { canView: true, canCreate: false, canEdit: true, canDelete: false, canParticipate: false };
  }
  return emptyActionCaps();
}

/** Minimal `PermLevel` for routing / coarse checks; use `ModuleActionCaps` for buttons. */
export function permLevelFromActionCaps(caps: ModuleActionCaps): PermLevel {
  if (!caps.canView) return "none";
  if (caps.canDelete) return "crud";
  if (caps.canCreate || caps.canEdit || caps.canParticipate) return "mark";
  return "view";
}

function mergeActionCaps(a: ModuleActionCaps, b: ModuleActionCaps): ModuleActionCaps {
  return {
    canView: a.canView || b.canView,
    canCreate: a.canCreate || b.canCreate,
    canEdit: a.canEdit || b.canEdit,
    canDelete: a.canDelete || b.canDelete,
    canParticipate: a.canParticipate || b.canParticipate,
  };
}

/** Panel Fee Management uses academy APIs under studentManagement permissions. */
function capsForFeesModule(backendPerms: Record<string, string[]>): ModuleActionCaps {
  const feeCaps = capsFromBackendActions(backendPerms.fee || []);
  const academyCaps = capsFromBackendActions(backendPerms.studentManagement || []);
  return mergeActionCaps(feeCaps, academyCaps);
}

function capsForSalaryModule(backendPerms: Record<string, string[]>): ModuleActionCaps {
  const salaryCaps = capsFromBackendActions(backendPerms.salary || []);
  const academyCaps = capsFromBackendActions(backendPerms.studentManagement || []);
  return mergeActionCaps(salaryCaps, academyCaps);
}

function capsForExpensesModule(backendPerms: Record<string, string[]>): ModuleActionCaps {
  const expenseCaps = capsFromBackendActions(backendPerms.academyExpense || []);
  const academyCaps = capsFromBackendActions(backendPerms.studentManagement || []);
  return mergeActionCaps(expenseCaps, academyCaps);
}

export function resolveModuleCaps(
  moduleKey: ModuleKey,
  rolePermLevel: PermLevel,
  backendPerms?: Record<string, string[]>,
): ModuleActionCaps {
  const explicit = sessionHasExplicitModulePayload(backendPerms);
  const backendKey = PANEL_MODULE_TO_BACKEND_KEY[moduleKey];
  if (explicit && backendPerms) {
    if (moduleKey === "fees") {
      return capsForFeesModule(backendPerms);
    }
    if (moduleKey === "salary") {
      return capsForSalaryModule(backendPerms);
    }
    if (moduleKey === "expenses") {
      return capsForExpensesModule(backendPerms);
    }
    if (backendKey !== undefined) {
      if (Object.prototype.hasOwnProperty.call(backendPerms, backendKey)) {
        const arr = backendPerms[backendKey];
        return capsFromBackendActions(Array.isArray(arr) ? arr : []);
      }
      return emptyActionCaps();
    }
    if (moduleKey === "staff-management") {
      const arr = backendPerms.user;
      return capsFromBackendActions(Array.isArray(arr) ? arr : []);
    }
    return emptyActionCaps();
  }
  return capsFromPermLevel(rolePermLevel);
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
    const caps = capsFromBackendActions(actions);
    const level = permLevelFromActionCaps(caps);
    if (level !== "none") next[key] = level;
  });

  if (backendPerms.studentManagement) {
    const feeLevel = permLevelFromActionCaps(capsForFeesModule(backendPerms));
    if (feeLevel !== "none") next.fees = feeLevel;
    const salaryLevel = permLevelFromActionCaps(capsForSalaryModule(backendPerms));
    if (salaryLevel !== "none") next.salary = salaryLevel;
    const expenseLevel = permLevelFromActionCaps(capsForExpensesModule(backendPerms));
    if (expenseLevel !== "none") next.expenses = expenseLevel;
  }
  if (backendPerms.user) {
    const userLevel = permLevelFromActionCaps(capsFromBackendActions(backendPerms.user));
    if (userLevel !== "none") next["staff-management"] = userLevel;
  }
  if (backendPerms.salary) {
    const salaryLevel = permLevelFromActionCaps(capsForSalaryModule(backendPerms));
    if (salaryLevel !== "none") next.salary = salaryLevel;
  }
  if (backendPerms.academyExpense) {
    const expenseLevel = permLevelFromActionCaps(capsForExpensesModule(backendPerms));
    if (expenseLevel !== "none") next.expenses = expenseLevel;
  }

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
