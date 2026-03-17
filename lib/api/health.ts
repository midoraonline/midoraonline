import { apiFetch } from "./base";

export type HealthResponse = {
  status: string;
  service?: string;
  version?: string;
  time_utc?: string;
};

export function health() {
  return apiFetch<HealthResponse>("/api/v1/health");
}

