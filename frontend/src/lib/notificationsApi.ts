import { authedFetch } from "@/lib/auth";
import { parseJson } from "@/lib/api";

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  body: string;
  path: string;
  moduleKey: string;
  resource: string;
  resourceId: string;
  meta?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(params?: { limit?: number; unread?: boolean }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.unread) q.set("unread", "1");
  const res = await authedFetch(`/notifications?${q}`);
  const body = await parseJson<{
    success?: boolean;
    data?: AppNotification[];
    unreadCount?: number;
    message?: string;
  }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to load notifications");
  return { items: body.data || [], unreadCount: body.unreadCount ?? 0 };
}

export async function markNotificationRead(id: string) {
  const res = await authedFetch(`/notifications/${id}/read`, { method: "PATCH" });
  const body = await parseJson<{ success?: boolean; message?: string }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to mark notification read");
}

export async function markAllNotificationsRead() {
  const res = await authedFetch("/notifications/read-all", { method: "PATCH" });
  const body = await parseJson<{ success?: boolean; message?: string }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to mark all read");
}

export function notificationHref(role: string, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/panel/${role}${clean}`;
}
