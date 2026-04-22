import "server-only";
import { cache } from "react";

import { apiProducts, apiShops } from "@/lib/api";
import type { ProductCardData } from "@/components/productcard";
import { productPageSlug } from "@/lib/productUrl";

const MAX_CARDS = 72;
const SHOPS_TO_SCAN = 20;
const PER_SHOP_CAP = 12;

/**
 * Aggregate published listings from public shops for the global /products page.
 *
 * Uses React.cache so the feed is fetched once per request, and fans out the
 * per-shop product calls in parallel (previously the sequential loop was the
 * main cause of the `/products` page taking 9+ seconds in dev).
 */
export const loadPublicProductFeed = cache(async (): Promise<ProductCardData[]> => {
  let shops: Awaited<ReturnType<typeof apiShops.listPublic>>["items"] = [];
  try {
    const res = await apiShops.listPublic({ page: 1, limit: SHOPS_TO_SCAN });
    shops = res.items ?? [];
  } catch {
    return [];
  }

  const perShop = await Promise.all(
    shops.map(async (shop) => {
      try {
        const { items: products } = await apiProducts.listShopProducts(shop.id);
        const cards: ProductCardData[] = [];
        for (const p of products) {
          if (cards.length >= PER_SHOP_CAP) break;
          if (p.is_published === false) continue;
          cards.push({
            id: p.id,
            slug: productPageSlug(p),
            title: p.title,
            priceUGX: apiProducts.productPriceUgx(p),
            imageUrl: apiProducts.productPrimaryImage(p),
            shopLogoUrl: shop.logo_url ?? undefined,
            shop: {
              id: shop.id,
              name: shop.name,
              slug: shop.slug,
              verified: shop.is_active ?? true,
            },
          });
        }
        return cards;
      } catch {
        return [] as ProductCardData[];
      }
    }),
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
});
