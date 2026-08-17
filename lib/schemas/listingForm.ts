import { z } from "zod";
import type { ListingKind, ListingMeta } from "@/lib/listingMeta";
import {
  COMPENSATION_OPTIONS,
  CONDITION_OPTIONS,
  OPPORTUNITY_KIND_OPTIONS,
  PRICING_MODEL_OPTIONS,
  categoryMetaFields,
  descriptionMeetsStandard,
  hasRequiredListingImage,
} from "@/lib/listingMeta";
import { isVideoUrl } from "@/lib/api/products";

const CONDITION_VALUES = CONDITION_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];
const PRICING_MODEL_VALUES = PRICING_MODEL_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];
const OPPORTUNITY_KIND_VALUES = OPPORTUNITY_KIND_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];
const COMPENSATION_VALUES = COMPENSATION_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];

const amountString = z
  .string()
  .trim()
  .refine((v) => v === "" || Number.isFinite(Number(v.replace(/,/g, ""))), {
    message: "Enter a valid amount.",
  })
  .refine(
    (v) => v === "" || Number(v.replace(/,/g, "")) >= 0,
    { message: "Amount cannot be negative." },
  );

const listingMetaSchema: z.ZodType<ListingMeta> = z.object({
  condition: z.enum(CONDITION_VALUES).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  storage: z.string().optional(),
  warranty: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  year: z.string().optional(),
  make_model: z.string().optional(),
  mileage_km: z.string().optional(),
  property_type: z
    .enum(["land", "house", "apartment", "room", "commercial", "other"])
    .optional(),
  size_sqm: z.string().optional(),
  size_acres: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  title_status: z
    .enum(["titled", "mailo", "leasehold", "customary", "other"])
    .optional(),
  furnished: z.enum(["yes", "no", "partial"]).optional(),
  unit: z.string().optional(),
  pricing_model: z.enum(PRICING_MODEL_VALUES).optional(),
  availability: z.string().optional(),
  service_area: z.string().optional(),
  opportunity_kind: z.enum(OPPORTUNITY_KIND_VALUES).optional(),
  compensation: z.enum(COMPENSATION_VALUES).optional(),
  deadline: z.string().optional(),
  requirements: z.string().optional(),
}) as z.ZodType<ListingMeta>;

export const listingDraftSchema = z.object({
  kind: z.enum(["product", "service", "opportunity"]),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(140, "Title is too long (max 140 characters)."),
  description: z.string(),
  price_ugx: amountString,
  sale_price: amountString,
  stock_quantity: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), {
      message: "Stock must be a whole number.",
    }),
  category: z.string().trim().min(1, "Pick a category."),
  image_urls: z.array(z.string().url().or(z.string().min(1))),
  is_published: z.boolean(),
  is_negotiable: z.boolean(),
  meta: listingMetaSchema,
});

export type ListingDraftInput = z.infer<typeof listingDraftSchema>;

export type ListingDraft = {
  kind: ListingKind;
  title: string;
  description: string;
  price_ugx: string;
  sale_price: string;
  stock_quantity: string;
  category: string;
  image_urls: string[];
  is_published: boolean;
  is_negotiable: boolean;
  meta: ListingMeta;
};

export type ListingFieldErrors = Partial<
  Record<
    | "title"
    | "description"
    | "category"
    | "price_ugx"
    | "sale_price"
    | "stock_quantity"
    | "images"
    | "meta",
    string
  >
>;

export type ListingValidationContext = {
  parentCategoryLabel: string | null | undefined;
  subcategoryLabel: string | null | undefined;
  parentHasChildren: boolean;
};

function parseAmount(v: string): number | null {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export type SalePriceState =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; savings: number; percent: number };

export function evaluateSalePrice(
  priceStr: string,
  saleStr: string,
): SalePriceState {
  const trimmed = saleStr.trim();
  if (!trimmed) return { kind: "empty" };
  const price = parseAmount(priceStr);
  const sale = parseAmount(trimmed);
  if (sale === null) return { kind: "invalid", message: "Enter a valid amount." };
  if (price === null || price <= 0)
    return { kind: "invalid", message: "Set the price first." };
  if (sale >= price)
    return { kind: "invalid", message: "Sale price must be less than the price." };
  const savings = price - sale;
  const percent = Math.round((savings / price) * 100);
  return { kind: "ok", savings, percent };
}

/**
 * Validate a listing draft using the zod schema plus contextual rules
 * (description quality, image requirement, category kind-specific meta,
 * per-category required meta fields). Returns a flat field-error map keyed
 * to the form UI, empty when the draft is valid.
 */
export function validateListingDraft(
  draft: ListingDraft,
  ctx: ListingValidationContext,
): ListingFieldErrors {
  const errors: ListingFieldErrors = {};

  const parsed = listingDraftSchema.safeParse(draft);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "title" && !errors.title) errors.title = issue.message;
      else if (key === "category" && !errors.category)
        errors.category = issue.message;
      else if (key === "price_ugx" && !errors.price_ugx)
        errors.price_ugx = issue.message;
      else if (key === "sale_price" && !errors.sale_price)
        errors.sale_price = issue.message;
      else if (key === "stock_quantity" && !errors.stock_quantity)
        errors.stock_quantity = issue.message;
    }
  }

  const descCheck = descriptionMeetsStandard(draft.description);
  if (!descCheck.ok) errors.description = descCheck.message;

  if (!hasRequiredListingImage(draft.image_urls, isVideoUrl)) {
    errors.images = "Upload at least one photo (video alone is not enough).";
  }

  if (draft.category.trim() && ctx.parentHasChildren && !ctx.subcategoryLabel) {
    errors.category = "Pick a subcategory.";
  }

  const sale = evaluateSalePrice(draft.price_ugx, draft.sale_price);
  if (sale.kind === "invalid") errors.sale_price = sale.message;

  if (draft.kind === "product" && !draft.meta.condition) {
    errors.meta = "Select product condition.";
  }
  if (draft.kind === "service" && !draft.meta.pricing_model) {
    errors.meta = "Select how you price this service.";
  }
  if (draft.kind === "opportunity" && !draft.meta.opportunity_kind) {
    errors.meta = "Select what kind of opportunity this is.";
  }

  for (const field of categoryMetaFields(ctx.parentCategoryLabel)) {
    if (!field.required) continue;
    const v = draft.meta[field.key];
    if (v == null || String(v).trim() === "") {
      errors.meta = `${field.label} is required for this category.`;
      break;
    }
  }

  return errors;
}
