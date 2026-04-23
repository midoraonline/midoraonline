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
  /** API may return a list or a single string depending on backend serialization */
  image_urls?: string[] | string | null;
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
  image_urls?: string[] | string;
  is_published?: boolean;
};

/** Ensure Postgres `text[]` / API list fields always get a real JSON array of strings. */
function normalizeImageUrlsForApi(value: CreateProductRequest["image_urls"]): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const arr = Array.isArray(value) ? value : [value];
  const urls = arr.map((u) => String(u).trim()).filter(Boolean);
  return urls.length ? urls : undefined;
}

function buildCreatePayload(body: CreateProductRequest): Record<string, unknown> {
  const o: Record<string, unknown> = { title: body.title };
  if (body.description !== undefined && body.description !== "") o.description = body.description;
  if (body.price_ugx !== undefined && body.price_ugx !== null && !Number.isNaN(body.price_ugx)) {
    o.price_ugx = body.price_ugx;
  }
  if (body.stock_quantity !== undefined && body.stock_quantity !== null && !Number.isNaN(body.stock_quantity)) {
    o.stock_quantity = body.stock_quantity;
  }
  if (body.category !== undefined && body.category !== "") o.category = body.category;
  if (body.item_type !== undefined) o.item_type = body.item_type;
  if (body.is_published !== undefined) o.is_published = body.is_published;
  const imgs = normalizeImageUrlsForApi(body.image_urls);
  if (imgs?.length) o.image_urls = imgs;
  return o;
}

function buildPatchPayload(body: Partial<CreateProductRequest>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (body.title !== undefined) o.title = body.title;
  if (body.description !== undefined) o.description = body.description;
  if (body.price_ugx !== undefined) o.price_ugx = body.price_ugx;
  if (body.stock_quantity !== undefined) o.stock_quantity = body.stock_quantity;
  if (body.category !== undefined) o.category = body.category;
  if (body.item_type !== undefined) o.item_type = body.item_type;
  if (body.is_published !== undefined) o.is_published = body.is_published;
  if (body.image_urls !== undefined) {
    const imgs = normalizeImageUrlsForApi(body.image_urls);
    if (imgs?.length) o.image_urls = imgs;
  }
  return o;
}

/** Resolved price for display (UGX). */
export function productPriceUgx(p: Product): number {
  const n = p.price_ugx ?? p.price;
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

function parseProductImageUrls(p: Product): string[] {
  const raw = p.image_urls;
  const fallback = p.image_url ? [String(p.image_url)] : [];
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return fallback;
    if (s.startsWith("[")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        /* fall through */
      }
    }
    return s.split(/[;,]/).map((x) => x.trim()).filter(Boolean);
  }
  if (Array.isArray(raw)) {
    const urls = raw.map(String).filter(Boolean);
    return urls.length ? urls : fallback;
  }
  return fallback;
}

/** All image URLs for galleries and cards. */
export function productImageUrls(p: Product): string[] {
  return parseProductImageUrls(p);
}

/** First image URL for cards. */
export function productPrimaryImage(p: Product): string | undefined {
  return parseProductImageUrls(p).find((u) => !isVideoUrl(u));
}

/** True when the URL looks like a video file we can play inline. */
export function isVideoUrl(url: string): boolean {
  const clean = url.split(/[?#]/, 1)[0];
  return /\.(mp4|webm|mov|m4v)$/i.test(clean);
}

export type ProductMedia =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string };

/** Split a product's URL list into structured image / video items. */
export function productMediaItems(p: Product): ProductMedia[] {
  return parseProductImageUrls(p).map<ProductMedia>((src) =>
    isVideoUrl(src) ? { kind: "video", src } : { kind: "image", src }
  );
}

export function createProduct(
  shopId: string,
  body: CreateProductRequest,
  token?: string | null,
) {
  return apiFetch<Product>(`/api/v1/shops/${encodeURIComponent(shopId)}/products`, {
    method: "POST",
    token,
    body: buildCreatePayload(body),
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

export function likeProduct(productId: string, token?: string | null) {
  return apiFetch<unknown>(`${productBase(productId)}/like`, {
    method: "POST",
    token,
    body: "{}",
  });
}

export function unlikeProduct(productId: string, token?: string | null) {
  return apiFetch<unknown>(`${productBase(productId)}/like`, {
    method: "DELETE",
    token,
  });
}

export function updateProduct(
  productId: string,
  body: Partial<CreateProductRequest>,
  token?: string | null,
) {
  return apiFetch<Product>(productBase(productId), {
    method: "PATCH",
    token,
    body: buildPatchPayload(body),
  });
}

export function deleteProduct(productId: string, token?: string | null) {
  return apiFetch<{ deleted?: boolean }>(productBase(productId), {
    method: "DELETE",
    token,
  });
}

export function generateFromImage(
  body: { image_url: string },
  token?: string | null,
) {
  return apiFetch<Record<string, unknown>>("/api/v1/products/generate-from-image", {
    method: "POST",
    token,
    body,
  });
}
