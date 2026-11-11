import type { ListingKind } from "@/lib/listingMeta";

type ShopKind = "product" | "service" | "both" | string | null | undefined;

/** Mirrors the API: products and services need a shop that sells them; opportunities fit any shop. */
export function shopAcceptsKind(shopType: ShopKind, kind: ListingKind | string | null | undefined): boolean {
  const type = shopType || "product";
  if (kind === "product") return type === "product" || type === "both";
  if (kind === "service") return type === "service" || type === "both";
  return true;
}

export function shopTypeLabel(shopType: ShopKind): string {
  if (shopType === "service") return "Services";
  if (shopType === "both") return "Products and services";
  return "Products";
}

/** Shown where a listing belongs to no shop. */
export const OTHER_LISTINGS_LABEL = "Other listings";
