import { apiFetch } from "./base";

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

/** Location as expected by API (object, e.g. for display/city). */
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
  /** API may return a string or structured object */
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
  follower_count?: number | null;
  like_count?: number | null;
  viewer_following?: boolean | null;
  viewer_liked_shop?: boolean | null;
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

/**
 * All mutating / authed endpoints below take an optional `token`. The browser
 * carries the auth cookie automatically, so callers can omit it. Server-side
 * (RSC) callers that need to impersonate a user can still pass one.
 */

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

export type UpdateShopRequest = Partial<CreateShopRequest> & {
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

export type Verification = {
  id: string;
  shop_id: string;
  status: VerificationStatus;
  requested_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function getVerification(shopId: string, token?: string | null) {
  return apiFetch<Verification>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/verification`,
    { token }
  );
}

export function submitForVerification(
  shopId: string,
  body: { notes?: string; metadata?: Record<string, unknown> } = {},
  token?: string | null
) {
  return apiFetch<Verification>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/verification/submit`,
    { method: "POST", token, body }
  );
}

