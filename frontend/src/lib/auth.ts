import { getApiRoot, parseJson } from "@/lib/api";

export type Role = "admin" | "accountant" | "teacher" | "parent" | "student";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  modulePermissions?: Record<string, string[]>;
}

const USER_KEY = "tces_user";
const ACCESS_KEY = "tces_access";

const AUTH_EVT = "tces-auth-change";

function dispatch() {
  window.dispatchEvent(new Event(AUTH_EVT));
}

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

function setAccessToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(ACCESS_KEY, token);
    else sessionStorage.removeItem(ACCESS_KEY);
  } catch {
    /* ignore */
  }
}

function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as SessionUser;
    if (!u?.id || !u?.email || !u?.role) return null;
    return u;
  } catch {
    return null;
  }
}

function persistUser(user: SessionUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStorage() {
  localStorage.removeItem(USER_KEY);
  setAccessToken(null);
}

export function normalizeRole(role: string | undefined): Role | null {
  const r = String(role || "").toLowerCase();
  if (r === "admin" || r === "accountant" || r === "teacher" || r === "parent" || r === "student") return r;
  return null;
}

export function getSession(): SessionUser | null {
  return readStoredUser();
}

async function fetchMe(accessToken: string): Promise<SessionUser | null> {
  const res = await fetch(`${getApiRoot()}/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const body = await parseJson<{ success?: boolean; data?: SessionUser }>(res);
  const d = body.data;
  if (!d?.id || !d.email) return null;
  const role = normalizeRole(d.role as string);
  if (!role) return null;
  return {
    id: String(d.id),
    email: d.email,
    name: d.name,
    role,
    modulePermissions: d.modulePermissions,
  };
}

async function fetchRefresh(): Promise<string | null> {
  const res = await fetch(`${getApiRoot()}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) return null;
  const body = await parseJson<{ success?: boolean; data?: { accessToken?: string } }>(res);
  const token = body.data?.accessToken;
  return token || null;
}

/** Restore session using access token and/or httpOnly refresh cookie. */
export async function restoreSession(): Promise<SessionUser | null> {
  let token = getAccessToken();
  if (token) {
    const user = await fetchMe(token);
    if (user) {
      persistUser(user);
      dispatch();
      return user;
    }
  }
  const newToken = await fetchRefresh();
  if (newToken) {
    setAccessToken(newToken);
    const user = await fetchMe(newToken);
    if (user) {
      persistUser(user);
      dispatch();
      return user;
    }
  }
  clearStorage();
  dispatch();
  return null;
}

let sessionRestorePromise: Promise<SessionUser | null> | null = null;

/** Single in-flight bootstrap for concurrent useAuth() mounts (e.g. React Strict Mode). */
export function restoreSessionOnce(): Promise<SessionUser | null> {
  if (!sessionRestorePromise) {
    sessionRestorePromise = restoreSession().finally(() => {
      sessionRestorePromise = null;
    });
  }
  return sessionRestorePromise;
}

export async function loginWithPassword(email: string, password: string): Promise<SessionUser> {
  const res = await fetch(`${getApiRoot()}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await parseJson<{
    success?: boolean;
    message?: string;
    data?: { accessToken?: string; user?: { id: string; name: string; email: string; role?: string; modulePermissions?: Record<string, string[]> } };
  }>(res);
  if (!res.ok || !body.success || !body.data?.accessToken || !body.data?.user) {
    const msg = body.message || (res.status === 401 ? "Invalid email or password." : "Sign-in failed.");
    throw new Error(msg);
  }
  const { accessToken, user: u } = body.data;
  const role = normalizeRole(u.role);
  if (!role) throw new Error("Unknown account role.");
  const session: SessionUser = {
    id: String(u.id),
    email: u.email,
    name: u.name,
    role,
    modulePermissions: u.modulePermissions,
  };
  setAccessToken(accessToken);
  persistUser(session);
  dispatch();
  return session;
}

export async function logout(): Promise<void> {
  const token = getAccessToken();
  try {
    await fetch(`${getApiRoot()}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    /* still clear client */
  }
  clearStorage();
  dispatch();
}

export const panelPathFor = (role: Role): string => `/panel/${role}`;
