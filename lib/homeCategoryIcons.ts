/** Canonical category label → public PNG image path (your downloaded icons). */
export const CATEGORY_ICON_MAP: Record<string, string> = {
  "Food & Beverage":   "/icons/groceries.png",
  "Fashion":           "/icons/fashion.png",
  "Electronics":       "/icons/electronics.png",
  "Beauty":            "/icons/healthbeauty.png",
  "Home & Living":     "/icons/homefurniture.png",
  "Services":          "/icons/hardwaretools.png",
  "Agriculture":       "/icons/agriculture.png",
  "Health & Wellness": "/icons/healthbeauty.png",
  "Sports & Outdoors": "/icons/sports tools.png",
  "Automotive":        "/icons/bodaautomotive.png",
  "Books & Stationery":"/icons/schoolstationery.png",
  "Kids & Baby":       "/icons/babykids.png",
  "Pets":              "/icons/pet.png",
  "Other":             "/icons/giftsoccasions.png",
};

export const ALL_CATEGORIES_ICON_PATH = "/icons/giftsoccasions.png";

export function resolveCategoryIconPath(label: string): string {
  if (label in CATEGORY_ICON_MAP) return CATEGORY_ICON_MAP[label]!;
  const l = label.toLowerCase();
  if (/food|drink|bev|restaurant|cafe|snack|grocer/.test(l)) return CATEGORY_ICON_MAP["Food & Beverage"]!;
  if (/fashion|cloth|wear|apparel|shoe|bag/.test(l)) return CATEGORY_ICON_MAP["Fashion"]!;
  if (/electronic|tech|phone|laptop|gadget/.test(l)) return CATEGORY_ICON_MAP["Electronics"]!;
  if (/beauty|cosmetic|skin|hair|salon/.test(l)) return CATEGORY_ICON_MAP["Beauty"]!;
  if (/home|furniture|decor|kitchen|interior/.test(l)) return CATEGORY_ICON_MAP["Home & Living"]!;
  if (/service|repair|consult|freelance|hardware/.test(l)) return CATEGORY_ICON_MAP["Services"]!;
  if (/farm|agri|crop|grain|plant/.test(l)) return CATEGORY_ICON_MAP["Agriculture"]!;
  if (/health|medical|pharma|wellness/.test(l)) return CATEGORY_ICON_MAP["Health & Wellness"]!;
  if (/sport|fitness|gym|outdoor|camp/.test(l)) return CATEGORY_ICON_MAP["Sports & Outdoors"]!;
  if (/auto|car|vehicle|motor|boda/.test(l)) return CATEGORY_ICON_MAP["Automotive"]!;
  if (/book|stationery|school|education|office/.test(l)) return CATEGORY_ICON_MAP["Books & Stationery"]!;
  if (/baby|kid|toy/.test(l)) return CATEGORY_ICON_MAP["Kids & Baby"]!;
  if (/pet|animal|dog|cat/.test(l)) return CATEGORY_ICON_MAP["Pets"]!;
  return CATEGORY_ICON_MAP["Other"]!;
}

/** Subtle icon badge styles (cycles by index for variety). */
export const CATEGORY_TONES = [
  "bg-primary/12 text-primary ring-1 ring-primary/20",
  "bg-accent/12 text-accent ring-1 ring-accent/20",
  "bg-foreground/[0.07] text-foreground/85 ring-1 ring-foreground/10",
  "bg-primary/10 text-primary ring-1 ring-primary/15",
] as const;

export function categoryToneClass(index: number): string {
  return CATEGORY_TONES[index % CATEGORY_TONES.length] ?? CATEGORY_TONES[0];
}
