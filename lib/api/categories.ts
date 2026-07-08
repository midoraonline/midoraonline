import { apiFetch } from "./base";
import {
  CANONICAL_CATEGORY_LABELS,
  groupCategoriesByParent,
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

export async function listCategoryItems(): Promise<CategoryItem[]> {
  try {
    const res = await apiFetch<CategoryListResponse>("/api/v1/categories/");
    if (res.items.length > 0) {
      return res.items.slice().sort((a, b) => a.sort_order - b.sort_order);
    }
  } catch {
    /* use static fallback */
  }
  return CANONICAL_CATEGORY_LABELS.map((label, i) => ({
    slug: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label,
    sort_order: i + 1,
    parent_slug: null,
  }));
}

export async function listCategories(): Promise<CategoryLabel[]> {
  const items = await listCategoryItems();
  const labels = items.map((c) => c.label);
  if (labels.length > 0) return labels as CategoryLabel[];
  return [...CANONICAL_CATEGORY_LABELS];
}

export async function listCategoryTree(): Promise<CategoryTreeGroup[]> {
  return groupCategoriesByParent(await listCategoryItems());
}
