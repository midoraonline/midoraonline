import { apiFetch } from "./base";

export function getOnlineUsersCount() {
  return apiFetch<{ online_count: number }>("/api/v1/online-users");
}
