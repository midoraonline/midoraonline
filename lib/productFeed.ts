import "server-only";
import { cookies } from "next/headers";

import type { ProductCardData } from "@/components/productcard";
import { publicSiteOrigin } from "@/lib/publicSite";
import { productPageSlug } from "@/lib/productUrl";
import type { HomeFeedProduct, HomeFeedResponse } from "@/lib/api/products";

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

/**
 * Build headers for server-to-FastAPI calls.
 *
 * Reads the midora_access cookie from next/headers and injects it as a
 * Bearer token. This is required on Vercel where server components cannot
 * rely on cookies being transparently forwarded to external API calls.
 */
async function buildAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("midora_access")?.value;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  return base;
}

async function fetchHomeFeed(limit: number): Promise<HomeFeedResponse | null> {
  try {
    const headers = await buildAuthHeaders();
    const res = await fetch(
      `${getApiBase()}/api/v1/feed/home?limit=${limit}`,
      { headers, cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as HomeFeedResponse;
  } catch {
    return null;
  }
}

export async function loadAlgorithmFeed(): Promise<ProductCardData[]> {
  const data = await fetchHomeFeed(MAX_CARDS);
  if (!data) return [];
  const site = publicSiteOrigin();
  return (data.algorithm ?? []).map((p) => toCard(p, site));
}

export async function loadLatestFeed(): Promise<ProductCardData[]> {
  return loadAlgorithmFeed();
}

export async function loadMostViewedProducts(limit: number = 12): Promise<ProductCardData[]> {
  const data = await fetchHomeFeed(limit);
  if (!data) return [];
  const site = publicSiteOrigin();
  const sorted = [...(data.algorithm ?? [])]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, limit);
  return sorted.map((p) => toCard(p, site));
}

export async function loadPremiumFeed(limit: number = 12): Promise<ProductCardData[]> {
  const data = await fetchHomeFeed(limit);
  if (!data) return [];
  const site = publicSiteOrigin();
  const sorted = [...(data.premium ?? [])]
    .sort((a, b) => b.listing_score - a.listing_score)
    .slice(0, limit);
  return sorted.map((p) => toCard(p, site));
}

export async function loadBoostedFeed(limit: number = 12): Promise<ProductCardData[]> {
  const data = await fetchHomeFeed(MAX_CARDS);
  if (!data) return [];
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
}

export async function loadTrendingFeed(limit: number = 12): Promise<ProductCardData[]> {
  const data = await fetchHomeFeed(limit);
  if (!data) return [];
  const site = publicSiteOrigin();
  const sorted = [...(data.trending ?? [])]
    .sort((a, b) => b.listing_score - a.listing_score)
    .slice(0, limit);
  return sorted.map((p) => toCard(p, site));
}

export async function loadFreshFeed(limit: number = 12): Promise<ProductCardData[]> {
  const data = await fetchHomeFeed(limit);
  if (!data) return [];
  const site = publicSiteOrigin();
  const sorted = [...(data.fresh ?? [])]
    .sort((a, b) => {
      const aT = a.updated_at ?? a.created_at ?? "";
      const bT = b.updated_at ?? b.created_at ?? "";
      return bT.localeCompare(aT);
    })
    .slice(0, limit);
  return sorted.map((p) => toCard(p, site));
}

export async function loadShopProductCategoryMap(shopIds: string[]): Promise<Record<string, string[]>> {
  const apiBase = getApiBase();
  const uniqueSorted = [...new Set(shopIds.filter(Boolean))].sort();
  const headers = await buildAuthHeaders();
  const entries = await Promise.all(
    uniqueSorted.map(async (id) => {
      const set = new Set<string>();
      try {
        const res = await fetch(
          `${apiBase}/api/v1/shops/${encodeURIComponent(id)}/products`,
          { headers, cache: "no-store" }
        );
        if (!res.ok) return [id, [] as string[]] as const;
        const data = await res.json() as { items?: { is_published?: boolean; category?: string }[] };
        for (const p of data.items ?? []) {
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
