import { resolveUploadUrl } from "@/lib/api";

/** Resolve chat upload paths (`/uploads/chat/…`) to a browser-loadable URL. */
export function chatMediaUrl(path?: string | null): string {
  return resolveUploadUrl(path || "");
}
