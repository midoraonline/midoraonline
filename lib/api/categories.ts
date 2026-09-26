import { apiFetch } from "./base";
import {
  buildCanonicalCategoryItems,
  categoryItemsHaveSubcategories,
  getCategoriesForFilter,
  type CategoryLabel,
  type CategoryTreeGroup,
} from "@/lib/categories";
import { normalizeCategoryFields, type CategoryMetaField } from "@/lib/listingMeta";

export type CategoryItem = {
  slug: string;
  label: string;
  sort_order: number;
  parent_slug?: string | null;
  metadata?: CategoryMetaField[];
  fields?: CategoryMetaField[];
  effective_fields?: CategoryMetaField[];
};

export type CategoryListResponse = {
  items: CategoryItem[];
};

export type CategoryCountsResponse = {
  counts: Record<string, number>;
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
      return res.items
        .map((item) => {
          const metadata = normalizeCategoryFields(item.metadata ?? item.fields);
          const next: CategoryItem = { ...item, metadata };
          if (item.fields !== undefined) next.fields = normalizeCategoryFields(item.fields);
          if (item.effective_fields !== undefined) {
            next.effective_fields = normalizeCategoryFields(item.effective_fields);
          }
          return next;
        })
        .sort((a, b) => a.sort_order - b.sort_order);
    }
  } catch {
    /* use nested fallback */
  }
  return nestedFallbackItems();
}

/** Published listing counts keyed by top-level parent category label. */
export async function fetchCategoryListingCounts(): Promise<Record<string, number>> {
  try {
    const res = await apiFetch<CategoryCountsResponse>("/api/v1/categories/counts");
    return res.counts ?? {};
  } catch {
    return {};
  }
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
