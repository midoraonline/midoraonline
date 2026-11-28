/**
 * Posting-form helpers for Cards & Tags v1.2 (intent, opportunity category,
 * application link, title limits). Used by ProductFormPage (components/shop/product-form).
 * `modes` defaults to the admin Offer/Seek modes last loaded (lib/intentModes), else code defaults.
 */
import { currentIntentModes } from "@/lib/intentModes";
import {
  APPLICATION_LINK_MAX,
  CTA_LABEL,
  LEGACY_OPPORTUNITY_LABELS,
  OPPORTUNITY_CATEGORIES,
  OPPORTUNITY_CATEGORY_ORDER,
  TITLE_HARD_LIMIT,
  allowsSeeking,
  effectiveIntentMode,
  parseIntent,
  resolveListingIntent,
  resolveOpportunityCategory,
  type IntentModeOverrides,
  type ListingIntent,
  type OpportunityCategory,
} from "@/lib/listingIntent";
import type { ListingKind, ListingMeta } from "@/lib/listingMeta";

export const OPPORTUNITY_CATEGORY_HINT: Record<OpportunityCategory, string> = {
  professional_jobs: "Full-time, part-time and contract roles.",
  casual_daily_work: "Day jobs, short shifts and casual labour.",
  gigs_freelance: "Short projects and freelance tasks.",
  internships_graduate_training: "Internships, attachments and graduate programmes.",
  tenders_contracts: "Supply, works and service tenders.",
  scholarships_training: "Scholarships, courses and training programmes.",
  business_partnership: "Partners, investors and collaborations.",
  domestic_jobs: "Housekeepers, nannies, cooks and home help.",
  volunteer: "Unpaid and community roles.",
};

export const OPPORTUNITY_CATEGORY_CHOICES = OPPORTUNITY_CATEGORY_ORDER.map((id) => ({
  id,
  label: OPPORTUNITY_CATEGORIES[id].label,
  hint: OPPORTUNITY_CATEGORY_HINT[id],
}));

/** Opportunity category currently on a draft (stored meta first, then the subcategory label). */
export function draftOpportunityCategory(meta: ListingMeta, category: string): OpportunityCategory | null {
  return resolveOpportunityCategory(meta as Record<string, unknown>, category);
}

/**
 * Subcategory label to store in `products.category`: the new label when the
 * category list has it, else the old label that maps to it (rows not migrated yet).
 */
export function categoryLabelFor(cat: OpportunityCategory, items: { label: string; parent_slug?: string | null }[]): string {
  const label = OPPORTUNITY_CATEGORIES[cat].label;
  const known = new Set(items.filter((i) => i.parent_slug).map((i) => i.label));
  if (known.size === 0 || known.has(label)) return label;
  const legacy = Object.entries(LEGACY_OPPORTUNITY_LABELS).find(([old, c]) => c === cat && known.has(old));
  return legacy?.[0] ?? label;
}

/** New category: offering-only categories reset intent to offering; others keep the choice. */
export function metaWithOpportunityCategory(
  meta: ListingMeta,
  cat: OpportunityCategory,
  modes: IntentModeOverrides = currentIntentModes(),
): ListingMeta {
  const cfg = OPPORTUNITY_CATEGORIES[cat];
  const intent = effectiveIntentMode(cat, modes) === "offering_only" ? "offering" : parseIntent(meta.intent) ?? undefined;
  return { ...meta, opportunity_category: cat, opportunity_kind: cfg.legacyKind, intent };
}

export function metaWithIntent(meta: ListingMeta, intent: ListingIntent): ListingMeta {
  return { ...meta, intent };
}

/** Blocking message when the offer/need (or category) choice is missing. */
export function intentError(
  kind: ListingKind,
  meta: ListingMeta,
  category: string,
  modes: IntentModeOverrides = currentIntentModes(),
): string | null {
  const intent = parseIntent(meta.intent);
  if (kind === "service") return intent ? null : "Choose whether you offer or need this service.";
  if (kind !== "opportunity") return null;
  const cat = draftOpportunityCategory(meta, category);
  if (!cat) return "Choose the type of opportunity.";
  return allowsSeeking(cat, modes) && !intent ? "Choose whether you're offering this or looking for it." : null;
}

