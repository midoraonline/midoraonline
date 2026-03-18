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

export type Shop = {
  id: string;
  slug: string;
  name: string;
  shop_type?: ShopType | null;
  is_active?: boolean;
  category?: string | null;
  location?: string | null;
  description?: string | null;
  about?: string | null;
  shop_email?: string | null;
  whatsapp_number?: string | null;
  contacts?: Contact[] | null;
  social_links?: SocialLink[] | null;
  availability?: Availability | null;
  logo_url?: string | null;
};

export type Paginated<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export function listPublic(opts?: { search?: string; shop_type?: string }) {
  const params = new URLSearchParams();
  if (opts?.search) params.set("search", opts.search);
  if (opts?.shop_type) params.set("shop_type", opts.shop_type);
  const qs = params.toString();
  return apiFetch<Paginated<Shop>>(`/api/v1/shops/${qs ? `?${qs}` : ""}`);
}

export function bySlug(slug: string) {
  return apiFetch<Shop>(`/api/v1/shops/by-slug/${encodeURIComponent(slug)}`);
}

export function myShops(token: string) {
  return apiFetch<Paginated<Shop>>("/api/v1/shops/me", { token });
}

/** Location as expected by API (object, e.g. for display/city). */
export type ShopLocation = {
  display?: string;
  city?: string;
  country?: string;
};

export type ThemeConfig = Record<string, unknown>;

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

export function createShop(token: string, body: CreateShopRequest) {
  return apiFetch<Shop>("/api/v1/shops/", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function getShop(shopId: string) {
  return apiFetch<Shop>(`/api/v1/shops/${encodeURIComponent(shopId)}`);
}

export type UpdateShopRequest = Partial<CreateShopRequest> & {
  is_active?: boolean;
};

export function updateShop(token: string, shopId: string, body: UpdateShopRequest) {
  return apiFetch<Shop>(`/api/v1/shops/${encodeURIComponent(shopId)}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function generateLogo(token: string, shopId: string) {
  return apiFetch<{ logo_url?: string | null }>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/logo/generate`,
    { method: "POST", token }
  );
}

