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
  total_reports: number;
  total_flagged_comments: number;
  total_conversations: number;
  total_messages: number;
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

export type AdminReport = {
  id: string;
  product_id: string;
  reporter_id: string;
  reason: string;
  description?: string | null;
  resolved: boolean;
  created_at: string;
  product?: { title?: string; shop_id?: string } | null;
  reporter?: { full_name?: string } | null;
};

export function listReports(params: { resolved?: boolean; limit?: number; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.resolved !== undefined) qs.set("resolved", String(params.resolved));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.page) qs.set("page", String(params.page));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ items: AdminReport[]; total: number }>(`/api/v1/admin/reports${suffix}`);
}

export function resolveReport(reportId: string) {
  return apiFetch<{ status: string }>(
    `/api/v1/admin/reports/${encodeURIComponent(reportId)}/resolve`,
    { method: "PATCH" }
  );
}

export type AdminComment = {
  id: string;
  comment: string;
  is_flagged: boolean;
  created_at: string;
  user?: { full_name?: string } | null;
  product?: { title?: string } | null;
  shop?: { name?: string } | null;
};

export function listComments(params: { flagged?: boolean; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.flagged !== undefined) qs.set("flagged", String(params.flagged));
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ product_comments: AdminComment[]; shop_comments: AdminComment[] }>(
    `/api/v1/admin/comments${suffix}`
  );
}

export function toggleCommentFlag(commentId: string, table: "product_comments" | "shop_comments") {
  return apiFetch<{ status: string; is_flagged: boolean }>(
    `/api/v1/admin/comments/${encodeURIComponent(commentId)}/flag?table=${table}`,
    { method: "PATCH" }
  );
}

export type AdminConversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message?: string | null;
  last_message_at?: string | null;
  created_at: string;
  buyer?: { full_name?: string; email?: string } | null;
  seller?: { full_name?: string; email?: string } | null;
};

export function adminListConversations(params: { limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ items: AdminConversation[]; total: number }>(
    `/api/v1/admin/chat/conversations${suffix}`
  );
}

export function adminMessageCount() {
  return apiFetch<{ count: number }>("/api/v1/admin/chat/messages/count");
}

export type AdminListingProduct = {
  id: string;
  shop_id: string;
  title: string;
  description?: string | null;
  price_ugx: number;
  image_urls?: string[] | null;
  category?: string | null;
  item_type: string;
  status: string;
  listing_score?: number | null;
  location_name?: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  shop_name?: string | null;
  shop_slug?: string | null;
  owner_id?: string | null;
  reports_count: number;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
};

export function listAdminListings(params: { status?: string; limit?: number; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.page) qs.set("page", String(params.page));
  return apiFetch<{
    items: AdminListingProduct[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }>(`/api/v1/admin/listings?${qs.toString()}`);
}

export function reviewListing(listingId: string, action: "approve" | "reject", notes?: string) {
  const qs = new URLSearchParams({ action, notes: notes ?? "" });
  if (!notes) qs.delete("notes");
  return apiFetch<AdminListingProduct>(
    `/api/v1/admin/listings/${encodeURIComponent(listingId)}/review?${qs.toString()}`,
    { method: "POST" }
  );
}
