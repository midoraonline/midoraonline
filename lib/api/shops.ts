import { apiFetch } from "./base";
import type { Product } from "./products";

export type ShopType = "product" | "service" | "both";

export type Contact = {
  label?: string | null;
  value: string;
  type?: string | null;
};

export type SocialLink = {
  platform?: string | null;
  url: string;
};

export type Availability = {
  days?: string | null;
  hours?: string | null;
};

export type ShopLocation = {
  display?: string;
  city?: string;
  country?: string;
};

export type ThemeConfig = Record<string, unknown>;

export type Shop = {
  id: string;
  owner_id?: string | null;
  slug: string;
  name: string;
  shop_type?: ShopType | null;
  is_active?: boolean;
  category?: string | null;
  location?: string | ShopLocation | null;
  description?: string | null;
  about?: string | null;
  shop_email?: string | null;
  whatsapp_number?: string | null;
  contacts?: Contact[] | null;
  social_links?: SocialLink[] | null;
  availability?: Availability | null;
  theme_config?: ThemeConfig | null;
  logo_url?: string | null;
  subscription_end_date?: string | null;
  view_count?: number | null;
  trust_score?: number | null;
  available_now?: boolean | null;
  last_seen_at?: string | null;
  follower_count?: number | null;
  like_count?: number | null;
  viewer_following?: boolean | null;
  viewer_liked_shop?: boolean | null;
  trust_badges?: string[];
};

export type Paginated<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export function listPublic(opts?: {
  search?: string;
  shop_type?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (opts?.search) params.set("search", opts.search);
  if (opts?.shop_type) params.set("shop_type", opts.shop_type);
  if (opts?.page != null) params.set("page", String(opts.page));
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return apiFetch<Paginated<Shop>>(`/api/v1/shops${qs ? `?${qs}` : ""}`);
}

export function bySlug(slug: string, opts?: { token?: string }) {
  return apiFetch<Shop>(`/api/v1/shops/by-slug/${encodeURIComponent(slug)}`, {
    ...(opts?.token ? { token: opts.token } : {}),
  });
}

export type ShopEngagement = {
  follower_count?: number;
  like_count?: number;
  view_count?: number;
  viewer_following?: boolean;
  viewer_liked_shop?: boolean;
  whatsapp_clicks?: number;
  messages?: number;
};

export function getShopEngagement(shopId: string, opts?: { token?: string }) {
  return apiFetch<ShopEngagement>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/engagement`,
    opts?.token ? { token: opts.token } : {}
  );
}

export function recordShopView(shopId: string) {
  return apiFetch<{ view_count?: number }>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/views`,
    { method: "POST", body: "{}" }
  );
}

export type ShopEventType = "whatsapp_clicked" | "messaged";

