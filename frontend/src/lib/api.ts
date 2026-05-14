/** Base URL for REST API (no trailing slash). Empty = same-origin `/api/v1` (use Vite proxy in dev). */
export function getApiRoot(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (raw) return `${raw.replace(/\/$/, "")}/api/v1`;
  return "/api/v1";
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
