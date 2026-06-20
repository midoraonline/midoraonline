import { cookies } from "next/headers";
import HomeLanding from "@/components/home/HomeLanding";
import { apiProducts } from "@/lib/api";
import type { HomeFeedProduct } from "@/lib/api/products";
import { publicSiteOrigin } from "@/lib/publicSite";
import { productPageSlug } from "@/lib/productUrl";
import type { ProductCardData } from "@/components/productcard";

function toCard(p: HomeFeedProduct, site: string): ProductCardData {
  const slug = productPageSlug(p);
  return {
    id: p.id,
    slug,
    title: p.title,
    priceUGX: p.price_ugx,
    originalPriceUGX: p.price_ugx,
    discountPriceUGX: p.discount_price ?? null,
    discountPercent: p.discount_price != null && p.discount_price > 0 && p.discount_price < p.price_ugx
      ? Math.round((1 - p.discount_price / p.price_ugx) * 100)
      : 0,
    imageUrl: p.primary_image,
    shopLogoUrl: p.shop.logo_url ?? undefined,
    stockQuantity: p.stock_quantity,
    viewCount: p.view_count,
    likeCount: p.like_count,
    isLiked: p.viewer_liked ?? undefined,
    shopWhatsApp: p.shop.whatsapp_number ?? null,
    listingUrl: `${site}/products/${slug}`,
    sellerId: p.shop.owner_id ?? null,
    shop: {
      id: p.shop.id,
      name: p.shop.name,
      slug: p.shop.slug,
      verified: p.shop.is_active,
      category: p.shop.category ?? null,
      trust_score: p.shop.trust_score ?? null,
      available_now: p.shop.available_now ?? null,
      location: p.shop.location ?? null,
    },
    category: p.category ?? null,
    boosted: p.boosted,
    updated_at: p.updated_at ?? p.created_at ?? null,
    location_name: p.location_name ?? null,
  };
}

function locationStr(loc: unknown): string {
  if (typeof loc === "string") return loc;
  if (loc && typeof loc === "object" && "display" in loc)
    return String((loc as { display?: string }).display ?? "Online");
  return "Online";
}

const EMPTY_FEED = {
  products: [] as ProductCardData[],
};

async function loadFeed(token?: string): Promise<{
  products: ProductCardData[];
}> {
  try {
    const site = publicSiteOrigin();
    const data = await apiProducts.getHomeFeed(72, undefined, token);

    return {
      products: (data.algorithm ?? []).map((p) => toCard(p, site)),
    };
  } catch (e) {
    console.error("Failed to load home feed", e);
    return EMPTY_FEED;
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("midora_access")?.value;
  const feed = await loadFeed(token);

  return (
    <HomeLanding
      initialProducts={feed.products}
    />
  );
}
