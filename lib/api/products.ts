import { apiFetch } from "./base";

function productBase(productId: string) {
  return `/api/v1/products/${encodeURIComponent(productId)}`;
}

export type ItemType = "product" | "service" | "property" | "job";

export type ProductStatus = "draft" | "pending_review" | "active" | "hidden" | "rejected" | "expired" | "sold";

export type Product = {
  id: string;
  shop_id: string;
  item_type?: ItemType | null;
  title: string;
  description?: string | null;
  price_ugx?: number | null;
  price?: number | null;
  discount_price?: number | null;
  discount_expires_at?: string | null;
  stock_quantity?: number | null;
  image_urls?: string[] | string | null;
  image_url?: string | null;
  category?: string | null;
  tags?: string[] | null;
  is_published?: boolean | null;
  status?: ProductStatus | null;
  listing_score?: number | null;
  location_name?: string | null;
  view_count?: number | null;
  like_count?: number | null;
  viewer_liked?: boolean | null;
  whatsapp_clicks?: number | null;
  messages?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  boosted?: boolean;
  average_rating?: number | null;
  review_count?: number | null;
  is_negotiable?: boolean | null;
  ai_seo_tags?: string | null;
  ai_generated_desc?: boolean | null;
  shop?: {
    id: string;
    name: string;
    slug: string | null;
    logo_url?: string | null;
    owner_id?: string | null;
    whatsapp_number?: string | null;
    is_active: boolean;
    category?: string | null;
    trust_score: number;
    trust_badges?: string[];
    available_now: boolean;
    location?: string | null;
  } | null;
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
  discount_price?: number | null;
  discount_expires_at?: string | null;
  stock_quantity?: number;
  category?: string;
  item_type?: ItemType;
  image_urls?: string[] | string;
  is_published?: boolean;
  is_negotiable?: boolean;
  location_name?: string;
  status?: ProductStatus;
};

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
  if (body.discount_price !== undefined) {
    o.discount_price = body.discount_price;
  }
  if (body.discount_expires_at !== undefined) {
    o.discount_expires_at = body.discount_expires_at;
  }
  if (body.stock_quantity !== undefined && body.stock_quantity !== null && !Number.isNaN(body.stock_quantity)) {
    o.stock_quantity = body.stock_quantity;
  }
  if (body.category !== undefined && body.category !== "") o.category = body.category;
  if (body.item_type !== undefined) o.item_type = body.item_type;
  if (body.is_published !== undefined) o.is_published = body.is_published;
  if (body.is_negotiable !== undefined) o.is_negotiable = body.is_negotiable;
  if (body.location_name !== undefined && body.location_name !== "") o.location_name = body.location_name;
  const imgs = normalizeImageUrlsForApi(body.image_urls);
  if (imgs?.length) o.image_urls = imgs;
  return o;
}

function buildPatchPayload(body: Partial<CreateProductRequest>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (body.title !== undefined) o.title = body.title;
  if (body.description !== undefined) o.description = body.description;
  if (body.price_ugx !== undefined) o.price_ugx = body.price_ugx;
  if (body.discount_price !== undefined) o.discount_price = body.discount_price;
  if (body.discount_expires_at !== undefined) o.discount_expires_at = body.discount_expires_at;
  if (body.stock_quantity !== undefined) o.stock_quantity = body.stock_quantity;
  if (body.category !== undefined) o.category = body.category;
  if (body.item_type !== undefined) o.item_type = body.item_type;
  if (body.is_published !== undefined) o.is_published = body.is_published;
  if (body.is_negotiable !== undefined) o.is_negotiable = body.is_negotiable;
  if (body.location_name !== undefined) o.location_name = body.location_name;
  if (body.image_urls !== undefined) {
    const imgs = normalizeImageUrlsForApi(body.image_urls);
    if (imgs?.length) o.image_urls = imgs;
  }
  return o;
}

export function productPriceUgx(p: Product): number {
  const discountPrice = p.discount_price ?? null;
  const originalPrice = p.price_ugx ?? p.price;
  const basePrice = typeof originalPrice === "number" && !Number.isNaN(originalPrice) ? originalPrice : 0;
  if (discountPrice !== null && typeof discountPrice === "number" && !Number.isNaN(discountPrice) && discountPrice < basePrice) {
    return discountPrice;
  }
  return basePrice;
}

