import "server-only";

import { apiProducts } from "@/lib/api";
import type { ProductCardData } from "@/components/productcard";
import { publicSiteOrigin } from "@/lib/publicSite";
import { productPageSlug } from "@/lib/productUrl";
import type { HomeFeedProduct } from "@/lib/api/products";

const MAX_CARDS = 72;

function toCard(p: HomeFeedProduct, site: string): ProductCardData {
  const slug = productPageSlug(p);
  return {
    id: p.id,
    slug,
    title: p.title,
    priceUGX: p.price_ugx,
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

export async function loadAlgorithmFeed(): Promise<ProductCardData[]> {
  try {
    const data = await apiProducts.getHomeFeed(MAX_CARDS);
    const site = publicSiteOrigin();
    return (data.algorithm ?? []).map((p) => toCard(p, site));
  } catch (e) {
    console.error("Failed to load algorithm feed", e);
    return [];
  }
}

export async function loadLatestFeed(): Promise<ProductCardData[]> {
  try {
    const data = await apiProducts.getHomeFeed(MAX_CARDS);
    const site = publicSiteOrigin();
    const merged = [
      ...(data.fresh ?? []),
      ...(data.algorithm ?? []),
    ];
    const deduped = [...new Map(merged.map((p) => [p.id, p])).values()]
      .sort((a, b) => {
        const aT = a.created_at ?? "";
        const bT = b.created_at ?? "";
        return bT.localeCompare(aT);
      });
    return deduped.map((p) => toCard(p, site));
  } catch (e) {
    console.error("Failed to load latest feed", e);
    return [];
  }
}

export async function loadMostViewedProducts(limit: number = 12): Promise<ProductCardData[]> {
  try {
    const data = await apiProducts.getHomeFeed(limit);
    const site = publicSiteOrigin();
    const sorted = [...(data.algorithm ?? [])]
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, limit);
    return sorted.map((p) => toCard(p, site));
  } catch (e) {
    return [];
  }
}

export async function loadPremiumFeed(limit: number = 12): Promise<ProductCardData[]> {
  try {
    const data = await apiProducts.getHomeFeed(limit);
    const site = publicSiteOrigin();
    const sorted = [...(data.premium ?? [])]
      .sort((a, b) => b.listing_score - a.listing_score)
      .slice(0, limit);
    return sorted.map((p) => toCard(p, site));
  } catch (e) {
    return [];
  }
}

export async function loadBoostedFeed(limit: number = 12): Promise<ProductCardData[]> {
  try {
    const data = await apiProducts.getHomeFeed(MAX_CARDS);
    const site = publicSiteOrigin();
    const all = [
      ...(data.algorithm ?? []),
      ...(data.trending ?? []),
      ...(data.premium ?? []),
    ];
    return [...new Map(all.map((p) => [p.id, p])).values()]
      .filter((p) => p.boosted)
      .slice(0, limit)
      .map((p) => toCard(p, site));
  } catch (e) {
    return [];
  }
}

export async function loadTrendingFeed(limit: number = 12): Promise<ProductCardData[]> {
  try {
    const data = await apiProducts.getHomeFeed(limit);
    const site = publicSiteOrigin();
    const sorted = [...(data.trending ?? [])]
      .sort((a, b) => b.listing_score - a.listing_score)
      .slice(0, limit);
    return sorted.map((p) => toCard(p, site));
  } catch (e) {
    return [];
  }
}

export async function loadFreshFeed(limit: number = 12): Promise<ProductCardData[]> {
  try {
    const data = await apiProducts.getHomeFeed(limit);
    const site = publicSiteOrigin();
    const sorted = [...(data.fresh ?? [])]
      .sort((a, b) => {
        const aT = a.updated_at ?? a.created_at ?? "";
        const bT = b.updated_at ?? b.created_at ?? "";
        return bT.localeCompare(aT);
      })
      .slice(0, limit);
    return sorted.map((p) => toCard(p, site));
  } catch (e) {
    return [];
  }
}

export async function loadShopProductCategoryMap(shopIds: string[]): Promise<Record<string, string[]>> {
  const uniqueSorted = [...new Set(shopIds.filter(Boolean))].sort();
  const entries = await Promise.all(
    uniqueSorted.map(async (id) => {
      const set = new Set<string>();
      try {
        const { items } = await apiProducts.listShopProducts(id);
        for (const p of items ?? []) {
          if (p.is_published === false) continue;
          const c = p.category?.trim();
          if (c) set.add(c);
        }
      } catch {
        return [id, [] as string[]] as const;
      }
      return [id, Array.from(set)] as const;
    }),
  );
  return Object.fromEntries(entries);
}
