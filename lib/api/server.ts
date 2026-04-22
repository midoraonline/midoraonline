/**
 * Server-only fetch helpers. Every function here is wrapped in `React.cache`
 * so that a single request (layout + page + generateMetadata) performs ONE
 * network call per resource instead of 2–5.
 *
 * Only import these from server components and `generateMetadata`. Client
 * components should use the plain `apiFetch` helpers through the API
 * modules in `lib/api/*`.
 */
import "server-only";

import { cache } from "react";

import { apiProducts, apiShops } from "@/lib/api";
import type { Product } from "@/lib/api/products";
import type { Shop } from "@/lib/api/shops";

export const getShopBySlug = cache(async (slug: string): Promise<Shop | null> => {
  try {
    return await apiShops.bySlug(slug);
  } catch {
    return null;
  }
});

export const getShopById = cache(async (shopId: string): Promise<Shop | null> => {
  try {
    return await apiShops.getShop(shopId);
  } catch {
    return null;
  }
});

export const getProductById = cache(async (productId: string): Promise<Product | null> => {
  try {
    return await apiProducts.getProduct(productId);
  } catch {
    return null;
  }
});

export const listShopProducts = cache(
  async (shopId: string): Promise<Product[]> => {
    try {
      const res = await apiProducts.listShopProducts(shopId);
      return res.items ?? [];
    } catch {
      return [];
    }
  },
);

export const listPublicShops = cache(
  async (opts?: { search?: string; shop_type?: string; limit?: number }): Promise<Shop[]> => {
    try {
      const res = await apiShops.listPublic(opts);
      return res.items ?? [];
    } catch {
      return [];
    }
  },
);
