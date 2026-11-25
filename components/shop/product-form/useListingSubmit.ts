import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import { checkListingQuality, type ListingQualityRequest } from "@/lib/api/aiListing";
import { ApiError } from "@/lib/api/base";
import { mediaUnreachableMessage, missingListingFields } from "@/lib/api/categoryFields";
import { confirmCreatedListing, confirmUpdatedListing, isAmbiguousSaveError } from "@/lib/api/listingSave";
import type { Product } from "@/lib/api/products";
import { LISTING_KIND_LABEL } from "@/lib/listingMeta";
import { isMaintenanceMode, MAINTENANCE_MESSAGE } from "@/lib/platformMessages";
import { ShopRequiredError, publishNewListing } from "@/lib/shop/publishListing";
import { useSessionStore } from "@/lib/state/session-store";
import { isVerificationRequired, verificationMessage } from "@/lib/verification";
import { buildListingBody } from "./listingBody";
import type { ServerSection } from "./types";
import type { AiReviewState } from "./useAiReview";
import type { ProductDraftState } from "./useProductDraft";
import { scrollToFirstInvalid, sectionForError } from "./validation";

type Options = {
  mode: "add" | "edit";
  product?: Product;
  shopId?: string;
  noShop: boolean;
  backUrl: string;
  onVerificationRequired?: () => void;
  onShopRequired?: () => void;
  form: ProductDraftState;
  ai: AiReviewState;
  buildRequest: () => ListingQualityRequest;
};

const newSaveId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `save-${Date.now()}`;

/** Submit flow: AI gate, create/update, and mapping API rejections onto form sections. */
export function useListingSubmit(opts: Options) {
  const { mode, product, backUrl, form, ai } = opts;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [linkServerError, setLinkServerError] = useState<string | null>(null);
  /** Section the API rejected (price, images, category…), highlighted until edited. */
  const [serverSection, setServerSection] = useState<ServerSection | null>(null);
  const submitLock = useRef(false);
  const clientSaveIdRef = useRef(newSaveId());

  const clearServerSection = (key: ServerSection["key"]) =>
    setServerSection((cur) => (cur?.key === key ? null : cur));

  function afterSaveHref() {
    if (mode !== "add") return backUrl;
    const role = useSessionStore.getState().user?.user_role;
    if (role === "merchant" || role === "admin") return "/merchant/listings";
    return backUrl;
  }

  function handleCancel() {
    if (saving || submitLock.current) return;
    if (form.isDirty && !window.confirm("Discard your changes?")) return;
    router.push(backUrl);
  }

  /** The AI check runs before the API call; if the checker itself fails, server moderation decides. */
  async function passesAiGate(): Promise<boolean> {
    let verdict = ai.aiCheck;
    if (verdict === null) {
      ai.setAiChecking(true);
      try {
        verdict = await checkListingQuality(opts.buildRequest());
        ai.setAiCheck(verdict);
      } catch {
        toast.message("AI review skipped", {
          description: "Couldn't reach the AI checker — continuing without it.",
        });
        verdict = null;
      }
      ai.setAiChecking(false);
    }
    if (verdict?.critical) {
      toast.error("Listing needs edits before it can be posted", { description: verdict.feedback });
      return false;
    }
    if (verdict && !verdict.ok) {
      toast.message("AI tips before you publish", { description: verdict.feedback });
    }
    return true;
  }

  function flagInvalid(toastId: string | number, message: string, mark: () => void) {
    mark();
    setShowErrors(true);
    scrollToFirstInvalid();
    toast.error(message, { id: toastId });
  }

  async function save() {
    const { draft } = form;
    const body = buildListingBody({
      draft,
      sale: form.sale,
      parentLabel: form.categoryParts.parentLabel,
      catFields: form.catFields,
      shopLocationLabel: form.shopLocationLabel,
      saveId: mode === "add" ? clientSaveIdRef.current : null,
    });
    setSaving(true);
    const label = mode === "add" ? `Adding ${LISTING_KIND_LABEL[draft.kind].toLowerCase()}` : "Saving changes";
    const done = mode === "add" ? `${LISTING_KIND_LABEL[draft.kind]} added` : "Changes saved";
    const toastId = toast.loading(`${label}…`);
    const request =
      mode === "add"
        ? publishNewListing(body, opts.shopId, { personal: opts.noShop })
        : product
          ? apiProducts.updateProduct(product.id, body)
          : Promise.reject(new Error("Missing product"));
    try {
      const saved = await request;
      toast.success(done, { id: toastId });
      form.markSaved(draft);
      const next = afterSaveHref();
      router.push(
        mode === "add" && saved?.id && next === "/merchant/listings"
          ? `${next}?posted=${encodeURIComponent(saved.id)}`
          : next,
      );
    } catch (err) {
      if (isMaintenanceMode(err)) {
        toast.error(MAINTENANCE_MESSAGE, { id: toastId });
        return;
      }
      if (isVerificationRequired(err)) {
        toast.error(verificationMessage(err), { id: toastId });
        opts.onVerificationRequired?.();
        return;
      }
      if (err instanceof ShopRequiredError) {
        toast.message("Choose a business", {
          id: toastId,
          description: "Pick which business this ad belongs to, then save again.",
        });
        opts.onShopRequired?.();
        return;
      }
      const missing = missingListingFields(err);
      if (missing) {
        const next = Object.fromEntries(missing.map((f) => [f.key, `${f.label} is required for this category.`]));
        const message = err instanceof Error ? err.message : "Add the required category fields.";
        flagInvalid(toastId, message, () => setServerFieldErrors(next));
        return;
      }
      const unreachable = mediaUnreachableMessage(err);
      if (unreachable) {
        flagInvalid(toastId, unreachable, () => setMediaError(unreachable));
        return;
      }
      if (isAmbiguousSaveError(err)) {
        const confirmed =
          mode === "add"
            ? await confirmCreatedListing(body, clientSaveIdRef.current)
            : product
              ? await confirmUpdatedListing(product.id, body)
              : null;
        if (confirmed) {
          toast.success(done, { id: toastId });
          form.markSaved(draft);
          router.push(afterSaveHref());
          return;
        }
      }
      const message = err instanceof Error ? err.message : "Could not save. Try again.";
      if (err instanceof ApiError && err.code === "invalid_application_link") {
        flagInvalid(toastId, message, () => setLinkServerError(message));
        return;
      }
      const section = sectionForError(err);
      if (section) {
        setServerSection({ key: section, message });
        scrollToFirstInvalid();
      }
      toast.error(message, { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setShowErrors(true);
    setMediaError(null);
    setLinkServerError(null);
    setServerSection(null);
    try {
      if (!form.canSubmit) {
        toast.error("Fix the highlighted fields before saving.");
        scrollToFirstInvalid();
        return;
      }
      if (!(await passesAiGate())) return;
      await save();
    } finally {
      submitLock.current = false;
    }
  }

  return {
    saving,
    showErrors,
    serverFieldErrors,
    setServerFieldErrors,
    mediaError,
    linkServerError,
    setLinkServerError,
    serverSection,
    clearServerSection,
    handleSubmit,
    handleCancel,
  };
}
