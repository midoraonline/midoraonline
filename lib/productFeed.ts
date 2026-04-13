import { apiProducts, apiShops } from "@/lib/api";
import type { ProductCardData } from "@/components/productcard";

const MAX_CARDS = 72;
const SHOPS_TO_SCAN = 20;
const PER_SHOP_CAP = 12;

/** Aggregate published listings from public shops for the global /products page. */
export async function loadPublicProductFeed(): Promise<ProductCardData[]> {
  let shops: Awaited<ReturnType<typeof apiShops.listPublic>>["items"] = [];
  try {
    const res = await apiShops.listPublic({ page: 1, limit: SHOPS_TO_SCAN });
    shops = res.items ?? [];
  } catch {
    return [];
  }

  const out: ProductCardData[] = [];

  for (const shop of shops) {
    if (out.length >= MAX_CARDS) break;
    try {
      const { items: products } = await apiProducts.listShopProducts(shop.id);
      let n = 0;
      for (const p of products) {
        if (out.length >= MAX_CARDS) break;
        if (p.is_published === false) continue;
        out.push({
          id: p.id,
          slug: p.id,
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
        n += 1;
        if (n >= PER_SHOP_CAP) break;
      }
    } catch {
      /* skip shop */
    }
  }

  out.sort((a, b) => {
    /* Prefer stable ordering: title then id */
    return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  });

  return out;
}
