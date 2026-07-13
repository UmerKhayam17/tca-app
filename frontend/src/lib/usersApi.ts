import { parseJson } from "@/lib/api";
import { authedFetch } from "@/lib/auth";

export interface RoleOption {
  _id: string;
  name: string;
}

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  profileImage?: string;
  role?: RoleOption | string;
  createdAt?: string;
}

export async function fetchRoles(): Promise<RoleOption[]> {
  const res = await authedFetch("/roles");
  const body = await parseJson<{ success?: boolean; data?: RoleOption[] }>(res);
  if (!res.ok || !body.data) return [];
  return body.data;
}

export async function fetchUsers(): Promise<ApiUser[]> {
  const res = await authedFetch("/users");
  const body = await parseJson<{ success?: boolean; data?: ApiUser[] }>(res);
  if (!res.ok || !body.data) return [];
  return body.data;
}

export async function createUserApi(payload: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  isActive?: boolean;
  profileImage?: string;
}): Promise<ApiUser> {
  const res = await authedFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await parseJson<{ success?: boolean; message?: string; data?: ApiUser }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to create user");
  if (!body.data) throw new Error("Invalid response");
  return body.data;
}

export async function updateUserApi(
  id: string,
  payload: Partial<{
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    profileImage: string;
    password: string;
  }>,
): Promise<ApiUser> {
  const res = await authedFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const body = await parseJson<{ success?: boolean; message?: string; data?: ApiUser }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to update user");
  if (!body.data) throw new Error("Invalid response");
  return body.data;
}
