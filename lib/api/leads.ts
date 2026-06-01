import { apiFetch } from "./base";

export type LeadSource = "whatsapp" | "call" | "contact_form" | "email";
export type LeadStatus = "new" | "responded" | "ignored" | "closed";

export type Lead = {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id?: string | null;
  source: LeadSource;
  lead_status: LeadStatus;
  unique_key: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  products?: {
    title?: string;
    price_ugx?: number;
    image_urls?: string[];
  } | null;
};

export function createLead(
  shopId: string,
  productId: string,
  source: LeadSource = "whatsapp",
  token?: string | null,
) {
  const params = new URLSearchParams({ source });
  return apiFetch<Lead | { status: string; message: string }>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/products/${encodeURIComponent(productId)}/leads?${params.toString()}`,
    { method: "POST", token, body: "{}" },
  );
}

export function getShopLeadStats(shopId: string, token?: string | null) {
  return apiFetch<{ total_leads: number; today_leads: number; new_leads: number }>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/leads/stats`,
    { token },
  );
}

export function listShopLeads(
  shopId: string,
  opts?: { page?: number; limit?: number; status?: string; token?: string },
) {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.status) params.set("status", opts.status);
  const qs = params.toString();
  return apiFetch<{ items: Lead[]; total: number; page: number; limit: number; total_pages: number }>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/leads${qs ? `?${qs}` : ""}`,
    { token: opts?.token },
  );
}

export function updateLeadStatus(
  shopId: string,
  leadId: string,
  status: LeadStatus,
  token?: string | null,
) {
  const params = new URLSearchParams({ status });
  return apiFetch<Lead>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/leads/${encodeURIComponent(leadId)}/status?${params.toString()}`,
    { method: "PATCH", token, body: "{}" },
  );
}
