export const CATEGORY_ICON_MAP: Record<string, string> = {
  "Food & Beverage":    "restaurant",
  "Fashion":            "checkroom",
  "Electronics":        "devices",
  "Beauty":             "face",
  "Home & Living":      "chair",
  "Services":           "handyman",
  "Agriculture":        "grass",
  "Health & Wellness":  "health_and_safety",
  "Sports & Outdoors":  "fitness_center",
  "Automotive":         "directions_car",
  "Books & Stationery": "menu_book",
  "Kids & Baby":        "child_care",
  "Pets":               "pets",
  "Jewelry & Watches":  "diamond",
  "Toys & Games":       "toys",
  "Arts & Crafts":      "palette",
  "Building & Hardware":"construction",
  "Other":              "category",
};

export const ALL_CATEGORIES_ICON = "apps";

export function resolveCategoryIcon(label: string): string {
  if (label in CATEGORY_ICON_MAP) return CATEGORY_ICON_MAP[label]!;
  const l = label.toLowerCase();
  if (/food|drink|bev|restaurant|cafe|snack|grocer/.test(l))  return CATEGORY_ICON_MAP["Food & Beverage"]!;
  if (/fashion|cloth|wear|apparel|shoe|bag/.test(l))           return CATEGORY_ICON_MAP["Fashion"]!;
  if (/electronic|tech|phone|laptop|gadget/.test(l))           return CATEGORY_ICON_MAP["Electronics"]!;
  if (/beauty|cosmetic|skin|hair|salon/.test(l))               return CATEGORY_ICON_MAP["Beauty"]!;
  if (/home|furniture|decor|kitchen|interior/.test(l))         return CATEGORY_ICON_MAP["Home & Living"]!;
  if (/service|repair|consult|freelance|hardware/.test(l))     return CATEGORY_ICON_MAP["Services"]!;
  if (/farm|agri|crop|grain|plant/.test(l))                    return CATEGORY_ICON_MAP["Agriculture"]!;
  if (/health|medical|pharma|wellness/.test(l))                return CATEGORY_ICON_MAP["Health & Wellness"]!;
  if (/sport|fitness|gym|outdoor|camp/.test(l))                return CATEGORY_ICON_MAP["Sports & Outdoors"]!;
  if (/auto|car|vehicle|motor|boda/.test(l))                   return CATEGORY_ICON_MAP["Automotive"]!;
  if (/book|stationery|school|education|office/.test(l))       return CATEGORY_ICON_MAP["Books & Stationery"]!;
  if (/baby|kid|toy/.test(l))                                  return CATEGORY_ICON_MAP["Kids & Baby"]!;
  if (/pet|animal|dog|cat/.test(l))                            return CATEGORY_ICON_MAP["Pets"]!;
  if (/jewel|watch|ring|necklace|bracelet/.test(l))            return CATEGORY_ICON_MAP["Jewelry & Watches"]!;
  if (/toy|game|puzzle|doll/.test(l))                          return CATEGORY_ICON_MAP["Toys & Games"]!;
  if (/art|craft|handmade|artisan/.test(l))                    return CATEGORY_ICON_MAP["Arts & Crafts"]!;
  if (/build|hardware|plumb|cement|paint/.test(l))             return CATEGORY_ICON_MAP["Building & Hardware"]!;
  return CATEGORY_ICON_MAP["Other"]!;
}

// Single consistent icon container style used across all categories
export const CATEGORY_ICON_CLASS = "bg-accent/10 text-accent";
