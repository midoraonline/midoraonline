import { apiFetch } from "./base";

export type AnalyticsEventPayload = {
  event_type: string;
  target_type?: string | null;
  target_id?: string | null;
  session_id?: string | null;
  properties?: Record<string, unknown>;
  source?: "web" | "mobile" | "server";
  client_ts?: string;
};

export type AnalyticsAck = {
  accepted: number;
  rejected: number;
};

export function ingestEvents(events: AnalyticsEventPayload[]) {
  return apiFetch<AnalyticsAck>("/api/v1/analytics/events", {
    method: "POST",
    body: { events },
    // Anonymous callers are allowed server-side; if there's no auth cookie
    // we don't want the client trying to refresh one just to log an event.
    skipAuthRefresh: true,
  });
}

// ── Admin insight endpoints ────────────────────────────────────────────

export type CategoryFillRateRow = {
  category: string;
  browses: number;
  filled_browses: number;
  fill_rate: number;
};

export type CategoryFillRateResponse = {
  window_days: number;
  min_results: number;
  rows: CategoryFillRateRow[];
};

export function categoryFillRate(params: { window_days?: number; min_results?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.window_days) qs.set("window_days", String(params.window_days));
  if (params.min_results) qs.set("min_results", String(params.min_results));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<CategoryFillRateResponse>(`/api/v1/admin/analytics/category-fill-rate${suffix}`);
}

export type SearchToContactResponse = {
  window_days: number;
  sessions_with_search: number;
  sessions_with_contact: number;
  conversion_rate: number;
};

export function searchToContact(window_days = 30) {
  return apiFetch<SearchToContactResponse>(
    `/api/v1/admin/analytics/search-to-contact?window_days=${window_days}`,
  );
}

export type VerificationFunnelResponse = {
  window_days: number;
  steps: Array<{ step: string; count: number }>;
};

export function verificationFunnel(window_days = 90) {
  return apiFetch<VerificationFunnelResponse>(
    `/api/v1/admin/analytics/verification-funnel?window_days=${window_days}`,
  );
}

export type StaleListingResponse = {
  window_days: number;
  active_listings: number;
  stale_listings: number;
  stale_rate: number;
};

export function staleListingRate(window_days = 14) {
  return apiFetch<StaleListingResponse>(
    `/api/v1/admin/analytics/stale-listing-rate?window_days=${window_days}`,
  );
}

export type ShopConversionRow = {
  shop_id: string;
  shop_name: string | null;
  views: number;
  whatsapp_clicks: number;
  view_to_click_rate: number;
};

export type ShopConversionResponse = {
  window_days: number;
  rows: ShopConversionRow[];
};

export function shopConversion(params: { window_days?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.window_days) qs.set("window_days", String(params.window_days));
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ShopConversionResponse>(`/api/v1/admin/analytics/shop-conversion${suffix}`);
}

export type RatingCoverageResponse = {
  window_days: number;
  prompted: number;
  submitted: number;
  coverage_rate: number;
};

export function ratingCoverage(window_days = 30) {
  return apiFetch<RatingCoverageResponse>(
    `/api/v1/admin/analytics/rating-coverage?window_days=${window_days}`,
  );
}

export type ReportRateResponse = {
  window_days: number;
  rows: Array<{
    bucket: string;
    reports: number;
    active_listings: number;
    reports_per_thousand: number;
  }>;
};

export function reportRate(params: { window_days?: number; dimension?: "category" | "shop" } = {}) {
  const qs = new URLSearchParams();
  if (params.window_days) qs.set("window_days", String(params.window_days));
  if (params.dimension) qs.set("dimension", params.dimension);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ReportRateResponse>(`/api/v1/admin/analytics/report-rate${suffix}`);
}

export type DiscountEngagementResponse = {
  window_days: number;
  with_discount: { views: number; clicks: number; view_to_click_rate: number };
  without_discount: { views: number; clicks: number; view_to_click_rate: number };
};

export function discountEngagement(window_days = 30) {
  return apiFetch<DiscountEngagementResponse>(
    `/api/v1/admin/analytics/discount-engagement?window_days=${window_days}`,
  );
}
