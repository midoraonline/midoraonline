import type { IconType } from "react-icons";
import {
  PiArmchairFill,
  PiBabyFill,
  PiBarbellFill,
  PiBookOpenTextFill,
  PiBriefcaseFill,
  PiCarProfileFill,
  PiDeviceMobileFill,
  PiDiamondFill,
  PiForkKnifeFill,
  PiHammerFill,
  PiHeartbeatFill,
  PiHouseLineFill,
  PiPaletteFill,
  PiPawPrintFill,
  PiPlantFill,
  PiPuzzlePieceFill,
  PiSparkleFill,
  PiSquaresFourFill,
  PiTShirtFill,
  PiWrenchFill,
} from "react-icons/pi";

/** Filled icons for each canonical parent category — object metaphors for scanability. */
export const CATEGORY_ICON_MAP: Record<string, IconType> = {
  "Food & Beverage": PiForkKnifeFill,
  Fashion: PiTShirtFill,
  Electronics: PiDeviceMobileFill,
  Beauty: PiSparkleFill,
  "Home & Living": PiArmchairFill,
  Services: PiWrenchFill,
  "Property & Land": PiHouseLineFill,
  Opportunities: PiBriefcaseFill,
  Agriculture: PiPlantFill,
  "Health & Wellness": PiHeartbeatFill,
  "Sports & Outdoors": PiBarbellFill,
  Automotive: PiCarProfileFill,
  "Books & Stationery": PiBookOpenTextFill,
  "Kids & Baby": PiBabyFill,
  Pets: PiPawPrintFill,
  "Jewelry & Watches": PiDiamondFill,
  "Toys & Games": PiPuzzlePieceFill,
  "Arts & Crafts": PiPaletteFill,
  "Building & Hardware": PiHammerFill,
  Other: PiSquaresFourFill,
};

/** Tinted bubble + icon colour per parent category (literal classes for Tailwind). */
const CATEGORY_TONE_MAP: Record<string, string> = {
  "Food & Beverage": "bg-orange-500/15 text-orange-500",
  Fashion: "bg-pink-500/15 text-pink-500",
  Electronics: "bg-sky-500/15 text-sky-500",
  Beauty: "bg-fuchsia-500/15 text-fuchsia-500",
  "Home & Living": "bg-amber-500/15 text-amber-600",
  Services: "bg-indigo-500/15 text-indigo-500",
  "Property & Land": "bg-emerald-500/15 text-emerald-600",
  Opportunities: "bg-violet-500/15 text-violet-500",
  Agriculture: "bg-lime-500/15 text-lime-600",
  "Health & Wellness": "bg-rose-500/15 text-rose-500",
  "Sports & Outdoors": "bg-cyan-500/15 text-cyan-600",
  Automotive: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  "Books & Stationery": "bg-blue-500/15 text-blue-500",
  "Kids & Baby": "bg-yellow-400/20 text-yellow-600",
  Pets: "bg-orange-400/15 text-orange-600",
  "Jewelry & Watches": "bg-purple-500/15 text-purple-500",
  "Toys & Games": "bg-red-500/15 text-red-500",
  "Arts & Crafts": "bg-teal-500/15 text-teal-600",
  "Building & Hardware": "bg-stone-500/15 text-stone-600 dark:text-stone-300",
  Other: "bg-accent/15 text-accent",
};

export const ALL_CATEGORIES_ICON: IconType = PiSquaresFourFill;
export const ALL_CATEGORIES_TONE = "bg-accent/15 text-accent";

function canonicalCategory(label: string): string {
  if (label in CATEGORY_ICON_MAP) return label;
  const l = label.toLowerCase();
  if (/food|drink|bev|restaurant|cafe|snack|grocer/.test(l)) return "Food & Beverage";
  if (/fashion|cloth|wear|apparel|shoe|bag/.test(l)) return "Fashion";
  if (/electronic|tech|phone|laptop|gadget/.test(l)) return "Electronics";
  if (/beauty|cosmetic|skin|hair|salon/.test(l)) return "Beauty";
  if (/home|furniture|decor|kitchen|interior/.test(l)) return "Home & Living";
  if (/service|repair|consult|freelance/.test(l)) return "Services";
  if (/property|land|plot|house|apartment|real.?estate/.test(l)) return "Property & Land";
  if (/opportunit|job|gig|career|vacanc|tender/.test(l)) return "Opportunities";
  if (/farm|agri|crop|grain|plant/.test(l)) return "Agriculture";
  if (/health|medical|pharma|wellness/.test(l)) return "Health & Wellness";
  if (/sport|fitness|gym|outdoor|camp/.test(l)) return "Sports & Outdoors";
  if (/auto|car|vehicle|motor|boda/.test(l)) return "Automotive";
  if (/book|stationery|school|education|office/.test(l)) return "Books & Stationery";
  if (/baby|kid/.test(l)) return "Kids & Baby";
  if (/pet|animal|dog|cat/.test(l)) return "Pets";
  if (/jewel|watch|ring|necklace|bracelet/.test(l)) return "Jewelry & Watches";
  if (/toy|game|puzzle|doll/.test(l)) return "Toys & Games";
  if (/art|craft|handmade|artisan/.test(l)) return "Arts & Crafts";
  if (/build|hardware|plumb|cement|paint/.test(l)) return "Building & Hardware";
  return "Other";
}

export function resolveCategoryIcon(label: string): IconType {
  return CATEGORY_ICON_MAP[canonicalCategory(label)]!;
}

export function resolveCategoryTone(label: string): string {
  return CATEGORY_TONE_MAP[canonicalCategory(label)]!;
}

export const CATEGORY_ICON_CLASS = "bg-accent/10 text-accent";
