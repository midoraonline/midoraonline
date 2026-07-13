import { apiFetch } from "./base";
import {
  buildCanonicalCategoryItems,
  categoryItemsHaveSubcategories,
  getCategoriesForFilter,
  type CategoryLabel,
  type CategoryTreeGroup,
} from "@/lib/categories";

export type CategoryItem = {
  slug: string;
  label: string;
  sort_order: number;
  parent_slug?: string | null;
};

export type CategoryListResponse = {
  items: CategoryItem[];
};

function nestedFallbackItems(): CategoryItem[] {
  return buildCanonicalCategoryItems();
}

/**
 * Prefer API items only when they include subcategories.
 * Flat parent-only payloads (old DB / incomplete migration) fall back to the
 * canonical nested tree so pickers always show subcategory chips.
 */
export async function listCategoryItems(): Promise<CategoryItem[]> {
  try {
    const res = await apiFetch<CategoryListResponse>("/api/v1/categories/");
    if (res.items.length > 0 && categoryItemsHaveSubcategories(res.items)) {
      return res.items.slice().sort((a, b) => a.sort_order - b.sort_order);
    }
  } catch {
    /* use nested fallback */
  }
  return nestedFallbackItems();
}

export async function listCategories(): Promise<CategoryLabel[]> {
  const items = await listCategoryItems();
  const parents = items.filter((c) => !c.parent_slug).map((c) => c.label);
  if (parents.length > 0) return parents as CategoryLabel[];
  return nestedFallbackItems()
    .filter((c) => !c.parent_slug)
    .map((c) => c.label) as CategoryLabel[];
}

export async function listCategoryTree(): Promise<CategoryTreeGroup[]> {
  return getCategoriesForFilter(await listCategoryItems());
}

/** Fetch flat items and grouped parent/subcategory tree for filters and forms. */
export async function fetchCategoryFilterData(): Promise<{
  items: CategoryItem[];
  tree: CategoryTreeGroup[];
}> {
  const items = await listCategoryItems();
  return { items, tree: getCategoriesForFilter(items) };
}
