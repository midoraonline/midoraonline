import type { Shop } from "@/lib/api/shops";
import type { ProductCardData } from "@/components/productcard";
import { resolveCategoryParts } from "@/lib/categories";

export function normCat(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function catEquals(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  return normCat(a) === normCat(b);
}

export type CategoryFilterSelection = {
  parentLabel: string | null;
  subcategoryLabel: string | null;
};

export const EMPTY_CATEGORY_FILTER: CategoryFilterSelection = {
  parentLabel: null,
  subcategoryLabel: null,
};

export function isCategoryFilterActive(selection: CategoryFilterSelection): boolean {
  return Boolean(selection.parentLabel || selection.subcategoryLabel);
}

export function categoryFilterDisplayLabel(selection: CategoryFilterSelection): string | null {
  if (!isCategoryFilterActive(selection)) return null;
  if (selection.subcategoryLabel) {
    if (selection.parentLabel) {
      return `${selection.parentLabel} › ${selection.subcategoryLabel}`;
    }
    return selection.subcategoryLabel;
  }
  return selection.parentLabel;
}

export function productMatchesCategoryFilter(
  product: { category?: string | null; shop: { category?: string | null } },
  selection: CategoryFilterSelection,
  items: { slug: string; label: string; parent_slug?: string | null }[],
): boolean {
  if (!isCategoryFilterActive(selection)) return true;

  if (selection.subcategoryLabel) {
    return (
      catEquals(product.category, selection.subcategoryLabel) ||
      catEquals(product.shop.category, selection.subcategoryLabel)
    );
  }

  const parentLabel = selection.parentLabel;
  if (!parentLabel) return true;

  const parentSlug = items.find(
    (c) => c.label === parentLabel && !c.parent_slug,
  )?.slug;
  const childLabels = new Set(
    items.filter((c) => c.parent_slug === parentSlug).map((c) => c.label),
  );

  function matchesLabel(label: string | null | undefined) {
    if (!label?.trim()) return false;
    const trimmed = label.trim();
    if (catEquals(trimmed, parentLabel)) return true;
    if (childLabels.has(trimmed)) return true;
    const parts = resolveCategoryParts(trimmed, items);
    return Boolean(
      parts.parentLabel && catEquals(parts.parentLabel, parentLabel),
    );
  }

  return matchesLabel(product.category) || matchesLabel(product.shop.category);
}

export function shopMatchesCategoryFilter(
  shopCategory: string | null | undefined,
  productCats: string[],
  selection: CategoryFilterSelection,
  items: { slug: string; label: string; parent_slug?: string | null }[],
): boolean {
  if (!isCategoryFilterActive(selection)) return true;

  if (selection.subcategoryLabel) {
    if (catEquals(shopCategory, selection.subcategoryLabel)) return true;
    return productCats.some((c) => catEquals(c, selection.subcategoryLabel!));
  }

  const parentLabel = selection.parentLabel;
  if (!parentLabel) return true;

  const parentSlug = items.find(
    (c) => c.label === parentLabel && !c.parent_slug,
  )?.slug;
  const childLabels = new Set(
    items.filter((c) => c.parent_slug === parentSlug).map((c) => c.label),
  );

  function matchesLabel(label: string | null | undefined) {
    if (!label?.trim()) return false;
    const trimmed = label.trim();
    if (catEquals(trimmed, parentLabel)) return true;
    if (childLabels.has(trimmed)) return true;
    const parts = resolveCategoryParts(trimmed, items);
    return Boolean(
      parts.parentLabel && catEquals(parts.parentLabel, parentLabel),
    );
  }

  return matchesLabel(shopCategory) || productCats.some((c) => matchesLabel(c));
}

export function collectCategoriesFromShops(shops: Shop[]): string[] {
  const set = new Set<string>();
  for (const s of shops) {
    const c = s.category?.trim();
    if (c) set.add(c);
  }
  return Array.from(set);
}

export function collectCategoriesFromShopProductMap(map: Record<string, string[]>): string[] {
  const set = new Set<string>();
  for (const cats of Object.values(map)) {
    for (const c of cats) {
      const t = c?.trim();
      if (t) set.add(t);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function shopHasProductCategory(
  shopId: string,
  map: Record<string, string[]>,
  selected: string,
): boolean {
  const cats = map[shopId] ?? [];
  return cats.some((c) => catEquals(c, selected));
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

export const browseProductGridClass =
  "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5";

export const browseShopGridClass =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5";
