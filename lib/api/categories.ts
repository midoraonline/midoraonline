import { apiFetch } from "./base";
import { CANONICAL_CATEGORY_LABELS, type CategoryLabel } from "@/lib/categories";

export type CategoryItem = {
  slug: string;
  label: string;
  sort_order: number;
};

export type CategoryListResponse = {
  items: CategoryItem[];
};

export async function listCategories(): Promise<CategoryLabel[]> {
  try {
    const res = await apiFetch<CategoryListResponse>("/api/v1/categories/");
    const labels = res.items
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.label);
    if (labels.length > 0) return labels as CategoryLabel[];
  } catch {
    /* use static fallback */
  }
  return [...CANONICAL_CATEGORY_LABELS];
}
