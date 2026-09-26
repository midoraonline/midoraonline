export type ListingKind = "product" | "service" | "opportunity";

export type ItemType =
  | "product"
  | "service"
  | "property"
  | "job"
  | "opportunity";

export type ListingMeta = {
  condition?: "new" | "like_new" | "used" | "refurbished";
  brand?: string;
  model?: string;
  storage?: string;
  warranty?: string;
  size?: string;
  color?: string;
  material?: string;
  year?: string;
  make_model?: string;
  mileage_km?: string;
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
  unit?: string;
  pricing_model?: "fixed" | "hourly" | "starting_at" | "quote";
  availability?: string;
  service_area?: string;
  opportunity_kind?: "job" | "gig" | "collaboration" | "internship" | "maids" | "other";
  compensation?: "paid" | "unpaid" | "commission" | "negotiable";
  deadline?: string;
  requirements?: string;
  urgency?: string;
  employment_type?: string;
  employment?: string;
  [key: string]: string | undefined;
};

export type CategoryMetaFieldKind = "text" | "number" | "select" | "date" | "boolean";

export type CategoryMetaField = {
  key: string;
  label: string;
  kind: CategoryMetaFieldKind;
  required?: boolean;
  placeholder?: string;
  help?: string;
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

/** "an" before a vowel sound, otherwise "a" (opportunity → an, service → a). */
export function indefiniteArticle(word: string): "a" | "an" {
  return /^[aeiou]/i.test(word.trim()) ? "an" : "a";
}

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

/** Services, opportunities, and jobs may publish with zero photos or videos. */
export function allowsEmptyMedia(itemType?: string | null): boolean {
  const kind = normalizeListingKind(itemType);
  return kind === "service" || kind === "opportunity";
}

export function isTextOnlyListing(
  itemType: string | null | undefined,
  mediaCount: number,
): boolean {
  return allowsEmptyMedia(itemType) && mediaCount <= 0;
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
  { value: "maids", label: "Maids / Domestic Help" },
  { value: "other", label: "Other" },
] as const;

/** Opportunities subcategory label (from CATEGORY_TREE) → opportunity_kind.
 *  Keeps the post-item form from asking the same classification twice. */
const SUBCATEGORY_TO_OPPORTUNITY_KIND: Record<string, ListingMeta["opportunity_kind"]> = {
  "Full-time Jobs": "job",
  "Part-time Jobs": "job",
  "Gigs & Freelance": "gig",
  "Internships": "internship",
  "Partnerships & Collaborations": "collaboration",
  "Maids & Domestic Work": "maids",
  "Tenders & Contracts": "other",
  "Volunteer & Unpaid": "other",
};

export function deriveOpportunityKindFromSubcategory(
  subcategoryLabel: string | null | undefined,
): ListingMeta["opportunity_kind"] | undefined {
  if (!subcategoryLabel) return undefined;
  return SUBCATEGORY_TO_OPPORTUNITY_KIND[subcategoryLabel];
}

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

/** Suggested keys for the admin category-metadata editor (autocomplete only —
 *  admins can type any new key that doesn't already exist). */
export const CATEGORY_META_FIELD_KEY_OPTIONS: { value: string; label: string }[] = [
  { value: "brand", label: "Brand" },
  { value: "model", label: "Model" },
  { value: "storage", label: "Storage / capacity" },
  { value: "warranty", label: "Warranty" },
  { value: "size", label: "Size" },
  { value: "color", label: "Color" },
  { value: "material", label: "Material" },
  { value: "year", label: "Year" },
  { value: "make_model", label: "Make & model" },
  { value: "mileage_km", label: "Mileage (km)" },
  { value: "property_type", label: "Property type" },
  { value: "size_sqm", label: "Size (sqm)" },
  { value: "size_acres", label: "Size (acres)" },
  { value: "bedrooms", label: "Bedrooms" },
  { value: "bathrooms", label: "Bathrooms" },
  { value: "title_status", label: "Title / tenure" },
  { value: "furnished", label: "Furnished" },
  { value: "unit", label: "Unit / quantity" },
];

const FIELD_KINDS = new Set<CategoryMetaFieldKind>([
  "text",
  "number",
  "select",
  "date",
  "boolean",
]);

function asFieldKind(value: unknown): CategoryMetaFieldKind {
  const v = String(value ?? "text").toLowerCase();
  if (v === "textarea" || v === "string") return "text";
  if (v === "int" || v === "integer" || v === "float") return "number";
  if (v === "bool" || v === "checkbox") return "boolean";
  if (v === "datetime") return "date";
  if (v === "enum" || v === "dropdown") return "select";
  return FIELD_KINDS.has(v as CategoryMetaFieldKind) ? (v as CategoryMetaFieldKind) : "text";
}

function asFieldOptions(
  raw: unknown,
): { value: string; label: string }[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const options = raw.flatMap((item) => {
    if (typeof item === "string" && item.trim()) {
      return [{ value: item.trim(), label: item.trim() }];
    }
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const value = String(row.value ?? row.key ?? "").trim();
    if (!value) return [];
    const label = String(row.label ?? row.name ?? value).trim() || value;
    return [{ value, label }];
  });
  return options.length ? options : undefined;
}

function fieldFromRecord(row: Record<string, unknown>, fallbackKey?: string): CategoryMetaField | null {
  const key = String(row.key ?? row.name ?? fallbackKey ?? "").trim();
  if (!key) return null;
  const label = String(row.label ?? row.title ?? key).trim() || key;
  const helpRaw = row.help ?? row.help_text ?? row.helpText;
  const field: CategoryMetaField = {
    key,
    label,
    kind: asFieldKind(row.kind ?? row.type),
  };
  if (row.required != null) {
    field.required = row.required === true || row.required === "true" || row.required === 1;
  }
  const placeholder = String(row.placeholder ?? "").trim();
  if (placeholder) field.placeholder = placeholder;
  if (typeof helpRaw === "string" && helpRaw.trim()) field.help = helpRaw.trim();
  const options = asFieldOptions(row.options);
  if (options) field.options = options;
  return field;
}

/** Accept the API array, a JSON string, `{ fields }`, or a key→spec map. */
export function normalizeCategoryFields(raw: unknown): CategoryMetaField[] {
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      value = JSON.parse(trimmed) as unknown;
    } catch {
      return [];
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.fields)) value = obj.fields;
    else if (Array.isArray(obj.items)) value = obj.items;
    else {
      value = Object.entries(obj).map(([key, spec]) =>
        spec && typeof spec === "object" ? { key, ...(spec as object) } : { key, label: key },
      );
    }
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const field = fieldFromRecord(item as Record<string, unknown>);
    return field ? [field] : [];
  });
}

