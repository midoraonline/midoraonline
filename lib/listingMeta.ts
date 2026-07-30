/**
 * Listing kinds + type- and category-specific "more information" (listing_meta).
 *
 * Pattern (FB Marketplace / Etsy): pick a listing type first, then collect
 * attributes that only make sense for that type / category. Stored as JSONB
 * so we can tweak fields without schema churn.
 */

export type ListingKind = "product" | "service" | "opportunity";

/** DB / API item_type values Midora already had. */
export type ItemType =
  | "product"
  | "service"
  | "property"
  | "job"
  | "opportunity";

export type ListingMeta = {
  /** Product (general) */
  condition?: "new" | "like_new" | "used" | "refurbished";
  brand?: string;
  /** Electronics */
  model?: string;
  storage?: string;
  warranty?: string;
  /** Fashion / jewelry / beauty */
  size?: string;
  color?: string;
  material?: string;
  /** Automotive */
  year?: string;
  make_model?: string;
  mileage_km?: string;
  /** Property & Land */
  property_type?:
    | "land"
    | "house"
    | "apartment"
    | "room"
    | "commercial"
    | "other";
  size_sqm?: string;
  size_acres?: string;
  bedrooms?: string;
  bathrooms?: string;
  title_status?: "titled" | "mailo" | "leasehold" | "customary" | "other";
  furnished?: "yes" | "no" | "partial";
  /** Food / agriculture */
  unit?: string;
  /** Service */
  pricing_model?: "fixed" | "hourly" | "starting_at" | "quote";
  availability?: string;
  service_area?: string;
  /** Opportunity (jobs, gigs, collabs) */
  opportunity_kind?: "job" | "gig" | "collaboration" | "internship" | "other";
  compensation?: "paid" | "unpaid" | "commission" | "negotiable";
  deadline?: string;
  requirements?: string;
};

export type CategoryMetaField = {
  key: keyof ListingMeta;
  label: string;
  kind: "text" | "select";
  required?: boolean;
  placeholder?: string;
  options?: readonly { value: string; label: string }[];
};

export const LISTING_KIND_OPTIONS: {
  value: ListingKind;
  label: string;
  hint: string;
}[] = [
  {
    value: "product",
    label: "Product",
    hint: "Physical or digital goods for sale",
  },
  {
    value: "service",
    label: "Service",
    hint: "Work you offer — delivery, design, repairs…",
  },
  {
    value: "opportunity",
    label: "Opportunity",
    hint: "Jobs, gigs, collaborations, openings",
  },
];

export const LISTING_KIND_LABEL: Record<ListingKind, string> = {
  product: "Product",
  service: "Service",
  opportunity: "Opportunity",
};

/** Map API item_type → public listing kind (job → opportunity). */
export function normalizeListingKind(
  itemType?: string | null,
): ListingKind {
  const t = (itemType ?? "product").toLowerCase();
  if (t === "service") return "service";
  if (t === "opportunity" || t === "job") return "opportunity";
  return "product";
}

export function listingKindToItemType(kind: ListingKind): ItemType {
  return kind;
}

export const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
] as const;

export const PRICING_MODEL_OPTIONS = [
  { value: "fixed", label: "Fixed price" },
  { value: "hourly", label: "Hourly" },
  { value: "starting_at", label: "Starting at" },
  { value: "quote", label: "Get a quote" },
] as const;

export const OPPORTUNITY_KIND_OPTIONS = [
  { value: "job", label: "Job" },
  { value: "gig", label: "Gig" },
  { value: "collaboration", label: "Collaboration" },
  { value: "internship", label: "Internship" },
  { value: "other", label: "Other" },
] as const;

export const COMPENSATION_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "commission", label: "Commission" },
  { value: "negotiable", label: "Negotiable" },
] as const;

export const PROPERTY_TYPE_OPTIONS = [
  { value: "land", label: "Land / plot" },
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment / flat" },
  { value: "room", label: "Room" },
  { value: "commercial", label: "Commercial" },
  { value: "other", label: "Other" },
] as const;

