"use client";

import IntentPreviewBlock from "@/components/post/IntentPreviewBlock";
import ListingPreviewCard from "@/components/post/ListingPreviewCard";
import ListingTypeSummary from "@/components/shop/ListingTypeSummary";
import { indefiniteArticle, LISTING_KIND_LABEL } from "@/lib/listingMeta";
import { useSettingsHref } from "@/lib/settingsHref";
import AiReviewSection from "./product-form/AiReviewSection";
import CategorySection from "./product-form/CategorySection";
import DetailsSection from "./product-form/DetailsSection";
import FormHeader from "./product-form/FormHeader";
import IntentSection from "./product-form/IntentSection";
import LocationSection from "./product-form/LocationSection";
import MediaSection from "./product-form/MediaSection";
import ModerationBanner from "./product-form/ModerationBanner";
import MoreDetailsSection from "./product-form/MoreDetailsSection";
import PriceSection from "./product-form/PriceSection";
import ProfilePhotoNudge from "./product-form/ProfilePhotoNudge";
import { buildQualityRequest } from "./product-form/qualityRequest";
import SubmitBar from "./product-form/SubmitBar";
import type { ProductFormPageProps, SectionKey, SectionProps } from "./product-form/types";
import { useAiReview } from "./product-form/useAiReview";
import { useListingSubmit } from "./product-form/useListingSubmit";
import { useProductDraft } from "./product-form/useProductDraft";
import { invalidSectionsFor } from "./product-form/validation";

export default function ProductFormPage({
  mode,
  product,
  shopId,
  noShop = false,
  itemType = "product",
  listingKind,
  shopLabel,
  onChangeShop,
  onVerificationRequired,
  contactVerified,
  backUrl = "/merchant/listings",
  hasBottomNav = true,
  flush = false,
  onShopRequired,
  onBack,
}: ProductFormPageProps) {
  const form = useProductDraft({ mode, product, shopId, itemType, listingKind, contactVerified });
  const { draft, setDraft, errors, intentErrors, catFields, categoryParts } = form;
  const profilePhotoHref = useSettingsHref("profile-photo");
  const buildRequest = () => buildQualityRequest(draft, catFields, categoryParts);
  const ai = useAiReview(draft, setDraft, buildRequest);
  const submit = useListingSubmit({
    mode,
    product,
    shopId,
    noShop,
    backUrl,
    onVerificationRequired,
    onShopRequired,
    form,
    ai,
    buildRequest,
  });
  const { showErrors, serverSection } = submit;

  const invalidSections = invalidSectionsFor({
    showErrors,
    errors,
    intentErrors,
    kind: draft.kind,
    saleKind: form.sale.kind,
    serverFieldErrors: submit.serverFieldErrors,
    mediaError: submit.mediaError,
    linkServerError: submit.linkServerError,
    serverSection,
  });
  const section = (key: SectionKey): SectionProps => ({
    draft,
    setDraft,
    showErrors,
    errors,
    invalid: invalidSections.has(key),
    serverMessage: serverSection?.key === key ? serverSection.message : null,
    onEdited: () => submit.clearServerSection(key),
  });

  const kindName = LISTING_KIND_LABEL[draft.kind].toLowerCase();
  const pageTitle = mode === "add" ? `Post ${indefiniteArticle(kindName)} ${kindName}` : "Edit listing";
  const categorySection = <CategorySection {...section("category")} />;

  return (
    <div
      className={`mx-auto w-full max-w-[1440px] pt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10 ${
        hasBottomNav
          ? "pb-[calc(9rem+env(safe-area-inset-bottom,0px))] md:pb-32"
          : "pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
      }`}
    >
      <div className="min-w-0 space-y-6">
        <FormHeader title={pageTitle} backUrl={backUrl} onBack={onBack} flush={flush} />

        <form id="product-form-page" onSubmit={(e) => void submit.handleSubmit(e)} noValidate className="space-y-8">
          {mode === "edit" && product ? <ModerationBanner product={product} /> : null}
          {mode === "add" && !form.sessionUser?.avatar_url ? <ProfilePhotoNudge href={profilePhotoHref} /> : null}

          <div>
            <ListingTypeSummary kind={draft.kind} meta={draft.meta} shopLabel={shopLabel} onChangeShop={onChangeShop} />
          </div>

          <IntentSection {...section("intent")} intentError={intentErrors.intent} />
          {draft.kind === "service" ? categorySection : null}
          <MediaSection
            {...section("media")}
            maxPhotos={form.mediaLimits.maxPhotos}
            maxVideos={form.mediaLimits.maxVideos}
            planTier={form.planTier}
            mediaError={submit.mediaError}
          />
          <DetailsSection {...section("details")} titleError={intentErrors.title} />
          <LocationSection
            {...section("location")}
            shopLocationLabel={form.shopLocationLabel}
            verifyHref={profilePhotoHref}
          />
          <PriceSection {...section("price")} sale={form.sale} />
          {draft.kind === "product" ? categorySection : null}
          <MoreDetailsSection
            {...section("meta")}
            catFields={catFields}
            parentLabel={categoryParts.parentLabel}
            applicationLinkError={intentErrors.application_link}
            linkServerError={submit.linkServerError}
            setLinkServerError={submit.setLinkServerError}
            serverFieldErrors={submit.serverFieldErrors}
            setServerFieldErrors={submit.setServerFieldErrors}
          />
          <IntentPreviewBlock kind={draft.kind} meta={draft.meta} category={draft.category} title={draft.title} />
          <AiReviewSection ai={ai} kind={draft.kind} categoryParts={categoryParts} />
        </form>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Preview</p>
          <ListingPreviewCard draft={draft} />
        </div>
      </aside>

      <SubmitBar
        mode={mode}
        hasBottomNav={hasBottomNav}
        saving={submit.saving}
        aiChecking={ai.aiChecking}
        isDirty={form.isDirty}
        critical={Boolean(ai.aiCheck?.critical)}
        onCancel={submit.handleCancel}
      />
    </div>
  );
}
