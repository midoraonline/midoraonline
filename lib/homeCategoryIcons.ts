import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BookOpen,
  Briefcase,
  Car,
  Dumbbell,
  Gem,
  Home,
  LayoutGrid,
  Laptop,
  Music,
  Pill,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";

/** Icon for a category label (shops/products) — keyword heuristics + fallback. */
export function resolveCategoryIcon(label: string): LucideIcon {
  const l = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s/-]/g, " ");

  if (/electronic|computer|laptop|phone|mobile|tech|gadget|audio|camera/.test(l)) return Smartphone;
  if (/laptop|pc|computer/.test(l)) return Laptop;
  if (/fashion|cloth|wear|apparel|shoe|bag|jewel/.test(l)) return Shirt;
  if (/food|grocery|restaurant|bake|snack|drink|coffee|fruit/.test(l)) return UtensilsCrossed;
  if (/farm|agri|crop|grain|seed/.test(l)) return Wheat;
  if (/beauty|cosmetic|skin|hair|salon|spa/.test(l)) return Sparkles;
  if (/home|furniture|decor|kitchen|bed|interior/.test(l)) return Home;
  if (/sport|fitness|gym|outdoor|athletic/.test(l)) return Dumbbell;
  if (/service|repair|consult|freelance|professional/.test(l)) return Briefcase;
  if (/health|pharma|medical|vitamin|supplement/.test(l)) return Pill;
  if (/book|stationery|education|school/.test(l)) return BookOpen;
  if (/music|instrument|entertainment/.test(l)) return Music;
  if (/baby|kid|toy|maternal/.test(l)) return Baby;
  if (/auto|car|vehicle|motor|tyre/.test(l)) return Car;
  if (/luxury|premium|watch/.test(l)) return Gem;
  if (/general|shop|store|retail|misc|other/.test(l)) return Store;
  return Tag;
}

export const ALL_CATEGORIES_ICON = LayoutGrid;

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
