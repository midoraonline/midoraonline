import { ApiError } from "@/lib/api/base";
import {
  intentError,
  normalizeApplicationLink,
  showsApplicationLink,
  titleLengthError,
} from "@/lib/listingIntentForm";
import type { ListingFieldErrors, SalePriceState } from "@/lib/schemas/listingForm";
import type { FormDraft, IntentErrors, SectionKey, ServerSection } from "./types";

const ERROR_SECTIONS: Record<string, SectionKey> = {
  too_many_media: "media",
  too_many_photos: "media",
  too_many_videos: "media",
  photos_required: "media",
  invalid_price: "price",
  price_required: "price",
  stock_required: "price",
  category_required: "category",
  description_required: "details",
  title_required: "details",
  location_required: "location",
  listing_fields_required: "meta",
  invalid_intent: "intent",
  title_too_long: "details",
  invalid_application_link: "meta",
};

/** Which form section an API rejection belongs to, so it can be highlighted. */
export function sectionForError(err: unknown): SectionKey | null {
  if (!(err instanceof ApiError)) return null;
  if (err.code && ERROR_SECTIONS[err.code]) return ERROR_SECTIONS[err.code];
  const msg = err.message.toLowerCase();
  if (/photo|image|video|media/.test(msg)) return "media";
  if (/price/.test(msg)) return "price";
  if (/category/.test(msg)) return "category";
  if (/location|city|area/.test(msg)) return "location";
  if (/title|description/.test(msg)) return "details";
  return null;
}

/** v1.2 checks: offer/need + opportunity category, title hard limit, application link. */
export function intentErrorsFor(mode: "add" | "edit", draft: FormDraft): IntentErrors {
  const out: IntentErrors = {};
  // Edits of older listings are not blocked on a missing choice; the backfill sets it.
  const intent = mode === "add" ? intentError(draft.kind, draft.meta, draft.category) : null;
  if (intent) out.intent = intent;
  const title = titleLengthError(draft.title);
  if (title) out.title = title;
  const link = showsApplicationLink(draft.kind) ? normalizeApplicationLink(draft.meta.application_link).error : null;
  if (link) out.application_link = link;
  return out;
}

export function invalidSectionsFor(input: {
  showErrors: boolean;
  errors: ListingFieldErrors;
  intentErrors: IntentErrors;
  kind: FormDraft["kind"];
  saleKind: SalePriceState["kind"];
  serverFieldErrors: Record<string, string>;
  mediaError: string | null;
  linkServerError: string | null;
  serverSection: ServerSection | null;
}): Set<SectionKey> {
  const { showErrors, errors, intentErrors } = input;
  const out = new Set<SectionKey>();
  if (showErrors) {
    if (errors.images) out.add("media");
    if (errors.title || errors.description || intentErrors.title) out.add("details");
    if (errors.location_name || errors.phone) out.add("location");
    if (errors.price_ugx || errors.sale_price || errors.stock_quantity || input.saleKind === "invalid") out.add("price");
    if (errors.category) out.add(input.kind === "opportunity" ? "intent" : "category");
    if (intentErrors.intent) out.add("intent");
    if (errors.meta || intentErrors.application_link || Object.keys(input.serverFieldErrors).length) out.add("meta");
  }
  if (input.mediaError) out.add("media");
  if (input.linkServerError) out.add("meta");
  if (input.serverSection) out.add(input.serverSection.key);
  return out;
}

export function scrollToFirstInvalid() {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('#product-form-page [data-invalid="true"]');
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    const field = el.querySelector<HTMLElement>('[aria-invalid="true"], input:not([type="hidden"]):not([disabled]), textarea, select');
    field?.focus({ preventScroll: true });
  });
}
