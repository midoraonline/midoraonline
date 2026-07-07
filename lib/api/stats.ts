import { apiFetch } from "./base";

export function getOnlineUsersCount() {
  return apiFetch<{ online_count: number; window_minutes?: number }>("/api/v1/online-users");
}

export function pingPresence(instanceId: string) {
  return apiFetch<{ status: string }>("/api/v1/presence/ping", {
    method: "POST",
    body: { instance_id: instanceId },
  });
}

export function leavePresence(instanceId: string) {
  return apiFetch<{ status: string }>("/api/v1/presence/leave", {
    method: "POST",
    body: { instance_id: instanceId },
  });
}
