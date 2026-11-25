import type { CardIntentFields } from "@/lib/api/products";
import {
  CATEGORY_VISUALS,
  OPPORTUNITY_CATEGORIES,
  parseIntent,
  resolveListingIntent,
  type CardCta,
  type ListingIntent,
  type OpportunityCategory,
} from "@/lib/listingIntent";

const CTAS: readonly CardCta[] = ["whatsapp", "apply", "respond", "view_details", "contact"];

export type CardIntent = {
  intent: ListingIntent | null;
  /** SERVICE OFFERED, JOB OPENING, … Null for products or unknown intent. */
  label: string | null;
  cta: CardCta;
  opportunityCategory: OpportunityCategory | null;
};

const asCta = (v: unknown): CardCta | null =>
  typeof v === "string" && (CTAS as readonly string[]).includes(v) ? (v as CardCta) : null;

const asCategory = (v: unknown): OpportunityCategory | null =>
  typeof v === "string" && v in OPPORTUNITY_CATEGORIES ? (v as OpportunityCategory) : null;

/** Server values win; anything missing falls back to the shared client resolver. */
export function readCardIntent(
  input: CardIntentFields & {
    item_type?: string | null;
    listing_meta?: Record<string, unknown> | null;
    category?: string | null;
  },
): CardIntent {
  const local = resolveListingIntent({
    itemType: input.item_type,
    meta: input.listing_meta,
    category: input.category,
  });
  return {
    intent: input.intent !== undefined ? parseIntent(input.intent) : local.intent,
    label: input.intent_label !== undefined ? input.intent_label?.trim() || null : local.label,
    cta: asCta(input.cta) ?? local.cta,
    opportunityCategory: asCategory(input.opportunity_category) ?? local.opportunityCategory,
  };
}

/** Header illustration follows the category, never the intent. Products have none. */
export function cardVisual(
  itemType: string | null | undefined,
  category: OpportunityCategory | null,
): string | null {
  const t = (itemType ?? "product").toLowerCase();
  if (t === "service") return CATEGORY_VISUALS.service;
  if ((t === "opportunity" || t === "job") && category) return CATEGORY_VISUALS[category];
  return null;
}

/** Subcategory line for the card body, e.g. "Professional & Consulting" or "Domestic Jobs". */
export function cardCategoryLabel(
  category: string | null | undefined,
  opportunityCategory: OpportunityCategory | null,
): string | null {
  if (opportunityCategory) return OPPORTUNITY_CATEGORIES[opportunityCategory].label;
  return category?.split(">").pop()?.trim() || null;
}

/** Poster's application link, https only (the API validates too). Null when unusable. */
export function safeApplicationLink(raw: unknown): { href: string; host: string } | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim().replace(/^http:\/\//i, "https://"));
    if (url.protocol !== "https:" || !url.hostname.includes(".")) return null;
    return { href: url.toString(), host: url.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}
