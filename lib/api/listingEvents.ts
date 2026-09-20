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
