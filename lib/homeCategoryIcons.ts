import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BookOpen,
  Briefcase,
  Car,
  Dumbbell,
  Gem,
  Hammer,
  HeartPulse,
  Home,
  LayoutGrid,
  Palette,
  PawPrint,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Sprout,
  ToyBrick,
  Utensils,
  Wrench,
} from "lucide-react";

/** Lucide icons for each canonical parent category — object metaphors for scanability. */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "Food & Beverage": Utensils,
  Fashion: Shirt,
  Electronics: Smartphone,
  Beauty: Sparkles,
  "Home & Living": Sofa,
  Services: Wrench,
  "Property & Land": Home,
  Opportunities: Briefcase,
  Agriculture: Sprout,
  "Health & Wellness": HeartPulse,
  "Sports & Outdoors": Dumbbell,
  Automotive: Car,
  "Books & Stationery": BookOpen,
  "Kids & Baby": Baby,
  Pets: PawPrint,
  "Jewelry & Watches": Gem,
  "Toys & Games": ToyBrick,
  "Arts & Crafts": Palette,
  "Building & Hardware": Hammer,
  Other: LayoutGrid,
};

export const ALL_CATEGORIES_ICON: LucideIcon = LayoutGrid;

export function resolveCategoryIcon(label: string): LucideIcon {
  if (label in CATEGORY_ICON_MAP) return CATEGORY_ICON_MAP[label]!;
  const l = label.toLowerCase();
  if (/food|drink|bev|restaurant|cafe|snack|grocer/.test(l))
    return CATEGORY_ICON_MAP["Food & Beverage"]!;
  if (/fashion|cloth|wear|apparel|shoe|bag/.test(l))
    return CATEGORY_ICON_MAP["Fashion"]!;
  if (/electronic|tech|phone|laptop|gadget/.test(l))
    return CATEGORY_ICON_MAP["Electronics"]!;
  if (/beauty|cosmetic|skin|hair|salon/.test(l))
    return CATEGORY_ICON_MAP["Beauty"]!;
  if (/home|furniture|decor|kitchen|interior/.test(l))
    return CATEGORY_ICON_MAP["Home & Living"]!;
  if (/service|repair|consult|freelance/.test(l))
    return CATEGORY_ICON_MAP["Services"]!;
  if (/property|land|plot|house|apartment|real.?estate/.test(l))
    return CATEGORY_ICON_MAP["Property & Land"]!;
  if (/opportunit|job|gig|career|vacanc|tender/.test(l))
    return CATEGORY_ICON_MAP["Opportunities"]!;
  if (/farm|agri|crop|grain|plant/.test(l))
    return CATEGORY_ICON_MAP["Agriculture"]!;
  if (/health|medical|pharma|wellness/.test(l))
    return CATEGORY_ICON_MAP["Health & Wellness"]!;
  if (/sport|fitness|gym|outdoor|camp/.test(l))
    return CATEGORY_ICON_MAP["Sports & Outdoors"]!;
  if (/auto|car|vehicle|motor|boda/.test(l))
    return CATEGORY_ICON_MAP["Automotive"]!;
  if (/book|stationery|school|education|office/.test(l))
    return CATEGORY_ICON_MAP["Books & Stationery"]!;
  if (/baby|kid/.test(l)) return CATEGORY_ICON_MAP["Kids & Baby"]!;
  if (/pet|animal|dog|cat/.test(l)) return CATEGORY_ICON_MAP["Pets"]!;
  if (/jewel|watch|ring|necklace|bracelet/.test(l))
    return CATEGORY_ICON_MAP["Jewelry & Watches"]!;
  if (/toy|game|puzzle|doll/.test(l))
    return CATEGORY_ICON_MAP["Toys & Games"]!;
  if (/art|craft|handmade|artisan/.test(l))
    return CATEGORY_ICON_MAP["Arts & Crafts"]!;
  if (/build|hardware|plumb|cement|paint/.test(l))
    return CATEGORY_ICON_MAP["Building & Hardware"]!;
  return CATEGORY_ICON_MAP["Other"]!;
}

/** Shared stroke/size helpers for category Lucide icons. */
export const CATEGORY_ICON_CLASS = "bg-accent/10 text-accent";
