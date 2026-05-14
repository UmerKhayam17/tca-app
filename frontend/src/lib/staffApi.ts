import { getApiRoot, parseJson } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const url = `${getApiRoot()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(init.body instanceof FormData) && init.method !== "GET" && init.method !== "HEAD") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  return fetch(url, { ...init, credentials: "include", headers });
}

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
  const allow = new Set(["teacher", "accountant"]);
  return roles.filter((r) => allow.has(String(r.name).toLowerCase()));
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
  const token = getAccessToken();
  const url = `${getApiRoot()}/users/${userId}/profile-photo`;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: "POST", credentials: "include", headers, body: fd });
  const body = await parseJson<{ success?: boolean; message?: string; data?: StaffUser }>(res);
  if (!res.ok) throw new Error(body.message || "Upload failed");
  if (!body.data) throw new Error("Invalid response");
  return body.data;
}
