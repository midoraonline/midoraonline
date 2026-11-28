/**
 * Cards & Tags spec v1.2 — persistent intent text, opportunity categories and CTAs.
 * Mirrors nestapi/src/modules/products/domain/listing-intent.ts. Keep both in sync.
 * Store identifiers; map to English labels only when rendering. Never infer intent from title words.
 */

export type ListingIntent = "offering" | "seeking";

export type OpportunityCategory =
  | "professional_jobs"
  | "casual_daily_work"
  | "gigs_freelance"
  | "internships_graduate_training"
  | "tenders_contracts"
  | "scholarships_training"
  | "business_partnership"
  | "domestic_jobs"
  | "volunteer";

export type IntentMode = "bidirectional" | "offering_only";

/** Admin-set modes from GET /categories/intent-modes; a missing key means the code default. */
export type IntentModeOverrides = Partial<Record<OpportunityCategory, IntentMode>>;

export type CardCta = "whatsapp" | "apply" | "respond" | "view_details" | "contact";

export type OpportunityCategoryConfig = {
  /** Subcategory label stored in products.category under "Opportunities". */
  label: string;
  /** categories.slug */
  slug: string;
  mode: IntentMode;
  offering: string;
  seeking?: string;
  ctaOffer: CardCta;
  ctaSeek?: CardCta;
  /** Posting-flow wording for the Offer/Seek question (bidirectional only). */
  offerOption?: string;
  seekOption?: string;
  /** Legacy listing_meta.opportunity_kind kept for old filters. */
  legacyKind: "job" | "gig" | "collaboration" | "internship" | "maids" | "other";
};

export const OPPORTUNITY_CATEGORIES: Record<OpportunityCategory, OpportunityCategoryConfig> = {
  professional_jobs: {
    label: "Professional Jobs",
    slug: "professional-jobs",
    mode: "bidirectional",
    offering: "JOB OPENING",
    seeking: "SEEKING WORK",
    ctaOffer: "apply",
    ctaSeek: "contact",
    offerOption: "I have a professional job opening",
    seekOption: "I'm looking for professional work",
    legacyKind: "job",
  },
  casual_daily_work: {
    label: "Casual & Daily Work",
    slug: "casual-and-daily-work",
    mode: "bidirectional",
    offering: "WORK AVAILABLE",
    seeking: "SEEKING CASUAL WORK",
    ctaOffer: "respond",
    ctaSeek: "contact",
    offerOption: "I have casual or daily work available",
    seekOption: "I'm looking for casual or daily work",
    legacyKind: "job",
  },
  gigs_freelance: {
    label: "Gigs & Freelance",
    slug: "gigs-and-freelance",
    mode: "bidirectional",
    offering: "GIG OPENING",
    seeking: "SEEKING GIGS",
    ctaOffer: "respond",
    ctaSeek: "contact",
    offerOption: "I have a short-term project or gig",
    seekOption: "I'm looking for gigs or freelance work",
    legacyKind: "gig",
  },
  internships_graduate_training: {
    label: "Internships & Graduate Training",
    slug: "internships-and-graduate-training",
    mode: "offering_only",
    offering: "OPPORTUNITY",
    ctaOffer: "apply",
    legacyKind: "internship",
  },
  tenders_contracts: {
    label: "Tenders & Contracts",
    slug: "tenders-and-contracts",
    mode: "offering_only",
    offering: "OPPORTUNITY",
    ctaOffer: "view_details",
    legacyKind: "other",
  },
  scholarships_training: {
    label: "Scholarships & Training",
    slug: "scholarships-and-training",
    mode: "offering_only",
    offering: "OPPORTUNITY",
    ctaOffer: "apply",
    legacyKind: "other",
  },
  business_partnership: {
    label: "Business & Partnership Opportunities",
    slug: "business-and-partnership-opportunities",
    mode: "bidirectional",
    offering: "PARTNERSHIP OPPORTUNITY",
    seeking: "SEEKING PARTNERSHIP",
    ctaOffer: "respond",
    ctaSeek: "contact",
    offerOption: "I need a business partner or collaborator",
    seekOption: "I'm looking for a business partnership",
    legacyKind: "collaboration",
  },
  domestic_jobs: {
    label: "Domestic Jobs",
    slug: "domestic-jobs",
    mode: "bidirectional",
    offering: "JOB OPENING",
    seeking: "SEEKING WORK",
    ctaOffer: "apply",
    ctaSeek: "contact",
    offerOption: "I have a domestic job opening",
    seekOption: "I'm looking for domestic work",
    legacyKind: "maids",
  },
  volunteer: {
    label: "Volunteer Opportunities",
    slug: "volunteer-opportunities",
    mode: "bidirectional",
    offering: "VOLUNTEER OPENING",
    seeking: "SEEKING VOLUNTEER WORK",
    ctaOffer: "apply",
    ctaSeek: "contact",
    offerOption: "I need volunteers",
    seekOption: "I want to volunteer",
    legacyKind: "other",
  },
};

