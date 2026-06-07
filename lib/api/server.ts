import "server-only";

import { ApiError } from "@/lib/api/base";
import { apiProducts, apiShops } from "@/lib/api";
import type { Product } from "@/lib/api/products";
import type { Shop } from "@/lib/api/shops";

async function nullIfNotFound<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  return nullIfNotFound(apiShops.bySlug(slug));
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  return nullIfNotFound(apiShops.getShop(shopId));
}

export async function listPublicShops(opts?: {
  search?: string;
  shop_type?: string;
  limit?: number;
}): Promise<Shop[]> {
  const res = await apiShops.listPublic(opts);
  return res.items ?? [];
}

// The listing endpoint omits contact fields (whatsapp_number, shop_email).
// This fetches each shop's full record in parallel to hydrate those fields.
export async function listPublicShopsWithContacts(opts?: {
  search?: string;
  shop_type?: string;
  limit?: number;
}): Promise<Shop[]> {
  const partial = await listPublicShops(opts);
  const full = await Promise.all(
    partial.map((s) => nullIfNotFound(apiShops.getShop(s.id)))
  );
  return full.map((f, i) => (f ? { ...partial[i], ...f } : partial[i]));
}

export async function getProductById(productId: string): Promise<Product | null> {
  return nullIfNotFound(apiProducts.getProduct(productId));
}

export async function listShopProducts(shopId: string): Promise<Product[]> {
  const res = await apiProducts.listShopProducts(shopId);
  return res.items ?? [];
}
