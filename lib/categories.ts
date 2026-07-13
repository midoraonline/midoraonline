export const CANONICAL_CATEGORY_LABELS = [
  "Food & Beverage",
  "Fashion",
  "Electronics",
  "Beauty",
  "Home & Living",
  "Services",
  "Agriculture",
  "Health & Wellness",
  "Sports & Outdoors",
  "Automotive",
  "Books & Stationery",
  "Kids & Baby",
  "Pets",
  "Jewelry & Watches",
  "Toys & Games",
  "Arts & Crafts",
  "Building & Hardware",
  "Other",
] as const;

export type CategoryLabel = (typeof CANONICAL_CATEGORY_LABELS)[number];

export type CategoryTreeGroup = {
  parent: { slug: string; label: string; sort_order: number };
  children: { slug: string; label: string; sort_order: number }[];
};

export type CategoryParts = {
  parentLabel: string | null;
  subcategoryLabel: string | null;
};

export function resolveCategoryParts(
  value: string | null | undefined,
  items: { slug: string; label: string; parent_slug?: string | null }[],
): CategoryParts {
  if (!value?.trim()) {
    return { parentLabel: null, subcategoryLabel: null };
  }
  const trimmed = value.trim();
  const child = items.find((c) => c.label === trimmed && c.parent_slug);
  if (child) {
    const parent = items.find((c) => c.slug === child.parent_slug);
    return {
      parentLabel: parent?.label ?? null,
      subcategoryLabel: child.label,
    };
  }
  const parent = items.find((c) => c.label === trimmed && !c.parent_slug);
  if (parent) {
    return { parentLabel: parent.label, subcategoryLabel: null };
  }
  return { parentLabel: trimmed, subcategoryLabel: null };
}

/** Parent categories with subcategories — use for browse filters and pickers. */
export function getCategoriesForFilter(
  items: { slug: string; label: string; sort_order: number; parent_slug?: string | null }[],
): CategoryTreeGroup[] {
  return groupCategoriesByParent(items);
}

export function groupCategoriesByParent(
  items: { slug: string; label: string; sort_order: number; parent_slug?: string | null }[],
): CategoryTreeGroup[] {
  const parents = items
    .filter((c) => !c.parent_slug)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
  const byParent = new Map<string, { slug: string; label: string; sort_order: number }[]>();
  for (const c of items) {
    if (!c.parent_slug) continue;
    const list = byParent.get(c.parent_slug) ?? [];
    list.push({ slug: c.slug, label: c.label, sort_order: c.sort_order });
    byParent.set(c.parent_slug, list);
  }
  return parents.map((parent) => ({
    parent,
    children: (byParent.get(parent.slug) ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }));
}
