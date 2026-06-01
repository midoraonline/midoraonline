import { apiFetch } from "./base";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body?: string | null;
  channel: string;
  status: "unread" | "read" | "sent" | "failed";
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export function listNotifications(opts?: { page?: number; limit?: number; unread_only?: boolean; token?: string }) {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.unread_only) params.set("unread_only", "true");
  const qs = params.toString();
  return apiFetch<{ items: Notification[]; total: number; page: number; limit: number; total_pages: number }>(
    `/api/v1/notifications${qs ? `?${qs}` : ""}`,
    { token: opts?.token },
  );
}

export function getUnreadCount(token?: string | null) {
  return apiFetch<{ unread_count: number }>("/api/v1/notifications/count", { token });
}

export function markNotificationRead(notificationId: string, token?: string | null) {
  return apiFetch<Notification>(
    `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH", token, body: "{}" },
  );
}

export function markAllNotificationsRead(token?: string | null) {
  return apiFetch<{ status: string; marked_read: number }>(
    "/api/v1/notifications/read-all",
    { method: "POST", token, body: "{}" },
  );
}
