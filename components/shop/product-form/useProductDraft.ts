import { useEffect, useMemo, useState } from "react";
import { apiProducts } from "@/lib/api";
import type { ItemType, Product } from "@/lib/api/products";
import { usePublicSettings } from "@/lib/hooks/usePlatformAnalytics";
import { normalizeListingKind, type ListingKind } from "@/lib/listingMeta";
import { evaluateSalePrice, validateListingDraft } from "@/lib/schemas/listingForm";
import { useSessionStore } from "@/lib/state/session-store";
import { draftsEqual, emptyDraft, productToDraft } from "./draft";
import type { FormDraft } from "./types";
import { useCategoryFields } from "./useCategoryFields";
import { useShopLocationLabel } from "./useShopLocationLabel";
import { intentErrorsFor } from "./validation";

type Options = {
  mode: "add" | "edit";
  product?: Product;
  shopId?: string;
  itemType: ItemType;
  listingKind?: ListingKind;
  contactVerified?: boolean;
};

/** Draft state, its category context, and client-side validation. */
export function useProductDraft({ mode, product, shopId, itemType, listingKind, contactVerified }: Options) {
  const initialKind = normalizeListingKind(mode === "edit" && product ? product.item_type : listingKind ?? itemType);
  const initialDraft = useMemo(
    () => (mode === "edit" && product ? productToDraft(product) : emptyDraft(initialKind)),
    [mode, product, initialKind],
  );
  const [draft, setDraft] = useState<FormDraft>(initialDraft);
  /** Last loaded/saved draft; the form is dirty when it differs. */
  const [baseline, setBaseline] = useState<FormDraft>(initialDraft);
  const { mediaLimitsFor } = usePublicSettings();
  const sessionUser = useSessionStore((s) => s.user);
  const planTier = sessionUser?.plan_tier ?? "basic";
  const mediaLimits = mediaLimitsFor(planTier);
  const shopLocationLabel = useShopLocationLabel(shopId);
  const { categoryParts, catFields, parentHasChildren } = useCategoryFields(draft.category);

  // Changing the type step keeps the draft but resets kind-specific fields (adjusted during render).
  const [syncedKind, setSyncedKind] = useState<ListingKind | undefined>(undefined);
  if (listingKind !== syncedKind) {
    setSyncedKind(listingKind);
    if (listingKind) {
      setDraft((d) => (d.kind === listingKind ? d : { ...d, kind: listingKind, category: "", meta: {} }));
    }
  }

  useEffect(() => {
    if (mode !== "edit" || !product) return;
    let cancelled = false;
    apiProducts
      .getProduct(product.id)
      .then((full) => {
        if (cancelled || !full) return;
        const fresh = productToDraft(full);
        setDraft((prev) => (draftsEqual(prev, fresh) ? prev : fresh));
        setBaseline(fresh);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mode, product]);

  const isDirty = !draftsEqual(draft, baseline);
  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(ev: BeforeUnloadEvent) {
      ev.preventDefault();
      ev.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const phoneVerified = contactVerified ?? Boolean(sessionUser?.phone_verified || sessionUser?.email_verified);
  const errors = useMemo(
    () =>
      validateListingDraft(draft, {
        parentCategoryLabel: categoryParts.parentLabel,
        subcategoryLabel: categoryParts.subcategoryLabel,
        parentHasChildren,
        metaFields: catFields,
        phoneVerified,
        shopLocationLabel,
        maxPhotos: mediaLimits.maxPhotos,
        maxVideos: mediaLimits.maxVideos,
      }),
    [draft, categoryParts, parentHasChildren, catFields, phoneVerified, shopLocationLabel, mediaLimits.maxPhotos, mediaLimits.maxVideos],
  );
  const intentErrors = useMemo(() => intentErrorsFor(mode, draft), [mode, draft]);
  const sale = evaluateSalePrice(draft.price_ugx, draft.sale_price);
  const canSubmit = Object.keys(errors).length === 0 && Object.keys(intentErrors).length === 0;

  return {
    draft,
    setDraft,
    markSaved: setBaseline,
    isDirty,
    sale,
    errors,
    intentErrors,
    canSubmit,
    categoryParts,
    catFields,
    shopLocationLabel,
    mediaLimits,
    planTier,
    sessionUser,
  };
}

export type ProductDraftState = ReturnType<typeof useProductDraft>;