export const OPPORTUNITY_CATEGORY_ORDER: OpportunityCategory[] = [
  "professional_jobs",
  "casual_daily_work",
  "gigs_freelance",
  "internships_graduate_training",
  "tenders_contracts",
  "scholarships_training",
  "business_partnership",
  "domestic_jobs",
  "volunteer",
];

/** Old subcategory labels → new category (used by migration and for rows not yet migrated). */
export const LEGACY_OPPORTUNITY_LABELS: Record<string, OpportunityCategory> = {
  "Full-time Jobs": "professional_jobs",
  "Part-time Jobs": "professional_jobs",
  "Gigs & Freelance": "gigs_freelance",
  "Internships": "internships_graduate_training",
  "Maids & Domestic Work": "domestic_jobs",
  "Tenders & Contracts": "tenders_contracts",
  "Partnerships & Collaborations": "business_partnership",
  "Volunteer & Unpaid": "volunteer",
};

export const SERVICE_INTENT = {
  offering: { label: "SERVICE OFFERED", cta: "whatsapp" as CardCta, option: "I offer this service", example: "Example: I repair phones" },
  seeking: { label: "SERVICE NEEDED", cta: "respond" as CardCta, option: "I need this service", example: "Example: I need a plumber" },
};

export const CTA_LABEL: Record<CardCta, string> = {
  whatsapp: "WhatsApp",
  apply: "Apply now",
  respond: "Respond",
  view_details: "View details",
  contact: "Contact",
};

export const isOpportunityCategory = (v: unknown): v is OpportunityCategory =>
  typeof v === "string" && v in OPPORTUNITY_CATEGORIES;

export function parseIntent(v: unknown): ListingIntent | null {
  return v === "offering" || v === "seeking" ? v : null;
}

/** Category from stored meta, falling back to the subcategory label (new or legacy). */
export function resolveOpportunityCategory(
  meta: Record<string, unknown> | null | undefined,
  categoryLabel?: string | null,
): OpportunityCategory | null {
  const stored = meta?.opportunity_category;
  if (isOpportunityCategory(stored)) return stored;
  const label = categoryLabel?.split(">").pop()?.trim();
  if (!label) return null;
  const hit = OPPORTUNITY_CATEGORY_ORDER.find((k) => OPPORTUNITY_CATEGORIES[k].label === label);
  return hit ?? LEGACY_OPPORTUNITY_LABELS[label] ?? null;
}

export function opportunityCategoryForLabel(label: string | null | undefined): OpportunityCategory | null {
  return resolveOpportunityCategory(null, label);
}

export const isIntentMode = (v: unknown): v is IntentMode => v === "bidirectional" || v === "offering_only";

/** The dictionary has seeking wording for this category, so it can be two-way. */
export const supportsSeeking = (category: OpportunityCategory): boolean => Boolean(OPPORTUNITY_CATEGORIES[category].seeking);

/** Admin override when set (and supported), else the code default. */
export function effectiveIntentMode(category: OpportunityCategory, overrides?: IntentModeOverrides | null): IntentMode {
  const set = overrides?.[category];
  if (set === "offering_only" || (set === "bidirectional" && supportsSeeking(category))) return set;
  return OPPORTUNITY_CATEGORIES[category].mode;
}

export function allowsSeeking(category: OpportunityCategory | null, overrides?: IntentModeOverrides | null): boolean {
  return !!category && effectiveIntentMode(category, overrides) === "bidirectional";
}

