import { apiFetch } from "./base";

/** Global product CRUD / engagement (not under /shops/.../products). */
function productBase(productId: string) {
  return `/api/v1/products/${encodeURIComponent(productId)}`;
}

export type ItemType = "product" | "service";

export type Product = {
  id: string;
  shop_id: string;
  item_type?: ItemType | null;
  title: string;
  description?: string | null;
  /** Primary price field from API */
  price_ugx?: number | null;
  /** Legacy / alternate field name */
  price?: number | null;
  stock_quantity?: number | null;
  image_urls?: string[] | null;
  image_url?: string | null;
  category?: string | null;
  tags?: string[] | null;
  is_published?: boolean | null;
  view_count?: number | null;
  like_count?: number | null;
  viewer_liked?: boolean | null;
  created_at?: string | null;
};

export type Paginated<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export type CreateProductRequest = {
  title: string;
  description?: string;
  price_ugx?: number;
  stock_quantity?: number;
  category?: string;
  item_type?: ItemType;
  image_urls?: string[];
  is_published?: boolean;
};

/** Resolved price for display (UGX). */
export function productPriceUgx(p: Product): number {
  const n = p.price_ugx ?? p.price;
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

/** First image URL for cards. */
export function productPrimaryImage(p: Product): string | undefined {
  const fromArr = p.image_urls?.filter(Boolean)[0];
  return fromArr ?? p.image_url ?? undefined;
}

export function createProduct(token: string, shopId: string, body: CreateProductRequest) {
  return apiFetch<Product>(`/api/v1/shops/${encodeURIComponent(shopId)}/products`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function listShopProducts(shopId: string, opts?: { category?: string; search?: string; token?: string }) {
  const params = new URLSearchParams();
  if (opts?.category) params.set("category", opts.category);
  if (opts?.search) params.set("search", opts.search);
  const qs = params.toString();
  return apiFetch<Paginated<Product>>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/products${qs ? `?${qs}` : ""}`,
    opts?.token ? { token: opts.token } : {}
  );
}

export function getProduct(productId: string, opts?: { token?: string }) {
  return apiFetch<Product>(productBase(productId), {
    ...(opts?.token ? { token: opts.token } : {}),
  });
}

export type ProductEngagement = {
  like_count?: number;
  view_count?: number;
  viewer_liked?: boolean;
};

export function getProductEngagement(productId: string, opts?: { token?: string }) {
  return apiFetch<ProductEngagement>(`${productBase(productId)}/engagement`, {
    ...(opts?.token ? { token: opts.token } : {}),
  });
}

export function recordProductView(productId: string) {
  return apiFetch<{ view_count?: number }>(`${productBase(productId)}/views`, {
    method: "POST",
    body: "{}",
  });
}

export function likeProduct(token: string, productId: string) {
  return apiFetch<unknown>(`${productBase(productId)}/like`, {
    method: "POST",
    token,
    body: "{}",
  });
}

export function unlikeProduct(token: string, productId: string) {
  return apiFetch<unknown>(`${productBase(productId)}/like`, {
    method: "DELETE",
    token,
  });
}

export function updateProduct(token: string, productId: string, body: Partial<CreateProductRequest>) {
  return apiFetch<Product>(productBase(productId), {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function deleteProduct(token: string, productId: string) {
  return apiFetch<{ deleted?: boolean }>(productBase(productId), {
    method: "DELETE",
    token,
  });
}

export function generateFromImage(token: string, body: { image_url: string }) {
  return apiFetch<Record<string, unknown>>("/api/v1/products/generate-from-image", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}