export function productOriginalPriceUgx(p: Product): number {
  const n = p.price_ugx ?? p.price;
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

export function productIsDiscounted(p: Product): boolean {
  const dp = p.discount_price;
  if (dp == null) return false;
  const op = productOriginalPriceUgx(p);
  return typeof dp === "number" && !Number.isNaN(dp) && dp > 0 && dp < op;
}

export function productDiscountPercent(p: Product): number {
  if (!productIsDiscounted(p)) return 0;
  const op = productOriginalPriceUgx(p);
  const dp = p.discount_price!;
  return Math.round((1 - dp / op) * 100);
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

export function productImageUrls(p: Product): string[] {
  return parseProductImageUrls(p);
}

export function productPrimaryImage(p: Product): string | undefined {
  return parseProductImageUrls(p).find((u) => !isVideoUrl(u));
}

export function isVideoUrl(url: string): boolean {
  const clean = url.split(/[?#]/, 1)[0];
  return /\.(mp4|webm|mov|m4v)$/i.test(clean);
}

export type ProductMedia =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string };

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

export function listShopProducts(shopId: string, opts?: { category?: string; search?: string; status?: string; token?: string }) {
  const params = new URLSearchParams();
  if (opts?.category) params.set("category", opts.category);
  if (opts?.search) params.set("search", opts.search);
  if (opts?.status) params.set("status", opts.status);
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

export function repostProduct(productId: string, token?: string | null) {
  return apiFetch<Product>(`${productBase(productId)}/repost`, {
    method: "POST",
    token,
  });
}

export function setDiscount(
  productId: string,
  body: { discount_price: number | null; discount_expires_at?: string | null },
  token?: string | null,
) {
  return apiFetch<Product>(`${productBase(productId)}/discount`, {
    method: "POST",
    token,
    body,
  });
}

export function toggleAvailability(productId: string, token?: string | null) {
  return apiFetch<Product>(`${productBase(productId)}/toggle-availability`, {
    method: "POST",
    token,
  });
}

export function getAlgorithmFeed(opts?: { page?: number; limit?: number; token?: string }) {
  const limit = opts?.limit ?? 20;
  const page = opts?.page ?? 1;
  return apiFetch<Product[]>(`/api/v1/feed/algorithm?page=${page}&limit=${limit}`, {
    ...(opts?.token ? { token: opts.token } : {}),
  });
}

export function getLatestFeed(opts?: { limit?: number; token?: string }) {
  const limit = opts?.limit ?? 20;
  return apiFetch<Product[]>(`/api/v1/feed/latest?limit=${limit}`, {
    ...(opts?.token ? { token: opts.token } : {}),
  });
}

export type HomeFeedProduct = {
  id: string;
  shop_id: string;
  title: string;
  price_ugx: number;
  discount_price?: number | null;
  discount_expires_at?: string | null;
  image_urls: string[];
  primary_image?: string;
  stock_quantity: number;
  category?: string | null;
  item_type?: string | null;
  view_count: number;
  like_count: number;
  viewer_liked?: boolean | null;
  listing_score: number;
  average_rating?: number | null;
  review_count?: number | null;
  is_negotiable?: boolean | null;
  location_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  shop: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    owner_id?: string | null;
    whatsapp_number?: string | null;
    is_active: boolean;
    category?: string | null;
    trust_score: number;
    trust_badges?: string[];
    available_now: boolean;
    location?: string | null;
  };
  boosted: boolean;
};

export type HomeFeedResponse = {
  algorithm: HomeFeedProduct[];
  trending: HomeFeedProduct[];
  premium: HomeFeedProduct[];
  fresh: HomeFeedProduct[];
  page: number;
  limit: number;
  total: number;
};

export type SimilarProduct = {
  id: string;
  shop_id: string;
  title: string;
  price_ugx: number;
  discount_price?: number | null;
  discount_expires_at?: string | null;
  image_urls?: string[] | null;
  category?: string | null;
  item_type?: string | null;
  listing_score: number;
  location_name?: string | null;
  created_at?: string | null;
  view_count: number;
  is_negotiable?: boolean | null;
  average_rating?: number | null;
  review_count?: number | null;
  shop_name?: string | null;
  shop_slug?: string | null;
  owner_id?: string | null;
  shop_whatsapp?: string | null;
  shop_is_active?: boolean | null;
  shop_trust_badges?: string[];
};

export function getSimilarProducts(productId: string, limit = 8) {
  return apiFetch<SimilarProduct[]>(
    `/api/v1/products/${encodeURIComponent(productId)}/similar?limit=${limit}`
  );
}

export function getHomeFeed(limit?: number, page?: number, token?: string) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (page) params.set("page", String(page));
  const qs = params.toString();
  return apiFetch<HomeFeedResponse>(`/api/v1/feed/home${qs ? `?${qs}` : ""}`, {
    ...(token ? { token } : {}),
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

export type LikedProduct = {
  id: string;
  shop_id: string;
  title: string;
  description?: string | null;
  price_ugx: number;
  discount_price?: number | null;
  discount_expires_at?: string | null;
  image_urls?: string[] | null;
  category?: string | null;
  item_type?: string | null;
  status?: string | null;
  listing_score: number;
  location_name?: string | null;
  is_published: boolean;
  is_negotiable?: boolean | null;
  view_count: number;
  created_at?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
  shop_name?: string | null;
  shop_slug?: string | null;
  shop_whatsapp?: string | null;
  owner_id?: string | null;
  shop_is_active?: boolean | null;
  shop_trust_badges?: string[];
};

export type LikedProductsResponse = {
  items: LikedProduct[];
  total: number;
  page: number;
  limit: number;
};

export function myLikedProducts(opts?: { page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return apiFetch<LikedProductsResponse>(
    `/api/v1/products/me/liked${qs ? `?${qs}` : ""}`,
  );
}