export type IntentPreview = {
  categoryLabel: string | null;
  intentLabel: string | null;
  ctaLabel: string;
};

/** Category → intent text → CTA, exactly as the card will resolve it. */
export function intentPreview(
  kind: ListingKind,
  meta: ListingMeta,
  category: string,
  modes: IntentModeOverrides = currentIntentModes(),
): IntentPreview {
  const resolved = resolveListingIntent({ itemType: kind, meta: meta as Record<string, unknown>, category, modes });
  const cat = resolved.opportunityCategory;
  return {
    categoryLabel: cat ? OPPORTUNITY_CATEGORIES[cat].label : category.trim() || null,
    intentLabel: resolved.label,
    ctaLabel: CTA_LABEL[resolved.cta],
  };
}

export function showsApplicationLink(kind: ListingKind): boolean {
  return kind === "opportunity";
}

export function applicationLinkRecommended(
  kind: ListingKind,
  meta: ListingMeta,
  category: string,
  modes: IntentModeOverrides = currentIntentModes(),
): boolean {
  return (
    kind === "opportunity" &&
    resolveListingIntent({ itemType: kind, meta: meta as Record<string, unknown>, category, modes }).cta === "apply"
  );
}

const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const UNSAFE_SCHEME = /^(javascript|data|vbscript|file|blob|mailto|tel):/i;

/** https only; a bare host gets https:// and http:// is upgraded. Empty is fine (optional). */
export function normalizeApplicationLink(raw: string | null | undefined): { value: string | null; error: string | null } {
  const text = (raw ?? "").trim();
  if (!text) return { value: null, error: null };
  const invalid = { value: null, error: "Enter a web link that starts with https://, like https://example.com/apply." };
  if (UNSAFE_SCHEME.test(text)) return invalid;
  let value = SCHEME.test(text) ? text : `https://${text}`;
  if (/^http:\/\//i.test(value)) value = `https://${value.slice(7)}`;
  if (value.length > APPLICATION_LINK_MAX) {
    return { value: null, error: `Keep the link to ${APPLICATION_LINK_MAX} characters or fewer.` };
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password) return invalid;
    return { value: url.toString(), error: null };
  } catch {
    return invalid;
  }
}

export function titleLengthError(title: string): string | null {
  return title.trim().length > TITLE_HARD_LIMIT
    ? `Shorten the title to ${TITLE_HARD_LIMIT} characters or fewer.`
    : null;
}

/**
 * `cleanListingMeta` keeps only legacy keys; add the v1.2 fields back. Offering-only
 * categories always store intent=offering. Intent is never inferred from the title.
 */
export function withIntentMeta(
  kind: ListingKind,
  raw: ListingMeta,
  category: string,
  cleaned: ListingMeta,
  modes: IntentModeOverrides = currentIntentModes(),
): ListingMeta {
  if (kind === "product") return cleaned;
  const out: ListingMeta = { ...cleaned };
  const intent = parseIntent(raw.intent);
  if (kind === "service") {
    if (intent) out.intent = intent;
    return out;
  }
  const cat = draftOpportunityCategory(raw, category);
  if (cat) {
    out.opportunity_category = cat;
    out.opportunity_kind = OPPORTUNITY_CATEGORIES[cat].legacyKind;
  }
  const effective = cat && !allowsSeeking(cat, modes) ? "offering" : intent;
  if (effective) out.intent = effective;
  const link = normalizeApplicationLink(raw.application_link).value;
  if (link) out.application_link = link;
  return out;
}

/** API rejection codes this helper set owns. */
export const INTENT_ERROR_CODES = {
  invalid_intent: "intent",
  title_too_long: "title",
  invalid_application_link: "application_link",
} as const;
