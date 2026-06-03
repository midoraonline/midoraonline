import { unstable_cache } from "next/cache";
import HomeLanding from "@/components/home/HomeLanding";
import { apiProducts } from "@/lib/api";
import type { HomeFeedProduct } from "@/lib/api/products";
import { publicSiteOrigin } from "@/lib/publicSite";
import { productPageSlug } from "@/lib/productUrl";
import type { ProductCardData } from "@/components/productcard";

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

async function loadFeed(): Promise<{
  products: ProductCardData[];
  trending: ProductCardData[];
  premium: ProductCardData[];
  fresh: ProductCardData[];
}> {
  const site = publicSiteOrigin();
  const data = await apiProducts.getHomeFeed(72);

  return {
    products: (data.algorithm ?? []).map((p) => toCard(p, site)),
    trending: (data.trending ?? []).map((p) => toCard(p, site)),
    premium: (data.premium ?? []).map((p) => toCard(p, site)),
    fresh: (data.fresh ?? []).map((p) => toCard(p, site)),
  };
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
    />
  );
}
