import { apiFetch } from "./base";

export type ListingEventType =
  | "viewed"
  | "whatsapp_clicked"
  | "call_clicked"
  | "saved"
  | "shared"
  | "reported"
  | "updated";

export type ListingEventStats = {
  views: number;
  whatsapp_clicks: number;
  call_clicks: number;
  saves: number;
  shares: number;
  reports: number;
};

export function recordListingEvent(
  productId: string,
  eventType: ListingEventType,
  opts?: { ip_address?: string; device_hash?: string; token?: string },
) {
  const params = new URLSearchParams({ event_type: eventType });
  if (opts?.ip_address) params.set("ip_address", opts.ip_address);
  if (opts?.device_hash) params.set("device_hash", opts.device_hash);
  return apiFetch<Record<string, unknown>>(
    `/api/v1/products/${encodeURIComponent(productId)}/events?${params.toString()}`,
    { method: "POST", token: opts?.token, body: "{}" },
  );
}

export function getListingEventStats(productId: string) {
  return apiFetch<ListingEventStats>(
    `/api/v1/products/${encodeURIComponent(productId)}/events/stats`,
  );
}
