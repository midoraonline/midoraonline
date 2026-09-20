import "server-only";
import { cache } from "react";

import type { ProductCardData } from "@/components/productcard";
import { homeFeedProductToCard } from "@/lib/productCardMap";
import { publicSiteOrigin } from "@/lib/publicSite";
import {
  HOME_FEED_PAGE_SIZE,
  type HomeFeedProduct,
  type HomeFeedResponse,
} from "@/lib/api/products";
import { serverApiFetch } from "@/lib/api/serverFetch";

export type HomeFeedPage = {
  products: ProductCardData[];
  hasMore: boolean;
  nextCursor: string | null;
};

const EMPTY_FEED: HomeFeedPage = {
  products: [],
  hasMore: false,
  nextCursor: null,
};

function toCards(rows: HomeFeedProduct[]): ProductCardData[] {
  const site = publicSiteOrigin();
  return rows.map((p) => homeFeedProductToCard(p, site));
}

export const loadHomeFeed = cache(async function loadHomeFeed(
  limit = HOME_FEED_PAGE_SIZE,
): Promise<HomeFeedPage> {
  try {
    const data = await serverApiFetch<HomeFeedResponse>(
      `/api/v1/feed/home?limit=${limit}`,
    );
    const products = toCards(data.algorithm ?? []);
    if (products.length) {
      return {
        products,
        hasMore: Boolean(data.has_more && data.next_cursor),
        nextCursor: data.next_cursor ?? null,
      };
    }
  } catch {
    /* fall through to latest */
  }

  try {
    const latest = await serverApiFetch<HomeFeedProduct[]>(
      `/api/v1/feed/latest?limit=${limit}`,
      { anonymous: true },
    );
    const products = toCards(latest ?? []);
    if (!products.length) return EMPTY_FEED;
    const full = products.length >= limit;
    return {
      products,
      hasMore: full,
      nextCursor: full ? "p:2" : null,
    };
  } catch {
    return EMPTY_FEED;
  }
});

export async function loadLatestFeed(): Promise<ProductCardData[]> {
  return (await loadHomeFeed()).products;
}

export async function loadShopProductCategoryMap(
  shopIds: string[],
): Promise<Record<string, string[]>> {
  const uniqueSorted = [...new Set(shopIds.filter(Boolean))].sort().slice(0, 200);
  if (uniqueSorted.length === 0) return {};
  try {
    const params = new URLSearchParams({ shop_ids: uniqueSorted.join(",") });
    const data = await serverApiFetch<{ categories?: Record<string, string[]> }>(
      `/api/v1/shops/product-categories?${params.toString()}`,
    );
    return data.categories ?? Object.fromEntries(uniqueSorted.map((id) => [id, [] as string[]]));
  } catch {
    return Object.fromEntries(uniqueSorted.map((id) => [id, [] as string[]]));
  }
}
