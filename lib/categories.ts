/** Canonical Midora category tree — mirrors midoraapi/core/categories.py */

export const CATEGORY_TREE: ReadonlyArray<{
  slug: string;
  label: string;
  children: readonly string[];
}> = [
  {
    slug: "food-beverage",
    label: "Food & Beverage",
    children: [
      "Fresh Produce & Groceries",
      "Packaged Foods & Snacks",
      "Beverages & Drinks",
      "Bakery & Confectionery",
      "Spices, Sauces & Condiments",
      "Organic & Health Foods",
      "Catering & Ready Meals",
      "Baby & Toddler Food",
      "Coffee, Tea & Hot Drinks",
    ],
  },
  {
    slug: "fashion",
    label: "Fashion",
    children: [
      "Men's Clothing",
      "Women's Clothing",
      "Children's Clothing",
      "Shoes & Footwear",
      "Bags & Luggage",
      "Accessories",
      "Traditional & Cultural Wear",
      "Work & Uniform Wear",
      "Underwear & Sleepwear",
      "Watches (Fashion)",
      "Sunglasses & Eyewear",
    ],
  },
  {
    slug: "electronics",
    label: "Electronics",
    children: [
      "Mobile Phones & Tablets",
      "Phone & Tablet Accessories",
      "Computers & Laptops",
      "Computer Accessories",
      "TVs & Home Entertainment",
      "Audio & Headphones",
      "Cameras & Photography",
      "Gaming Consoles & Accessories",
      "Smart Home & IoT Devices",
      "Wearable Technology",
      "Cables, Chargers & Power Banks",
      "Solar & Power Equipment",
      "Electronic Components & Parts",
    ],
  },
  {
    slug: "beauty",
    label: "Beauty",
    children: [
      "Skincare",
      "Makeup & Cosmetics",
      "Hair Care & Styling",
      "Fragrances & Perfumes",
      "Nail Care",
      "Men's Grooming",
      "Beauty Tools & Accessories",
      "Salon & Spa Products",
      "Bath & Body",
    ],
  },
  {
    slug: "home-living",
    label: "Home & Living",
    children: [
      "Furniture",
      "Home Decor",
      "Kitchen & Dining",
      "Bedding & Linens",
      "Bathroom Essentials",
      "Cleaning & Household Supplies",
      "Lighting & Lamps",
      "Storage & Organization",
      "Garden & Outdoor Living",
      "Home Appliances",
      "Cookware & Bakeware",
      "Curtains, Rugs & Textiles",
    ],
  },
  {
    slug: "services",
    label: "Services",
    children: [
      "Repair & Maintenance",
      "Cleaning Services",
      "Delivery & Logistics",
      "Professional & Consulting",
      "Beauty & Personal Care Services",
      "Education & Tutoring",
      "Tech & IT Services",
      "Events & Entertainment",
      "Photography & Videography",
      "Legal & Financial Services",
      "Home Improvement Services",
      "Health & Wellness Services",
    ],
  },
  {
    slug: "agriculture",
    label: "Agriculture",
    children: [
      "Seeds & Plants",
      "Fertilizers & Pesticides",
      "Farm Tools & Equipment",
      "Livestock & Poultry",
      "Fresh Farm Produce",
      "Animal Feed & Supplements",
      "Irrigation & Water Systems",
      "Greenhouse & Nursery Supplies",
      "Harvesting & Processing",
    ],
  },
  {
    slug: "health-wellness",
    label: "Health & Wellness",
    children: [
      "Vitamins & Supplements",
      "Medical Supplies & Equipment",
      "First Aid & Safety",
      "Personal Care & Hygiene",
      "Fitness & Nutrition",
      "Herbal & Natural Remedies",
      "Mobility & Disability Aids",
      "Maternity & Nursing Care",
      "Sexual Wellness",
    ],
  },
  {
    slug: "sports-outdoors",
    label: "Sports & Outdoors",
    children: [
      "Exercise & Fitness Equipment",
      "Team Sports",
      "Outdoor & Camping Gear",
      "Cycling",
      "Water Sports",
      "Athletics & Running",
      "Sportswear & Activewear",
      "Hunting & Fishing",
      "Yoga & Pilates",
    ],
  },
  {
    slug: "automotive",
    label: "Automotive",
    children: [
      "Car Parts & Accessories",
      "Motorcycles & Boda Boda",
      "Tires & Wheels",
      "Car Electronics & GPS",
      "Oils, Fluids & Lubricants",
      "Tools & Garage Equipment",
      "Car Care & Cleaning",
      "Bicycles & Scooters",
      "Vehicle Batteries",
    ],
  },
  {
    slug: "books-stationery",
    label: "Books & Stationery",
    children: [
      "Books & Literature",
      "School Supplies",
      "Office Supplies",
      "Art & Craft Supplies",
      "Writing Instruments",
      "Notebooks & Paper",
      "Educational Materials",
      "Magazines & Media",
      "Calendars & Planners",
    ],
  },
  {
    slug: "kids-baby",
    label: "Kids & Baby",
    children: [
      "Baby Clothing",
      "Kids Clothing",
      "Diapering & Bathing",
      "Baby Gear & Furniture",
      "Feeding & Nursing",
      "Baby Toys & Activity",
      "Strollers & Car Seats",
      "Kids Shoes & Accessories",
      "Maternity Products",
    ],
  },
  {
    slug: "pets",
    label: "Pets",
    children: [
      "Dog Supplies",
      "Cat Supplies",
      "Bird Supplies",
      "Fish & Aquarium",
      "Pet Food & Treats",
      "Pet Grooming",
      "Pet Toys & Accessories",
      "Pet Health & Medicine",
      "Small Animal Supplies",
    ],
  },
  {
    slug: "jewelry-watches",
    label: "Jewelry & Watches",
    children: [
      "Necklaces & Pendants",
      "Earrings",
      "Rings",
      "Bracelets & Bangles",
      "Watches",
      "Traditional & Cultural Jewelry",
      "Fine Jewelry",
      "Fashion Jewelry",
      "Jewelry Making Supplies",
    ],
  },
  {
    slug: "toys-games",
    label: "Toys & Games",
    children: [
      "Action Figures & Dolls",
      "Board Games & Puzzles",
      "Educational Toys",
      "Outdoor Play Equipment",
      "Remote Control & Electronic Toys",
      "Building & Construction Toys",
      "Arts & Craft Kits",
      "Party Games & Supplies",
      "Collectibles",
    ],
  },
  {
    slug: "arts-crafts",
    label: "Arts & Crafts",
    children: [
      "Painting & Drawing",
      "Sewing & Knitting",
      "Handmade & Artisan Goods",
      "Craft Materials & Supplies",
      "Scrapbooking & Paper Crafts",
      "Beading & Jewelry Making",
      "Woodworking & Carpentry Crafts",
      "Musical Instruments (Handmade)",
      "Custom & Personalized Gifts",
    ],
  },
  {
    slug: "building-hardware",
    label: "Building & Hardware",
    children: [
      "Building Materials",
      "Plumbing Supplies",
      "Electrical Supplies",
      "Paint & Finishes",
      "Tools & Power Tools",
      "Doors, Windows & Locks",
      "Roofing & Insulation",
      "Tiles & Flooring",
      "Safety Equipment & PPE",
      "Garden Tools & Equipment",
    ],
  },
  {
    slug: "other",
    label: "Other",
    children: ["General Merchandise", "Vintage & Antiques", "Wholesale & Bulk", "Uncategorized"],
  },
] as const;

