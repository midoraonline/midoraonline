import { apiFetch } from "./base";

export type Paginated<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export type AdminShop = {
  id: string;
  slug: string;
  name: string;
  is_active?: boolean;
};

export type AdminSubscription = {
  id: string;
  shop_id?: string | null;
  status?: string | null;
};

export function listShops(adminKey: string) {
  return apiFetch<Paginated<AdminShop>>("/api/v1/admin/shops/", { adminKey });
}

export function setShopActive(adminKey: string, shopId: string, is_active = true) {
  const params = new URLSearchParams({ is_active: String(is_active) });
  return apiFetch<AdminShop>(
    `/api/v1/admin/shops/${encodeURIComponent(shopId)}/active?${params.toString()}`,
    { method: "PATCH", adminKey }
  );
}

export function listSubscriptions(adminKey: string) {
  return apiFetch<Paginated<AdminSubscription>>("/api/v1/admin/subscriptions/", {
    adminKey,
  });
}

