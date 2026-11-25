import { listingMetaWithSaveId } from "@/lib/api/listingSave";
import type { CreateProductRequest } from "@/lib/api/products";
import { listingPlaceFields } from "@/lib/listingLocation";
import { cleanListingMeta, listingKindToItemType, type CategoryMetaField } from "@/lib/listingMeta";
import { withIntentMeta } from "@/lib/listingIntentForm";
import type { SalePriceState } from "@/lib/schemas/listingForm";
import { parseAmount } from "./draft";
import type { FormDraft } from "./types";

/** API create/update body for the draft. `saveId` tags creates so ambiguous failures can be confirmed. */
export function buildListingBody(input: {
  draft: FormDraft;
  sale: SalePriceState;
  parentLabel: string | null;
  catFields: CategoryMetaField[];
  shopLocationLabel: string;
  saveId: string | null;
}): CreateProductRequest {
  const { draft } = input;
  const price = parseAmount(draft.price_ugx);
  const salePrice = input.sale.kind === "ok" ? parseAmount(draft.sale_price) : null;
  const meta = withIntentMeta(
    draft.kind,
    draft.meta,
    draft.category,
    cleanListingMeta(draft.kind, draft.meta, input.parentLabel, input.catFields),
  );
  const body: CreateProductRequest = {
    title: draft.title.trim(),
    description: draft.description.trim(),
    price_ugx: price ?? 0,
    discount_price: salePrice ?? undefined,
    category: draft.category.trim() || undefined,
    image_urls: [...draft.image_urls],
    is_published: draft.is_published,
    is_negotiable: draft.is_negotiable,
    ...listingPlaceFields(draft.location_name, input.shopLocationLabel),
    item_type: listingKindToItemType(draft.kind),
    listing_meta: input.saveId ? listingMetaWithSaveId(meta, input.saveId) : meta,
  };
  if (draft.kind === "product" && draft.stock_quantity.trim()) {
    body.stock_quantity = Math.max(0, parseInt(draft.stock_quantity, 10) || 0);
  }
  return body;
}