export type ResolvedIntent = {
  intent: ListingIntent | null;
  /** Persistent Midora-generated text, e.g. SERVICE OFFERED. Null for products or unknown intent. */
  label: string | null;
  cta: CardCta;
  opportunityCategory: OpportunityCategory | null;
};

/**
 * Intent text + CTA for a card. Products: no intent text, WhatsApp.
 * Missing intent on a service/opportunity: no intent text (never guessed), default CTA.
 * Offering-only shows offering text, except a stored seeking the dictionary can word (published before an admin change).
 */
export function resolveListingIntent(input: {
  itemType: string | null | undefined;
  meta: Record<string, unknown> | null | undefined;
  category?: string | null;
  modes?: IntentModeOverrides | null;
}): ResolvedIntent {
  const t = (input.itemType ?? "product").toLowerCase();
  const intent = parseIntent(input.meta?.intent);
  if (t === "service") {
    return {
      intent,
      label: intent ? SERVICE_INTENT[intent].label : null,
      cta: intent ? SERVICE_INTENT[intent].cta : "whatsapp",
      opportunityCategory: null,
    };
  }
  if (t === "opportunity" || t === "job") {
    const cat = resolveOpportunityCategory(input.meta, input.category);
    if (!cat) return { intent, label: null, cta: "apply", opportunityCategory: null };
    const cfg = OPPORTUNITY_CATEGORIES[cat];
    const keepsSeeking = intent === "seeking" && Boolean(cfg.seeking);
    const effective: ListingIntent | null =
      effectiveIntentMode(cat, input.modes) === "offering_only" && !keepsSeeking ? "offering" : intent;
    if (effective === "seeking" && cfg.seeking) {
      return { intent: effective, label: cfg.seeking, cta: cfg.ctaSeek ?? "contact", opportunityCategory: cat };
    }
    if (effective === "offering") {
      return { intent: effective, label: cfg.offering, cta: cfg.ctaOffer, opportunityCategory: cat };
    }
    return { intent: null, label: null, cta: cfg.ctaOffer, opportunityCategory: cat };
  }
  return { intent: null, label: null, cta: "whatsapp", opportunityCategory: null };
}

/** Illustration path per category (Services share one). */
export const CATEGORY_VISUALS: Record<"service" | OpportunityCategory, string> = {
  service: "/visuals/service-universal.svg",
  professional_jobs: "/visuals/opportunity-professional-jobs.svg",
  casual_daily_work: "/visuals/opportunity-casual-work.svg",
  gigs_freelance: "/visuals/opportunity-gigs.svg",
  internships_graduate_training: "/visuals/opportunity-internships.svg",
  tenders_contracts: "/visuals/opportunity-tenders.svg",
  scholarships_training: "/visuals/opportunity-scholarships.svg",
  business_partnership: "/visuals/opportunity-partnership.svg",
  domestic_jobs: "/visuals/opportunity-domestic-jobs.svg",
  volunteer: "/visuals/opportunity-volunteer.svg",
};

/** Service subcategory → illustration, first match wins; unmatched services use CATEGORY_VISUALS.service. */
export const SERVICE_VISUALS: readonly (readonly [RegExp, string])[] = [
  [/repair|mainten/, "/visuals/service-repair.svg"],
  [/clean/, "/visuals/service-cleaning.svg"],
  [/deliver|logistic|courier|transport/, "/visuals/service-delivery.svg"],
  [/beauty|personal care|salon|barber/, "/visuals/service-beauty.svg"],
  [/educat|tutor|lesson|training/, "/visuals/service-education.svg"],
  [/tech|\bit\b|software|computer/, "/visuals/service-tech.svg"],
  [/event|entertain|music|\bdj\b/, "/visuals/service-events.svg"],
  [/photo|video/, "/visuals/service-photography.svg"],
  [/legal|financ|account|law/, "/visuals/service-legal.svg"],
  [/improvement|construct|renovat|paint|plumb|electric/, "/visuals/service-home-improvement.svg"],
  [/health|wellness|medical|fitness/, "/visuals/service-health.svg"],
  [/consult|professional/, "/visuals/service-consulting.svg"],
];

export const TITLE_SOFT_LIMIT = 50;
export const TITLE_HARD_LIMIT = 80;
export const APPLICATION_LINK_MAX = 500;
