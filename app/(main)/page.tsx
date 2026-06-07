import { unstable_cache } from "next/cache";
import HomeLanding from "@/components/home/HomeLanding";
import { apiProducts } from "@/lib/api";
import type { HomeFeedProduct } from "@/lib/api/products";
import { publicSiteOrigin } from "@/lib/publicSite";
import { productPageSlug } from "@/lib/productUrl";
import type { ProductCardData } from "@/components/productcard";
import type { ShopCardData } from "@/components/shopcard";
import { listPublicShopsWithContacts } from "@/lib/api/server";

const CACHE_TTL = 900;

function toCard(p: HomeFeedProduct, site: string): ProductCardData {
  const slug = productPageSlug(p);
  return {
    id: p.id,
    slug,
    title: p.title,
    priceUGX: p.price_ugx,
    imageUrl: p.primary_image,
    shopLogoUrl: p.shop.logo_url ?? undefined,
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
  trending: [] as ProductCardData[],
  premium: [] as ProductCardData[],
  fresh: [] as ProductCardData[],
  shops: [] as ShopCardData[],
};

async function loadFeed(): Promise<{
  products: ProductCardData[];
  trending: ProductCardData[];
  premium: ProductCardData[];
  fresh: ProductCardData[];
  shops: ShopCardData[];
}> {
  try {
    const site = publicSiteOrigin();
    const [data, rawShops] = await Promise.all([
      apiProducts.getHomeFeed(72),
      listPublicShopsWithContacts({ limit: 20 }),
    ]);

    const shops: ShopCardData[] = rawShops
      .filter((s) => s.is_active !== false)
      .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
      .slice(0, 8)
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        category: s.category ?? "Shop",
        location: locationStr(s.location),
        tagline: s.description ?? "",
        verified: s.is_active ?? true,
        logoUrl: s.logo_url ?? null,
        shopType: s.shop_type ?? null,
        viewCount: s.view_count ?? null,
        whatsappNumber: s.whatsapp_number ?? null,
        email: s.shop_email ?? null,
        rating: s.trust_score != null ? Math.min(5, s.trust_score / 20) : null,
        reviewCount: null,
      }));

    return {
      products: (data.algorithm ?? []).map((p) => toCard(p, site)),
      trending: (data.trending ?? []).map((p) => toCard(p, site)),
      premium: (data.premium ?? []).map((p) => toCard(p, site)),
      fresh: (data.fresh ?? []).map((p) => toCard(p, site)),
      shops,
    };
  } catch (e) {
    console.error("Failed to load home feed", e);
    return EMPTY_FEED;
  }
}

const getCachedFeed = unstable_cache(
  loadFeed,
  ["home-feed"],
  { revalidate: CACHE_TTL, tags: ["products", "shops"] },
);

export default async function Home() {
  const feed = await getCachedFeed();

  return (
    <HomeLanding
      initialProducts={feed.products}
      trendingProducts={feed.trending}
      premiumProducts={feed.premium}
      freshProducts={feed.fresh}
      trendingShops={feed.shops}
    />
  );
}
