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

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { ApiError } from "@/lib/api/base";
import { apiProducts, apiShops } from "@/lib/api";
import type { Product } from "@/lib/api/products";
import type { Shop } from "@/lib/api/shops";
import { CACHE_TAGS, TTL } from "@/lib/cache";

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

export const getShopBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<Shop | null> => nullIfNotFound(apiShops.bySlug(slug)),
    ["get-shop-by-slug"],
    { revalidate: TTL.SHOP, tags: [CACHE_TAGS.SHOPS] },
  ),
);

export const getShopById = cache(
  unstable_cache(
    async (shopId: string): Promise<Shop | null> => nullIfNotFound(apiShops.getShop(shopId)),
    ["get-shop-by-id"],
    { revalidate: TTL.SHOP, tags: [CACHE_TAGS.SHOPS] },
  ),
);

export const listPublicShops = cache(
  unstable_cache(
    async (opts?: {
      search?: string;
      shop_type?: string;
      limit?: number;
    }): Promise<Shop[]> => {
      const res = await apiShops.listPublic(opts);
      return res.items ?? [];
    },
    ["list-public-shops"],
    { revalidate: TTL.SHOP, tags: [CACHE_TAGS.SHOPS] },
  ),
);

// ---------------------------------------------------------------------------
// Products / inventory
// ---------------------------------------------------------------------------

export const getProductById = cache(
  unstable_cache(
    async (productId: string): Promise<Product | null> =>
      nullIfNotFound(apiProducts.getProduct(productId)),
    ["get-product-by-id"],
    { revalidate: TTL.PRODUCTS, tags: [CACHE_TAGS.PRODUCTS] },
  ),
);

/**
 * All published products for a shop, including stock_quantity (inventory).
 * Cached so the shop layout and page components share one API call.
 */
export const listShopProducts = cache(
  unstable_cache(
    async (shopId: string): Promise<Product[]> => {
      const res = await apiProducts.listShopProducts(shopId);
      return res.items ?? [];
    },
    ["list-shop-products"],
    { revalidate: TTL.PRODUCTS, tags: [CACHE_TAGS.PRODUCTS] },
  ),
);