/** Parent fields, then subcategory fields. A child row with the same key overrides. */
export function mergeCategoryFields(
  parent: CategoryMetaField[],
  child: CategoryMetaField[],
): CategoryMetaField[] {
  const merged = parent.map((field) => ({ ...field }));
  for (const field of child) {
    const idx = merged.findIndex((row) => row.key === field.key);
    if (idx < 0) {
      merged.push(field);
      continue;
    }
    const base = merged[idx];
    merged[idx] = {
      ...base,
      ...field,
      label: field.label || base.label,
      kind: field.kind || base.kind,
      required: field.required !== undefined ? field.required : base.required,
      help: field.help ?? base.help,
      placeholder: field.placeholder ?? base.placeholder,
      options: field.options?.length ? field.options : base.options,
    };
  }
  return merged;
}

/** Category metadata: DB fields for the parent, else the in-code defaults, plus subcategory overrides. */
export function categoryMetaFieldsFromItems(
  parentLabel: string | null | undefined,
  items: {
    slug: string;
    label: string;
    parent_slug?: string | null;
    metadata?: unknown;
  }[],
  subcategoryLabel?: string | null,
): CategoryMetaField[] {
  const p = (parentLabel ?? "").trim();
  if (!p) return [];
  const parentItem = items.find((i) => !i.parent_slug && i.label === p);
  const storedParent = normalizeCategoryFields(parentItem?.metadata);
  const parentFields = storedParent.length > 0 ? storedParent : categoryMetaFields(parentLabel);

  const sub = (subcategoryLabel ?? "").trim();
  if (!sub) return parentFields;
  const childItem = items.find(
    (i) => i.label === sub && (!parentItem || i.parent_slug === parentItem.slug),
  );
  const childFields = normalizeCategoryFields(childItem?.metadata);
  if (childFields.length === 0) return parentFields;
  return mergeCategoryFields(parentFields, childFields);
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

/** Physical products need cover photos; services/opportunities are text-first. */
export function photosRequiredForKind(kind: ListingKind): boolean {
  return kind === "product";
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
  extraFields?: CategoryMetaField[],
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
    if (raw.urgency?.trim()) out.urgency = raw.urgency.trim();
    if (raw.employment_type?.trim()) out.employment_type = raw.employment_type.trim();
    if (raw.employment?.trim()) out.employment = raw.employment.trim();
  }

  const fields = extraFields ?? categoryMetaFields(parentLabel);
  for (const field of fields) {
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

/** One short label for a text listing card: type, category, or both when they differ. */
export function listingCardLabel(
  kind: ListingKind,
  meta: ListingMeta,
  category?: string | null,
): string {
  const categoryLabel = category?.trim() ?? "";
  if (kind === "service") return categoryLabel || "Service";
  if (kind !== "opportunity") return categoryLabel || "Product";
  const kindLabel = optionLabel(OPPORTUNITY_KIND_OPTIONS, meta.opportunity_kind);
  if (
    kindLabel &&
    categoryLabel &&
    categoryLabel.toLowerCase() !== kindLabel.toLowerCase()
  ) {
    return `${kindLabel} · ${categoryLabel}`;
  }
  return kindLabel || categoryLabel || "Opportunity";
}

function titleCaseChip(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function urgencyChip(meta: ListingMeta): string | null {
  const raw = String(meta.urgency ?? meta.urgent ?? "").trim().toLowerCase();
  if (!raw || raw === "false" || raw === "no" || raw === "normal" || raw === "0") return null;
  if (raw === "true" || raw === "yes" || raw === "urgent" || raw === "1") return "Urgent";
  return titleCaseChip(raw);
}

function deadlineChip(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  const date = iso
    ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    : Number.isNaN(Date.parse(t))
      ? null
      : new Date(Date.parse(t));
  if (!date || Number.isNaN(date.getTime())) {
    if (/^(closes|deadline|urgent)/i.test(t)) return t;
    return `Deadline ${t}`;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "Deadline passed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes in 1 day";
  if (days <= 30) return `Closes in ${days} days`;
  const formatted = due.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `Deadline ${formatted}`;
}

/** Short facts for a text-only service or opportunity card. */
export function textListingChips(kind: ListingKind, meta: ListingMeta): string[] {
  if (kind === "service") {
    const chips: string[] = [];
    const pricing = optionLabel(PRICING_MODEL_OPTIONS, meta.pricing_model);
    if (pricing) chips.push(pricing);
    if (meta.availability?.trim()) chips.push(meta.availability.trim());
    if (meta.service_area?.trim()) chips.push(meta.service_area.trim());
    return chips;
  }
  if (kind !== "opportunity") return [];
  const chips: string[] = [];
  const urgency = urgencyChip(meta);
  if (urgency) chips.push(urgency);
  const deadline = deadlineChip(meta.deadline);
  if (deadline) chips.push(deadline);
  const employment = (meta.employment_type || meta.employment || "").trim();
  if (employment) chips.push(titleCaseChip(employment));
  const pay = optionLabel(COMPENSATION_OPTIONS, meta.compensation);
  if (pay) chips.push(pay);
  return chips;
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
