import "server-only";

import { ApiError } from "@/lib/api/base";
import { apiProducts, apiShops } from "@/lib/api";
import type { ProductCardData } from "@/components/productcard";
import { publicSiteOrigin } from "@/lib/publicSite";
import { productPageSlug } from "@/lib/productUrl";
import type { Product } from "@/lib/api/products";


const MAX_CARDS = 72;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getShopDetails(shopId: string) {
  try {
    return await apiShops.getShop(shopId);
  } catch {
    return null;
  }
}

async function hydrateProducts(products: Product[]): Promise<ProductCardData[]> {
  const site = publicSiteOrigin();
  const cards: ProductCardData[] = [];

  // Fetch shops in small chunks to avoid exhausting the backend threadpool
  const shopIds = Array.from(new Set(products.map(p => p.shop_id)));
  const shopsMap = new Map();

  for (let i = 0; i < shopIds.length; i += 3) {
    const chunk = shopIds.slice(i, i + 3);
    await Promise.all(
      chunk.map(async (id) => {
        const shop = await getShopDetails(id);
        if (shop) shopsMap.set(id, shop);
      })
    );
  }

  for (const p of products) {
    if (p.is_published === false) continue;
    const shop = shopsMap.get(p.shop_id);
    if (!shop) continue;

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
}

// ---------------------------------------------------------------------------
// Global Feeds
// ---------------------------------------------------------------------------

export async function loadAlgorithmFeed(): Promise<ProductCardData[]> {
  try {
    const products = await apiProducts.getAlgorithmFeed({ limit: MAX_CARDS });
    return hydrateProducts(products);
  } catch (e) {
    console.error("Failed to load algorithm feed", e);
    return [];
  }
}

export async function loadLatestFeed(): Promise<ProductCardData[]> {
  try {
    const products = await apiProducts.getLatestFeed({ limit: MAX_CARDS });
    return hydrateProducts(products);
  } catch (e) {
    console.error("Failed to load latest feed", e);
    return [];
  }
}

// We keep loadMostViewedProducts to avoid breaking other components if they still rely on it,
// but it is essentially just hitting the algorithm feed now without user context.
export async function loadMostViewedProducts(limit: number = 12): Promise<ProductCardData[]> {
  try {
    const products = await apiProducts.getAlgorithmFeed({ limit });
    // sort strictly by view count just in case
    products.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
    return hydrateProducts(products.slice(0, limit));
  } catch (e) {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Shop browse: product categories per shop (for /shops filters)
// ---------------------------------------------------------------------------

export async function loadShopProductCategoryMap(shopIds: string[]): Promise<Record<string, string[]>> {
  const uniqueSorted = [...new Set(shopIds.filter(Boolean))].sort();

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
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        out[id] = [];
        continue;
      }
      throw e;
    }
    out[id] = Array.from(set);
  }
  return out;
}
