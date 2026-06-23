/** Backend origin from `VITE_API_URL` (no trailing slash). Empty = same-origin / Vite proxy. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : "";
}

/** REST API root including `/api/v1` prefix. */
export function getApiRoot(): string {
  const base = getApiBaseUrl();
  if (base) return `${base}/api/v1`;
  return "/api/v1";
}

/** Socket.io server origin from `VITE_SOCKET_URL` (falls back to API base, then page origin). */
export function getSocketUrl(): string {
  const socket = import.meta.env.VITE_SOCKET_URL?.trim();
  if (socket) return socket.replace(/\/$/, "");
  const api = getApiBaseUrl();
  if (api) return api;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** Resolve `/uploads/...` paths for img src and media (uses `VITE_API_URL` when set). */
export function resolveUploadUrl(path: string): string {
  if (!path) return "";
  if (/^(https?:|blob:)/i.test(path)) return path;
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

export async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}
