/** Resolve chat upload paths (/uploads/chat/…) to a browser-loadable URL. */
export function chatMediaUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "") || "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