export const TITLE_STATUS_OPTIONS = [
  { value: "titled", label: "Titled" },
  { value: "mailo", label: "Mailo" },
  { value: "leasehold", label: "Leasehold" },
  { value: "customary", label: "Customary" },
  { value: "other", label: "Other / unknown" },
] as const;

export const FURNISHED_OPTIONS = [
  { value: "yes", label: "Furnished" },
  { value: "partial", label: "Partly furnished" },
  { value: "no", label: "Unfurnished" },
] as const;

/** Extra fields by top-level parent category label. */
export function categoryMetaFields(
  parentLabel: string | null | undefined,
): CategoryMetaField[] {
  const p = (parentLabel ?? "").trim().toLowerCase();
  if (!p) return [];

  if (p === "electronics") {
    return [
      { key: "brand", label: "Brand", kind: "text", placeholder: "e.g. Samsung" },
      { key: "model", label: "Model", kind: "text", placeholder: "e.g. Galaxy A54" },
      { key: "storage", label: "Storage / capacity", kind: "text", placeholder: "e.g. 128GB" },
      { key: "warranty", label: "Warranty", kind: "text", placeholder: "e.g. 6 months" },
    ];
  }

  if (p === "fashion" || p === "jewelry & watches" || p === "kids & baby") {
    return [
      { key: "size", label: "Size", kind: "text", placeholder: "e.g. M, 42, UK 8" },
      { key: "color", label: "Color", kind: "text", placeholder: "Optional" },
      { key: "material", label: "Material", kind: "text", placeholder: "e.g. Cotton, leather" },
      { key: "brand", label: "Brand", kind: "text", placeholder: "Optional" },
    ];
  }

  if (p === "automotive") {
    return [
      { key: "year", label: "Year", kind: "text", placeholder: "e.g. 2018" },
      { key: "make_model", label: "Make & model", kind: "text", placeholder: "e.g. Toyota Vitz" },
      { key: "mileage_km", label: "Mileage (km)", kind: "text", placeholder: "e.g. 85000" },
      { key: "color", label: "Color", kind: "text", placeholder: "Optional" },
    ];
  }

  if (p === "property & land") {
    return [
      {
        key: "property_type",
        label: "Property type",
        kind: "select",
        required: true,
        options: PROPERTY_TYPE_OPTIONS,
      },
      { key: "size_acres", label: "Size (acres)", kind: "text", placeholder: "For land" },
      { key: "size_sqm", label: "Size (sqm)", kind: "text", placeholder: "For buildings" },
      { key: "bedrooms", label: "Bedrooms", kind: "text", placeholder: "Optional" },
      { key: "bathrooms", label: "Bathrooms", kind: "text", placeholder: "Optional" },
      {
        key: "title_status",
        label: "Title / tenure",
        kind: "select",
        options: TITLE_STATUS_OPTIONS,
      },
      {
        key: "furnished",
        label: "Furnished",
        kind: "select",
        options: FURNISHED_OPTIONS,
      },
    ];
  }

  if (p === "food & beverage" || p === "agriculture") {
    return [
      { key: "unit", label: "Unit / quantity", kind: "text", placeholder: "e.g. 1kg, crate, bunch" },
      { key: "brand", label: "Brand / farm", kind: "text", placeholder: "Optional" },
    ];
  }

  if (p === "home & living" || p === "building & hardware") {
    return [
      { key: "material", label: "Material", kind: "text", placeholder: "Optional" },
      { key: "size", label: "Dimensions / size", kind: "text", placeholder: "Optional" },
      { key: "brand", label: "Brand", kind: "text", placeholder: "Optional" },
    ];
  }

  if (p === "beauty" || p === "health & wellness") {
    return [
      { key: "brand", label: "Brand", kind: "text", placeholder: "Optional" },
      { key: "size", label: "Size / volume", kind: "text", placeholder: "e.g. 200ml" },
    ];
  }

  return [];
}

