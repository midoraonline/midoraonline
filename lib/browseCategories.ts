import type { Shop } from "@/lib/api/shops";
import type { ProductCardData } from "@/components/productcard";

export function normCat(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function catEquals(a: string | null | undefined, selected: string): boolean {
  return normCat(a) === normCat(selected);
}

export function collectCategoriesFromShops(shops: Shop[]): string[] {
  const set = new Set<string>();
  for (const s of shops) {
    const c = s.category?.trim();
    if (c) set.add(c);
  }
  return Array.from(set);
}

export function collectCategoriesFromProducts(products: ProductCardData[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const pc = p.category?.trim();
    if (pc) set.add(pc);
    const sc = p.shop.category?.trim();
    if (sc) set.add(sc);
  }
  return Array.from(set);
}

export function collectCategoriesFromShopsAndProducts(
  shops: Shop[],
  products: ProductCardData[],
): string[] {
  const set = new Set<string>();
  for (const c of collectCategoriesFromShops(shops)) set.add(c);
  for (const c of collectCategoriesFromProducts(products)) set.add(c);
  return Array.from(set);
}

/** Two columns on narrow phones when category rail is collapsed; one column when expanded (more room per card). md+ ignores rail width. */
export function browseShopGridForSidebar(sidebarCollapsed: boolean): string {
  return sidebarCollapsed
    ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-3 lg:gap-4"
    : "grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-3 lg:gap-4";
}

export function browseProductGridForSidebar(sidebarCollapsed: boolean): string {
  return sidebarCollapsed
    ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4 lg:gap-4"
    : "grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4 lg:gap-4";
}

/** @deprecated Use browseShopGridForSidebar(true) for static layouts. */
export const browseShopGridClass =
  "grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 md:gap-3 lg:grid-cols-3 lg:gap-4";

/** @deprecated Use browseProductGridForSidebar(true). */
export const browseProductGridClass =
  "grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 md:gap-3 lg:grid-cols-4 lg:gap-4";
