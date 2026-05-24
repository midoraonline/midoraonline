/** Canonical browse categories (mirrors midoraapi/core/categories.py). */
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
  "Other",
] as const;

export type CategoryLabel = (typeof CANONICAL_CATEGORY_LABELS)[number];
