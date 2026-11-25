import { productImageUrls, type Product } from "@/lib/api/products";
import { normalizeListingKind, parseListingMeta, type ListingKind } from "@/lib/listingMeta";
import type { FormDraft } from "./types";

export const UGX = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export function parseAmount(v: string): number | null {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function emptyDraft(kind: ListingKind): FormDraft {
  return {
    kind,
    title: "",
    description: "",
    price_ugx: "",
    sale_price: "",
    stock_quantity: "",
    category: "",
    image_urls: [],
    is_published: true,
    is_negotiable: true,
    location_name: "",
    meta: {},
  };
}

export function productToDraft(p: Product): FormDraft {
  return {
    kind: normalizeListingKind(p.item_type),
    title: p.title ?? "",
    description: p.description ?? "",
    price_ugx: p.price_ugx != null ? String(p.price_ugx) : "",
    sale_price: p.discount_price != null ? String(p.discount_price) : "",
    stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : "",
    category: p.category ?? "",
    image_urls: productImageUrls(p),
    is_published: p.is_published ?? true,
    is_negotiable: p.is_negotiable !== false,
    location_name: p.location_name ?? "",
    meta: parseListingMeta(p.listing_meta),
  };
}

export function draftsEqual(a: FormDraft, b: FormDraft): boolean {
  return (
    a.kind === b.kind &&
    a.title === b.title &&
    a.description === b.description &&
    a.price_ugx === b.price_ugx &&
    a.sale_price === b.sale_price &&
    a.stock_quantity === b.stock_quantity &&
    a.category === b.category &&
    a.is_published === b.is_published &&
    a.is_negotiable === b.is_negotiable &&
    a.location_name === b.location_name &&
    a.image_urls.length === b.image_urls.length &&
    a.image_urls.every((u, i) => u === b.image_urls[i]) &&
    JSON.stringify(a.meta) === JSON.stringify(b.meta)
  );
}
