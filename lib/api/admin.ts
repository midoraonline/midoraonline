import { apiFetch } from "./base";

export type Paginated<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
  limit?: number;
  total_pages?: number;
};

export type AdminShop = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  shop_type?: string | null;
  is_active?: boolean;
  subscription_end_date?: string | null;
  view_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
  owner_id?: string | null;
  owner_email?: string | null;
  owner_full_name?: string | null;
  product_count?: number;
  verification_status?: VerificationStatus;
  verification_requested_at?: string | null;
  verification_reviewed_at?: string | null;
  verification_notes?: string | null;
};

export type AdminSubscription = {
  id: string;
  shop_id?: string | null;
  status?: string | null;
};

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type AdminVerification = {
  id: string;
  shop_id: string;
  status: VerificationStatus;
  requested_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  shops?: {
    name?: string | null;
    slug?: string | null;
    owner_id?: string | null;
    shop_email?: string | null;
    is_active?: boolean | null;
    created_at?: string | null;
  } | null;
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export type AdminStatsSummary = {
  total_shops: number;
  active_shops: number;
  inactive_shops: number;
  total_products: number;
  total_users: number;
  total_orders: number;
  total_revenue_ugx: number;
  total_subscription_revenue_ugx: number;
  total_shop_views: number;
  total_product_views: number;
  pending_verifications: number;
  verified_shops: number;
  rejected_shops: number;
};

export type TrendPoint = { day: string; count: number };

export type DistributionSlice = { label: string; value: number };

export type TopShop = {
  id: string;
  name: string;
  slug: string;
  shop_type?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  view_count: number;
  product_count: number;
  published_product_count: number;
  like_count: number;
  follower_count: number;
  verification_status: VerificationStatus;
};

export type TopProduct = {
  id: string;
  title: string;
  category?: string | null;
  item_type?: string | null;
  shop_id: string;
  shop_name?: string | null;
  view_count: number;
  like_count: number;
  price_ugx: number;
  is_published?: boolean;
};

export type AdminStatsOverview = {
  generated_at: string;
  window_days: number;
  summary: AdminStatsSummary;
  role_breakdown: Array<{ role: string; count: number }>;
  trends: {
    shops: TrendPoint[];
    products: TrendPoint[];
    users: TrendPoint[];
    orders: TrendPoint[];
  };
  top_shops: TopShop[];
  top_products: TopProduct[];
  distributions: {
    shop_types: DistributionSlice[];
    product_categories: DistributionSlice[];
    product_item_types: DistributionSlice[];
    verification_status: DistributionSlice[];
    order_status: DistributionSlice[];
  };
};

/**
 * All admin endpoints now accept either:
 *   - a role=admin JWT via the auth cookie (browser), or
 *   - the legacy `X-Admin-Key` header (scripts / CI).
 *
 * The `adminKey` parameter is optional so the browser path just uses cookies.
 */

export function listShops(adminKey?: string) {
  return apiFetch<Paginated<AdminShop>>("/api/v1/admin/shops/", { adminKey });
}

export function setShopActive(shopId: string, is_active = true, adminKey?: string) {
  const params = new URLSearchParams({ is_active: String(is_active) });
  return apiFetch<AdminShop>(
    `/api/v1/admin/shops/${encodeURIComponent(shopId)}/active?${params.toString()}`,
    { method: "PATCH", adminKey }
  );
}

export function listSubscriptions(adminKey?: string) {
  return apiFetch<Paginated<AdminSubscription>>("/api/v1/admin/subscriptions/", {
    adminKey,
  });
}

export function listVerifications(
  params: {
    status?: VerificationStatus | "all";
    limit?: number;
    includeUnverified?: boolean;
  } = {},
  adminKey?: string
) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.includeUnverified) qs.set("include_unverified", "true");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ items: AdminVerification[] }>(
    `/api/v1/admin/shops/verifications${suffix}`,
    { adminKey }
  );
}

export function approveVerification(
  shopId: string,
  notes?: string,
  adminKey?: string
) {
  return apiFetch<AdminVerification>(
    `/api/v1/admin/shops/verifications/${encodeURIComponent(shopId)}/approve`,
    { method: "POST", body: { notes: notes ?? null }, adminKey }
  );
}

export function rejectVerification(
  shopId: string,
  notes?: string,
  adminKey?: string
) {
  return apiFetch<AdminVerification>(
    `/api/v1/admin/shops/verifications/${encodeURIComponent(shopId)}/reject`,
    { method: "POST", body: { notes: notes ?? null }, adminKey }
  );
}

export function queueVerification(
  shopId: string,
  notes?: string,
  adminKey?: string
) {
  return apiFetch<AdminVerification>(
    `/api/v1/admin/shops/verifications/${encodeURIComponent(shopId)}/queue`,
    { method: "POST", body: { notes: notes ?? null }, adminKey }
  );
}

export function statsOverview(adminKey?: string) {
  return apiFetch<AdminStatsOverview>("/api/v1/admin/stats/overview", { adminKey });
}