/** Require a real written description: length + at least two sentences. */
export function descriptionMeetsStandard(text: string): {
  ok: boolean;
  message?: string;
} {
  const t = text.trim();
  if (!t) return { ok: false, message: "Description is required." };
  if (t.length < 40) {
    return {
      ok: false,
      message: "Write a fuller description (at least ~40 characters).",
    };
  }
  const sentences = t
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8);
  if (sentences.length < 2) {
    return {
      ok: false,
      message: "Use at least two clear sentences so buyers know what to expect.",
    };
  }
  return { ok: true };
}

export function hasRequiredListingImage(
  urls: string[],
  isVideoUrl: (u: string) => boolean,
): boolean {
  return urls.some((u) => u.trim() && !isVideoUrl(u));
}

function copyTrimmed(
  out: ListingMeta,
  raw: ListingMeta,
  key: keyof ListingMeta,
) {
  const v = raw[key];
  if (typeof v === "string" && v.trim()) {
    (out as Record<string, unknown>)[key] = v.trim();
  } else if (v && typeof v !== "string") {
    (out as Record<string, unknown>)[key] = v;
  }
}

export function cleanListingMeta(
  kind: ListingKind,
  raw: ListingMeta,
  parentLabel?: string | null,
): ListingMeta {
  const out: ListingMeta = {};
  if (kind === "product") {
    if (raw.condition) out.condition = raw.condition;
    if (raw.brand?.trim()) out.brand = raw.brand.trim();
  } else if (kind === "service") {
    if (raw.pricing_model) out.pricing_model = raw.pricing_model;
    if (raw.availability?.trim()) out.availability = raw.availability.trim();
    if (raw.service_area?.trim()) out.service_area = raw.service_area.trim();
  } else {
    if (raw.opportunity_kind) out.opportunity_kind = raw.opportunity_kind;
    if (raw.compensation) out.compensation = raw.compensation;
    if (raw.deadline?.trim()) out.deadline = raw.deadline.trim();
    if (raw.requirements?.trim()) out.requirements = raw.requirements.trim();
  }

  for (const field of categoryMetaFields(parentLabel)) {
    copyTrimmed(out, raw, field.key);
  }
  return out;
}

export function parseListingMeta(raw: unknown): ListingMeta {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as ListingMeta;
}

function optionLabel<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T | undefined,
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

function pushIf(
  rows: { label: string; value: string }[],
  label: string,
  value: string | undefined | null,
) {
  const t = value?.trim();
  if (t) rows.push({ label, value: t });
}

/** Human-readable rows for PDP / cards from listing_meta. */
export function listingMetaDisplayRows(
  kind: ListingKind,
  meta: ListingMeta,
  parentLabel?: string | null,
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (kind === "product") {
    const condition = optionLabel(CONDITION_OPTIONS, meta.condition);
    if (condition) rows.push({ label: "Condition", value: condition });
    pushIf(rows, "Brand", meta.brand);
  } else if (kind === "service") {
    const pricing = optionLabel(PRICING_MODEL_OPTIONS, meta.pricing_model);
    if (pricing) rows.push({ label: "Pricing", value: pricing });
    pushIf(rows, "Availability", meta.availability);
    pushIf(rows, "Service area", meta.service_area);
  } else {
    const kindLabel = optionLabel(OPPORTUNITY_KIND_OPTIONS, meta.opportunity_kind);
    if (kindLabel) rows.push({ label: "Type", value: kindLabel });
    const pay = optionLabel(COMPENSATION_OPTIONS, meta.compensation);
    if (pay) rows.push({ label: "Compensation", value: pay });
    pushIf(rows, "Deadline", meta.deadline);
    pushIf(rows, "Requirements", meta.requirements);
  }

  for (const field of categoryMetaFields(parentLabel)) {
    if (field.key === "brand" && kind === "product" && meta.brand) continue;
    const raw = meta[field.key];
    if (raw == null || raw === "") continue;
    if (field.kind === "select" && field.options) {
      const label = optionLabel(
        field.options as readonly { value: string; label: string }[],
        String(raw),
      );
      if (label) rows.push({ label: field.label, value: label });
    } else {
      pushIf(rows, field.label, String(raw));
    }
  }

  return rows;
}