export function recordShopEvent(shopId: string, eventType: ShopEventType) {
  const params = new URLSearchParams({ event_type: eventType });
  return apiFetch<{ status: string } | { error: string }>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/events?${params.toString()}`,
    { method: "POST", body: "{}" }
  );
}

export function followShop(shopId: string, token?: string | null) {
  return apiFetch<unknown>(`/api/v1/shops/${encodeURIComponent(shopId)}/follow`, {
    method: "POST",
    token,
    body: "{}",
  });
}

export function unfollowShop(shopId: string, token?: string | null) {
  return apiFetch<unknown>(`/api/v1/shops/${encodeURIComponent(shopId)}/follow`, {
    method: "DELETE",
    token,
  });
}

export function likeShop(shopId: string, token?: string | null) {
  return apiFetch<unknown>(`/api/v1/shops/${encodeURIComponent(shopId)}/like`, {
    method: "POST",
    token,
    body: "{}",
  });
}

export function unlikeShop(shopId: string, token?: string | null) {
  return apiFetch<unknown>(`/api/v1/shops/${encodeURIComponent(shopId)}/like`, {
    method: "DELETE",
    token,
  });
}

export function myShops(token?: string | null) {
  return apiFetch<Paginated<Shop>>("/api/v1/shops/me", { token });
}

export type EngagementShop = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  shop_type?: string | null;
  is_active?: boolean;
  view_count?: number;
  follower_count?: number;
  like_count?: number;
};

export type MerchantStats = {
  total_shops: number;
  active_shops: number;
  total_shop_views: number;
  total_followers: number;
  total_shop_likes: number;
  total_products: number;
  total_product_views: number;
  total_product_likes: number;
  total_whatsapp_clicks: number;
  total_messages: number;
};

export function myFollowedShops() {
  return apiFetch<{ items: EngagementShop[]; total: number }>("/api/v1/shops/me/followed");
}

export function myLikedShops() {
  return apiFetch<{ items: EngagementShop[]; total: number }>("/api/v1/shops/me/liked");
}

export function myStats() {
  return apiFetch<MerchantStats>("/api/v1/shops/me/stats");
}

export type CreateShopRequest = {
  name: string;
  slug: string;
  description?: string;
  about?: string;
  logo_url?: string;
  shop_email?: string;
  whatsapp_number?: string;
  contacts?: Contact[];
  social_links?: SocialLink[];
  location?: ShopLocation;
  availability?: Availability;
  theme_config?: ThemeConfig;
  shop_type?: ShopType;
  category?: string;
};

export function createShop(body: CreateShopRequest, token?: string | null) {
  return apiFetch<Shop>("/api/v1/shops/", {
    method: "POST",
    token,
    body,
  });
}

export function getShop(shopId: string, opts?: { token?: string }) {
  return apiFetch<Shop>(`/api/v1/shops/${encodeURIComponent(shopId)}`, {
    ...(opts?.token ? { token: opts.token } : {}),
  });
}

export type UpdateShopRequest = Partial<
  Omit<CreateShopRequest, "description" | "about" | "logo_url" | "shop_email" | "whatsapp_number" | "location" | "availability">
> & {
  description?: string | null;
  about?: string | null;
  logo_url?: string | null;
  shop_email?: string | null;
  whatsapp_number?: string | null;
  location?: ShopLocation | null;
  availability?: Availability | null;
  is_active?: boolean;
};

export function updateShop(
  shopId: string,
  body: UpdateShopRequest,
  token?: string | null,
) {
  return apiFetch<Shop>(`/api/v1/shops/${encodeURIComponent(shopId)}`, {
    method: "PATCH",
    token,
    body,
  });
}

export function generateLogo(shopId: string, token?: string | null) {
  return apiFetch<{ logo_url?: string | null }>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/logo/generate`,
    { method: "POST", token }
  );
}

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type DocumentUpload = {
  url: string;
  type: "national_id_front" | "national_id_back" | "selfie" | "business_cert";
  label: string;
};

export type Verification = {
  id: string;
  shop_id: string;
  status: VerificationStatus;
  requested_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  submitted_docs?: DocumentUpload[] | null;
  submitted_phone?: string | null;
  submitted_whatsapp?: string | null;
  submitted_location?: string | null;
  shop_duration_days?: number;
  // Stage-aware fields
  current_stage?: number;
  badges?: string[];
  stage2_status?: VerificationStatus;
  stage3_status?: VerificationStatus;
};

export function getVerification(shopId: string, token?: string | null) {
  return apiFetch<Verification>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/verification`,
    { token }
  );
}

export function submitForVerificationStage(
  shopId: string,
  stage: 2 | 3,
  body: {
    notes?: string;
    documents?: DocumentUpload[];
    submitted_phone?: string;
    submitted_whatsapp?: string;
    submitted_location?: string;
  } = {},
  token?: string | null
) {
  return apiFetch<Verification>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/verification/submit`,
    { method: "POST", token, body: { ...body, stage } }
  );
}

export function submitForVerification(
  shopId: string,
  body: {
    notes?: string;
    metadata?: Record<string, unknown>;
    documents?: DocumentUpload[];
    submitted_phone?: string;
    submitted_whatsapp?: string;
    submitted_location?: string;
  } = {},
  token?: string | null
) {
  return apiFetch<Verification>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/verification/submit`,
    { method: "POST", token, body }
  );
}

export type ShopDashboardResponse = {
  shop: Shop;
  engagement: ShopEngagement;
  products: Product[];
  lead_stats: Record<string, unknown>;
};

export function getShopDashboard(shopId: string) {
  return apiFetch<ShopDashboardResponse>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/dashboard`
  );
}

export function toggleShopAvailability(shopId: string, token?: string | null) {
  return apiFetch<Shop>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/toggle-availability`,
    { method: "POST", token }
  );
}
