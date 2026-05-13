import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";

import { apiProducts, apiShops } from "@/lib/api";
import type { ProductCardData } from "@/components/productcard";
import { publicSiteOrigin } from "@/lib/publicSite";
import { productPageSlug } from "@/lib/productUrl";
import { CACHE_TAGS, TTL } from "@/lib/cache";

const MAX_CARDS = 72;
const SHOPS_TO_SCAN = 20;
const PER_SHOP_CAP = 12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a ProductCardData array from raw API data. */
async function fetchShopProductCards(
  shop: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    is_active?: boolean;
    whatsapp_number?: string | null;
    category?: string | null;
  },
  perShopCap: number,
): Promise<ProductCardData[]> {
  const site = publicSiteOrigin();
  try {
    const { items: products } = await apiProducts.listShopProducts(shop.id);
    const cards: ProductCardData[] = [];
    for (const p of products) {
      if (cards.length >= perShopCap) break;
      if (p.is_published === false) continue;
      const slug = productPageSlug(p);
      cards.push({
        id: p.id,
        slug,
        title: p.title,
        priceUGX: apiProducts.productPriceUgx(p),
        imageUrl: apiProducts.productPrimaryImage(p),
        shopLogoUrl: shop.logo_url ?? undefined,
        viewCount: p.view_count ?? 0,
        shopWhatsApp: shop.whatsapp_number ?? null,
        listingUrl: `${site}/products/${slug}`,
        shop: {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          verified: shop.is_active ?? true,
          category: shop.category ?? null,
        },
        category: p.category ?? null,
      });
    }
    return cards;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public product feed (all shops, alphabetical)
// ---------------------------------------------------------------------------

/**
 * Aggregate published listings from public shops for the global /products
 * page.
 *
 * Two cache layers:
 *   • unstable_cache: persists across Vercel serverless invocations (60 s
 *     TTL, tagged for on-demand revalidation).
 *   • React.cache: deduplicates within a single request so layout +
 *     page share one result.
 */
export const loadPublicProductFeed = cache(
  unstable_cache(
    async (): Promise<ProductCardData[]> => {
      let shops: Awaited<ReturnType<typeof apiShops.listPublic>>["items"] = [];
      try {
        const res = await apiShops.listPublic({ page: 1, limit: SHOPS_TO_SCAN });
        shops = res.items ?? [];
      } catch {
        return [];
      }

      const perShop = await Promise.all(
        shops.map((shop) => fetchShopProductCards(shop, PER_SHOP_CAP)),
      );

      const out: ProductCardData[] = [];
      for (const cards of perShop) {
        for (const card of cards) {
          if (out.length >= MAX_CARDS) break;
          out.push(card);
        }
        if (out.length >= MAX_CARDS) break;
      }

      out.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));

      return out;
    },
    ["public-product-feed"],
    { revalidate: TTL.PRODUCTS, tags: [CACHE_TAGS.PRODUCTS] },
  ),
);

// ---------------------------------------------------------------------------
// Most-viewed products
// ---------------------------------------------------------------------------

/**
 * Returns the top-N products across all shops sorted by view_count descending.
 *
 * Uses a longer TTL (5 min) because the ranking only needs minute-level
 * precision — an immediate per-view revalidation would create too many
 * cache bursts.
 *
 * Tagged with both PRODUCTS and MOST_VIEWED so it can be invalidated either
 * broadly (tag=products) or precisely (tag=most-viewed).
 */
export const loadMostViewedProducts = cache(
  unstable_cache(
    async (limit: number = 12): Promise<ProductCardData[]> => {
      let shops: Awaited<ReturnType<typeof apiShops.listPublic>>["items"] = [];
      try {
        const res = await apiShops.listPublic({ page: 1, limit: SHOPS_TO_SCAN });
        shops = res.items ?? [];
      } catch {
        return [];
      }

      const perShop = await Promise.all(
        shops.map((shop) => fetchShopProductCards(shop, PER_SHOP_CAP)),
      );

      const all: ProductCardData[] = [];
      for (const cards of perShop) {
        for (const card of cards) all.push(card);
      }

      all.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

      return all.slice(0, limit);
    },
    ["most-viewed-products"],
    {
      revalidate: TTL.MOST_VIEWED,
      tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.MOST_VIEWED],
    },
  ),
);

// ---------------------------------------------------------------------------
// Shop browse: product categories per shop (for /shops filters)
// ---------------------------------------------------------------------------

/**
 * For each shop id, the set of `category` values on published products.
 * Cached; bust with `products` revalidation tag.
 */
export async function loadShopProductCategoryMap(shopIds: string[]): Promise<Record<string, string[]>> {
  const uniqueSorted = [...new Set(shopIds.filter(Boolean))].sort();
  const key = uniqueSorted.join(",");

  return unstable_cache(
    async (): Promise<Record<string, string[]>> => {
      const out: Record<string, string[]> = {};
      for (const id of uniqueSorted) {
        const set = new Set<string>();
        try {
          const { items } = await apiProducts.listShopProducts(id);
          for (const p of items ?? []) {
            if (p.is_published === false) continue;
            const c = p.category?.trim();
            if (c) set.add(c);
          }
        } catch {
          /* skip shop */
        }
        out[id] = Array.from(set);
      }
      return out;
    },
    ["shop-product-category-map", key],
    { revalidate: TTL.PRODUCTS, tags: [CACHE_TAGS.PRODUCTS] },
  )();
}
