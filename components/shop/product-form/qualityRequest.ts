import type { ListingQualityRequest } from "@/lib/api/aiListing";
import type { CategoryParts } from "@/lib/categories";
import { parseFileValue } from "@/lib/listingAttachment";
import {
  COMPENSATION_OPTIONS,
  CONDITION_OPTIONS,
  PRICING_MODEL_OPTIONS,
  type CategoryMetaField,
} from "@/lib/listingMeta";
import type { FormDraft } from "./types";

const optionLabel = (options: readonly { value: string; label: string }[], value?: string) =>
  options.find((o) => o.value === value)?.label ?? value ?? "";

/** Text the AI checker can read for one category field value ("" = skipped). */
export function detailValue(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "boolean") return raw ? "yes" : "no";
  if (Array.isArray(raw)) return raw.map(detailValue).filter(Boolean).join(", ");
  if (typeof raw === "object") return parseFileValue(raw)?.name ?? "";
  return String(raw);
}

/** AI quality check payload: the listing plus every value dedicated fields capture. */
export function buildQualityRequest(
  draft: FormDraft,
  catFields: CategoryMetaField[],
  categoryParts: CategoryParts,
): ListingQualityRequest {
  const meta = draft.meta as Record<string, unknown>;
  const details: Record<string, string> = {
    [draft.kind === "opportunity" ? "Budget / pay (UGX)" : "Price (UGX)"]: draft.price_ugx.trim(),
    Location: draft.location_name.trim(),
  };
  if (draft.kind !== "opportunity") {
    details["After discount price (UGX)"] = draft.sale_price.trim();
    details.Negotiable = draft.is_negotiable ? "yes" : "no";
  }
  if (draft.kind === "product") {
    details["Stock quantity"] = draft.stock_quantity.trim();
    details.Condition = optionLabel(CONDITION_OPTIONS, draft.meta.condition);
    details.Brand = draft.meta.brand ?? "";
  }
  if (draft.kind === "service") {
    details["Pricing model"] = optionLabel(PRICING_MODEL_OPTIONS, draft.meta.pricing_model);
    details.Availability = draft.meta.availability ?? "";
    details["Service area"] = draft.meta.service_area ?? "";
  }
  if (draft.kind === "opportunity") {
    details.Compensation = optionLabel(COMPENSATION_OPTIONS, draft.meta.compensation);
    details["Application deadline"] = draft.meta.deadline ?? "";
    details["Applicant requirements"] = draft.meta.requirements ?? "";
  }
  for (const field of catFields) {
    details[field.label || field.key] = detailValue(meta[field.key]);
  }
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    image_urls: draft.image_urls,
    category: categoryParts.parentLabel || draft.category || null,
    subcategory: categoryParts.subcategoryLabel || null,
    listing_kind: draft.kind,
    details,
  };
}
