import { apiFetch } from "./base";

export function reportProduct(
  productId: string,
  reason: string,
  description?: string,
) {
  const qs = new URLSearchParams({ reason });
  if (description) qs.set("description", description);
  return apiFetch<Record<string, unknown>>(
    `/api/v1/products/${encodeURIComponent(productId)}/reports?${qs.toString()}`,
    { method: "POST" }
  );
}

export const SELLER_REPORT_REASONS = [
  "Scam or fraud",
  "Harassment or abuse",
  "Fake identity",
  "Spam",
  "Unresponsive after deal",
  "Other",
] as const;

export function reportSeller(
  sellerId: string,
  reason: string,
  opts?: { description?: string; shopId?: string },
) {
  const qs = new URLSearchParams({ reason });
  if (opts?.description) qs.set("description", opts.description);
  if (opts?.shopId) qs.set("shop_id", opts.shopId);
  return apiFetch<Record<string, unknown>>(
    `/api/v1/sellers/${encodeURIComponent(sellerId)}/reports?${qs.toString()}`,
    { method: "POST" },
  );
}

export function blockSeller(sellerId: string) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/sellers/${encodeURIComponent(sellerId)}/block`,
    { method: "POST" },
  );
}

export function unblockSeller(sellerId: string) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/sellers/${encodeURIComponent(sellerId)}/block`,
    { method: "DELETE" },
  );
}