export const CANONICAL_CATEGORY_LABELS = CATEGORY_TREE.map((g) => g.label);

export type CategoryLabel = (typeof CANONICAL_CATEGORY_LABELS)[number];

export type CategoryFlatItem = {
  slug: string;
  label: string;
  sort_order: number;
  parent_slug: string | null;
};

export type CategoryTreeGroup = {
  parent: { slug: string; label: string; sort_order: number };
  children: { slug: string; label: string; sort_order: number }[];
};

export type CategoryParts = {
  parentLabel: string | null;
  subcategoryLabel: string | null;
};

function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Flat parent + subcategory rows — used as API fallback and offline seed. */
export function buildCanonicalCategoryItems(): CategoryFlatItem[] {
  const rows: CategoryFlatItem[] = [];
  CATEGORY_TREE.forEach((group, parentIndex) => {
    const parentOrder = parentIndex + 1;
    rows.push({
      slug: group.slug,
      label: group.label,
      sort_order: parentOrder,
      parent_slug: null,
    });
    group.children.forEach((childLabel, childIndex) => {
      let childSlug = slugifyLabel(childLabel);
      if (childSlug === group.slug) {
        childSlug = `${group.slug}-${childSlug}`;
      }
      rows.push({
        slug: childSlug,
        label: childLabel,
        sort_order: parentOrder * 100 + childIndex + 1,
        parent_slug: group.slug,
      });
    });
  });
  return rows;
}

export function categoryItemsHaveSubcategories(
  items: { parent_slug?: string | null }[],
): boolean {
  return items.some((item) => Boolean(item.parent_slug));
}

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
  // Case-insensitive fallback
  const lower = trimmed.toLowerCase();
  const childCi = items.find(
    (c) => c.parent_slug && c.label.toLowerCase() === lower,
  );
  if (childCi) {
    const parent = items.find((c) => c.slug === childCi.parent_slug);
    return {
      parentLabel: parent?.label ?? null,
      subcategoryLabel: childCi.label,
    };
  }
  const parentCi = items.find(
    (c) => !c.parent_slug && c.label.toLowerCase() === lower,
  );
  if (parentCi) {
    return { parentLabel: parentCi.label, subcategoryLabel: null };
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
