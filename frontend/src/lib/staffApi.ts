import { getApiRoot, parseJson } from "@/lib/api";
import { authedFetch } from "@/lib/auth";

export interface RoleOption {
  _id: string;
  name: string;
}

export interface ModuleRegistryEntry {
  key: string;
  name: string;
  description: string;
  actions: string[];
}

export interface LinkedStudentSummary {
  _id: string;
  studentId: string;
  studentName: string;
  className?: string | null;
  sectionName?: string | null;
  status?: string;
}

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  salary?: number;
  profileImage?: string;
  modulePermissions?: Record<string, string[]>;
  role?: RoleOption | string;
  createdAt?: string;
  /** Populated for parent users on GET /users (all-users list). */
  linkedStudents?: LinkedStudentSummary[];
}

/** Permission row from Mongo (GET /permissions). */
export interface PermissionDefinition {
  _id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

export interface UserWithAccess extends StaffUser {
  permissions?: PermissionDefinition[];
}

export function normalizeModulePermissions(raw: StaffUser["modulePermissions"]): Record<string, string[]> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string[]> = {};
  Object.entries(raw).forEach(([k, v]) => {
    if (Array.isArray(v)) out[k] = [...v];
  });
  return out;
}

export async function fetchStaffUsers(): Promise<StaffUser[]> {
  const res = await authedFetch("/users?staff=1");
  const body = await parseJson<{ success?: boolean; data?: StaffUser[] }>(res);
  if (!res.ok || !body.data) return [];
  return body.data;
}

export async function fetchAllUsers(): Promise<UserWithAccess[]> {
  const res = await authedFetch("/users");
  const body = await parseJson<{ success?: boolean; data?: UserWithAccess[] }>(res);
  if (!res.ok || !body.data) return [];
  return body.data;
}

export async function fetchPermissionCatalog(): Promise<PermissionDefinition[]> {
  const res = await authedFetch("/permissions");
  const body = await parseJson<{ success?: boolean; data?: PermissionDefinition[] }>(res);
  if (!res.ok || !body.data) return [];
  return body.data;
}

export async function fetchModuleRegistry(): Promise<ModuleRegistryEntry[]> {
  const res = await authedFetch("/users/modules-registry");
  const body = await parseJson<{ success?: boolean; data?: { modules?: ModuleRegistryEntry[] } }>(res);
  if (!res.ok || !body.data?.modules) return [];
  return body.data.modules;
}

export async function fetchAllRoles(): Promise<RoleOption[]> {
  const res = await authedFetch("/roles");
  const body = await parseJson<{ success?: boolean; data?: RoleOption[] }>(res);
  if (!res.ok || !body.data) return [];
  return body.data;
}

export function staffRolesOnly(roles: RoleOption[]): RoleOption[] {
  const allow = new Set(["teacher", "accountant", "parent"]);
  return roles.filter((r) => allow.has(String(r.name).toLowerCase()));
}

export async function fetchParentStudents(parentUserId: string): Promise<LinkedStudentSummary[]> {
  const res = await authedFetch(`/users/${parentUserId}/parent-students`);
  const body = await parseJson<{ success?: boolean; data?: LinkedStudentSummary[]; message?: string }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to load parent students");
  return body.data || [];
}

export async function assignParentStudents(parentUserId: string, studentIds: string[]): Promise<void> {
  const res = await authedFetch(`/users/${parentUserId}/parent-students`, {
    method: "PATCH",
    body: JSON.stringify({ studentIds }),
  });
  const body = await parseJson<{ success?: boolean; message?: string }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to assign parent students");
}

export async function createStaffUser(payload: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  isActive?: boolean;
  salary?: number;
  modulePermissions?: Record<string, string[]>;
}): Promise<StaffUser> {
  const res = await authedFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await parseJson<{ success?: boolean; message?: string; data?: StaffUser }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to create staff");
  if (!body.data) throw new Error("Invalid response");
  return body.data;
}

export async function updateStaffUser(
  id: string,
  payload: Partial<{
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    salary: number;
    password: string;
    modulePermissions: Record<string, string[]>;
  }>,
): Promise<StaffUser> {
  const res = await authedFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const body = await parseJson<{ success?: boolean; message?: string; data?: StaffUser }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to update staff");
  if (!body.data) throw new Error("Invalid response");
  return body.data;
}

export async function patchUserPermissionIds(userId: string, permissionIds: string[]): Promise<UserWithAccess> {
  const res = await authedFetch(`/users/${userId}/permissions`, {
    method: "PATCH",
    body: JSON.stringify({ permissionIds }),
  });
  const body = await parseJson<{ success?: boolean; message?: string; data?: UserWithAccess }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to update API permissions");
  if (!body.data) throw new Error("Invalid response");
  return body.data;
}

export async function uploadStaffProfilePhoto(userId: string, file: File): Promise<StaffUser> {
  const fd = new FormData();
  fd.append("photo", file);
  const res = await authedFetch(`/users/${userId}/profile-photo`, { method: "POST", body: fd });
  const body = await parseJson<{ success?: boolean; message?: string; data?: StaffUser }>(res);
  if (!res.ok) throw new Error(body.message || "Upload failed");
  if (!body.data) throw new Error("Invalid response");
  return body.data;
}
