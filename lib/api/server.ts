/**
 * Server-only fetch helpers.
 *
 * Two layers of caching:
 *   1. `unstable_cache` (Vercel Data Cache) — persists across serverless
 *      function invocations. Entries are tagged so the FastAPI backend can
 *      bust them on-demand via POST /api/revalidate?tag=<TAG>, and they
 *      also expire after the TTL defined in `lib/cache.ts`.
 *   2. `React.cache` — deduplicates calls made within the same request
 *      (layout + page + generateMetadata share one network round-trip).
 *
 * Only import these from server components and `generateMetadata`. Client
 * components should use the plain `apiFetch` helpers through the API
 * modules in `lib/api/*`.
 */
import "server-only";

import { ApiError } from "@/lib/api/base";
import { apiProducts, apiShops } from "@/lib/api";
import type { Product } from "@/lib/api/products";
import type { Shop } from "@/lib/api/shops";

/** Only 404 is treated as “missing”. Other failures must not be cached as empty/null. */
async function nullIfNotFound<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  return nullIfNotFound(apiShops.bySlug(slug));
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  return nullIfNotFound(apiShops.getShop(shopId));
}

export async function listPublicShops(opts?: {
  search?: string;
  shop_type?: string;
  limit?: number;
}): Promise<Shop[]> {
  const res = await apiShops.listPublic(opts);
  return res.items ?? [];
}

// ---------------------------------------------------------------------------
// Products / inventory
// ---------------------------------------------------------------------------

export async function getProductById(productId: string): Promise<Product | null> {
  return nullIfNotFound(apiProducts.getProduct(productId));
}

/**
 * All published products for a shop, including stock_quantity (inventory).
 */
export async function listShopProducts(shopId: string): Promise<Product[]> {
  const res = await apiProducts.listShopProducts(shopId);
  return res.items ?? [];
}
