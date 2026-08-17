"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Clock, Check, Sparkles, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import { checkListingQuality, type ListingQualityResponse } from "@/lib/api/aiListing";
import {
  productImageUrls,
  type CreateProductRequest,
  type ItemType,
  type Product,
} from "@/lib/api/products";
import CategoryPicker from "@/components/CategoryPicker";
import { MediaDropzone } from "@/components/shop/MediaDropzone";
import { deleteUploadThingFiles } from "@/lib/uploadthing";
import { resolveCategoryParts } from "@/lib/categories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import {
  categoryMetaFields,
  cleanListingMeta,
  COMPENSATION_OPTIONS,
  CONDITION_OPTIONS,
  LISTING_KIND_LABEL,
  LISTING_KIND_OPTIONS,
  listingKindToItemType,
  normalizeListingKind,
  OPPORTUNITY_KIND_OPTIONS,
  parseListingMeta,
  PRICING_MODEL_OPTIONS,
  type ListingKind,
  type ListingMeta,
} from "@/lib/listingMeta";
import {
  evaluateSalePrice,
  validateListingDraft,
  type ListingDraft,
} from "@/lib/schemas/listingForm";

const UGX = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function parseAmount(v: string): number | null {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function MediaGridWrapper({
  urls,
  onRemove,
  onImageUploaded,
  onVideoUploaded,
}: {
  urls: string[];
  onRemove: (index: number) => void;
  onImageUploaded: (url: string) => void;
  onVideoUploaded: (url: string) => void;
}) {
  return (
    <MediaDropzone
      urls={urls}
      onRemove={onRemove}
      onImageUploaded={onImageUploaded}
      onVideoUploaded={onVideoUploaded}
    />
  );
}

function QualityPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        ok
          ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
          : "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"
      }`}
    >
      {label}
    </span>
  );
}

type FormDraft = ListingDraft;

function emptyDraft(kind: ListingKind): FormDraft {
  return {
    kind,
    title: "",
    description: "",
    price_ugx: "",
    sale_price: "",
    stock_quantity: "",
    category: "",
    image_urls: [],
    is_published: true,
    is_negotiable: true,
    meta: {},
  };
}

function productToDraft(p: Product): FormDraft {
  return {
    kind: normalizeListingKind(p.item_type),
    title: p.title ?? "",
    description: p.description ?? "",
    price_ugx: p.price_ugx != null ? String(p.price_ugx) : "",
    sale_price: p.discount_price != null ? String(p.discount_price) : "",
    stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : "",
    category: p.category ?? "",
    image_urls: productImageUrls(p),
    is_published: p.is_published ?? true,
    is_negotiable: p.is_negotiable !== false,
    meta: parseListingMeta(p.listing_meta),
  };
}

function draftsEqual(a: FormDraft, b: FormDraft): boolean {
  return (
    a.kind === b.kind &&
    a.title === b.title &&
    a.description === b.description &&
    a.price_ugx === b.price_ugx &&
    a.sale_price === b.sale_price &&
    a.stock_quantity === b.stock_quantity &&
    a.category === b.category &&
    a.is_published === b.is_published &&
    a.is_negotiable === b.is_negotiable &&
    a.image_urls.length === b.image_urls.length &&
    a.image_urls.every((u, i) => u === b.image_urls[i]) &&
    JSON.stringify(a.meta) === JSON.stringify(b.meta)
  );
}

export default function ProductFormPage({
  mode,
  product,
  shopId,
  itemType = "product",
  backUrl = "/merchant/listings",
}: {
  mode: "add" | "edit";
  product?: Product;
  shopId: string;
  itemType?: ItemType;
  backUrl?: string;
}) {
  const router = useRouter();
  const initialKind = normalizeListingKind(
    mode === "edit" && product ? product.item_type : itemType,
  );
  const initialDraft = useMemo(
    () => (mode === "edit" && product ? productToDraft(product) : emptyDraft(initialKind)),
    [mode, product, initialKind],
  );
  const [draft, setDraft] = useState<FormDraft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [aiCheck, setAiCheck] = useState<ListingQualityResponse | null>(null);
  const [aiChecking, setAiChecking] = useState(false);

  const [sessionUploaded, setSessionUploaded] = useState<string[]>([]);
  const [sessionRemoved, setSessionRemoved] = useState<string[]>([]);
  const { items: categoryItems, tree: categoryTree } = useCategoryItems();
  const initialRef = useRef(initialDraft);

  const isDirty = !draftsEqual(draft, initialRef.current);
  const sale = evaluateSalePrice(draft.price_ugx, draft.sale_price);
  const allowTypePick = mode === "add";

  useEffect(() => {
    if (mode !== "edit" || !product) return;
    let cancelled = false;
    apiProducts
      .getProduct(product.id)
      .then((full) => {
        if (cancelled || !full) return;
        const fresh = productToDraft(full);
        setDraft((prev) => (draftsEqual(prev, fresh) ? prev : fresh));
        initialRef.current = fresh;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mode, product]);

  const categoryParts = useMemo(
    () => resolveCategoryParts(draft.category, categoryItems),
    [draft.category, categoryItems],
  );
  const catFields = useMemo(
    () => categoryMetaFields(categoryParts.parentLabel),
    [categoryParts.parentLabel],
  );

  const errors = useMemo(() => {
    const parentGroup = categoryTree.find(
      (g) => g.parent.label === categoryParts.parentLabel,
    );
    return validateListingDraft(draft, {
      parentCategoryLabel: categoryParts.parentLabel,
      subcategoryLabel: categoryParts.subcategoryLabel,
      parentHasChildren: !!parentGroup && parentGroup.children.length > 0,
    });
  }, [draft, categoryParts, categoryTree]);

  const canSubmit = Object.keys(errors).length === 0;

  // Reset the cached AI verdict whenever the user edits any relevant field —
  // the merchant should never see stale feedback about text they've since
  // rewritten.
  useEffect(() => {
    setAiCheck(null);
  }, [draft.title, draft.description, draft.category, draft.image_urls.length]);

  async function runQualityCheck() {
    if (aiChecking) return;
    if (!draft.title.trim() || !draft.description.trim()) {
      toast.error("Add a title and description before running the AI check.");
      return;
    }
    setAiChecking(true);
    try {
      const result = await checkListingQuality({
        title: draft.title.trim(),
        description: draft.description.trim(),
        image_urls: draft.image_urls,
        category: draft.category || null,
      });
      setAiCheck(result);
      if (result.ok) {
        toast.success("AI review passed", { description: result.feedback });
      } else {
        toast.warning("AI review found issues", { description: result.feedback });
      }
    } catch (err) {
      toast.error("AI review failed", {
        description: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setAiChecking(false);
    }
  }

  function handleCancel() {
    if (saving) return;
    if (isDirty) {
      const ok = window.confirm("Discard your changes?");
      if (!ok) return;
    }
    if (sessionUploaded.length) {
      void deleteUploadThingFiles(sessionUploaded);
    }
    router.push(backUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    if (!canSubmit) {
      toast.error("Fix the required fields before saving.");
      return;
    }

    // Gate: the AI listing quality check must pass before we call the API.
    // If it hasn't been run for the current draft, run it now. If it comes
    // back with issues, block submission so bad listings never leave the
    // client.
    let verdict = aiCheck;
    if (verdict === null) {
      setAiChecking(true);
      try {
        verdict = await checkListingQuality({
          title: draft.title.trim(),
          description: draft.description.trim(),
          image_urls: draft.image_urls,
          category: draft.category || null,
        });
        setAiCheck(verdict);
      } catch (err) {
        setAiChecking(false);
        toast.error("AI review failed", {
          description:
            err instanceof Error
              ? err.message
              : "Try again in a moment.",
        });
        return;
      }
      setAiChecking(false);
    }

    if (!verdict.ok) {
      toast.error("Listing needs edits before it can be posted", {
        description: verdict.feedback,
      });
      return;
    }

    const price = parseAmount(draft.price_ugx);
    const salePrice = sale.kind === "ok" ? parseAmount(draft.sale_price) : null;
    const meta = cleanListingMeta(
      draft.kind,
      draft.meta,
      categoryParts.parentLabel,
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
      item_type: listingKindToItemType(draft.kind),
      listing_meta: meta,
    };
    if (draft.kind === "product" && draft.stock_quantity.trim()) {
      body.stock_quantity = Math.max(0, parseInt(draft.stock_quantity, 10) || 0);
    }

    setSaving(true);
    const label = mode === "add" ? `Adding ${LISTING_KIND_LABEL[draft.kind].toLowerCase()}` : "Saving changes";
    const done =
      mode === "add"
        ? `${LISTING_KIND_LABEL[draft.kind]} added`
        : "Changes saved";
    const request =
      mode === "add"
        ? apiProducts.createProduct(shopId, body)
        : product
          ? apiProducts.updateProduct(product.id, body)
          : Promise.reject(new Error("Missing product"));
    toast.promise(request, {
      loading: `${label}…`,
      success: done,
      error: (err) =>
        err instanceof Error ? err.message : "Could not save. Try again.",
    });
    try {
      await request;
      if (sessionRemoved.length) {
        void deleteUploadThingFiles(sessionRemoved);
      }
      setSessionRemoved([]);
      setSessionUploaded([]);
      initialRef.current = draft;
      router.push(backUrl);
    } catch {
      /* toast handles error */
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(ev: BeforeUnloadEvent) {
      ev.preventDefault();
      ev.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const pageTitle =
    mode === "add"
      ? `Post a ${LISTING_KIND_LABEL[draft.kind].toLowerCase()}`
      : "Edit listing";

  return (
    <div className="mx-auto w-full space-y-6 px-3 pb-[calc(9rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 sm:pt-6 md:pb-32 md:max-w-none lg:px-8 xl:px-12">
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to listings
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {pageTitle}
          </h1>
          <p className="text-xs text-muted">
            Provide details, media, and pricing. All listings pass automated moderation before going live.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="dm-btn dm-btn-ghost dm-btn-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form-page"
            disabled={saving || aiChecking || Boolean(aiCheck && !aiCheck.ok)}
            title={
              aiCheck && !aiCheck.ok
                ? "AI review flagged issues — please edit the listing first."
                : undefined
            }
            className="dm-btn dm-btn-primary dm-btn-md gap-2"
          >
            <Check className="size-4" />
            {saving
              ? "Saving…"
              : aiChecking
                ? "Running AI review…"
                : mode === "add"
                  ? "Publish listing"
                  : "Save changes"}
          </button>
        </div>
      </div>

      <form
        id="product-form-page"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="space-y-6"
      >
        {/* Moderation status banner */}
        {mode === "edit" && product
          ? (() => {
              const rejected = product.status === "rejected";
              const pending = product.status === "pending_review";
              if (!rejected && !pending) return null;
              const notes = product.review_notes ?? "";
              const tone = rejected
                ? "border-[color:var(--error)]/40 bg-[color:var(--error)]/10 text-[color:var(--error)]"
                : "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-300";
              const Icon = rejected ? AlertTriangle : Clock;
              const heading = rejected
                ? "Not approved by moderation"
                : notes
                  ? "Under review"
                  : "Reviewing your listing";
              const body = notes
                ? notes
                : "Automated checks usually finish within a minute. Your listing goes live automatically once approved.";
              const hint = rejected
                ? "Fix the flagged content below and save — it re-enters the queue automatically."
                : notes
                  ? "Edit the title, description, or photos and save — it will be re-reviewed automatically."
                  : null;
              return (
                <div
                  role="status"
                  className={`flex gap-3 rounded-2xl border p-4 text-sm shadow-xs ${tone}`}
                >
                  <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-bold text-base">{heading}</p>
                    <p className="text-xs leading-relaxed opacity-95">{body}</p>
                    {hint ? <p className="text-xs opacity-80 font-medium">{hint}</p> : null}
                  </div>
                </div>
              );
            })()
          : null}

        {/* Card 1: Listing type */}
        <section className="dm-card p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">1. Listing Type</h2>
            <p className="text-xs text-muted">Choose what type of offering you are posting to Midora.</p>
          </div>

          {allowTypePick ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {LISTING_KIND_OPTIONS.map((opt) => {
                const active = draft.kind === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        kind: opt.value,
                        category: "",
                        meta: {},
                      }))
                    }
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-accent bg-accent/10 ring-2 ring-accent/30 shadow-xs"
                        : "border-border bg-surface hover:border-accent/40"
                    }`}
                  >
                    <span className="block text-base font-bold text-foreground">
                      {opt.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs font-semibold text-foreground bg-surface-subtle border border-border px-3 py-2 rounded-xl inline-block">
              Listing Kind: {LISTING_KIND_LABEL[draft.kind]}
            </p>
          )}
        </section>

        {/* Card 2: Basic Info (Title & Description) */}
        <section className="dm-card p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">2. Listing Details</h2>
            <p className="text-xs text-muted">Write a clear title and detailed description for buyers.</p>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="product-title" className="text-sm font-semibold text-foreground">
              Title <span className="text-[color:var(--error)]">*</span>
            </label>
            <input
              id="product-title"
              className="dm-input text-base font-medium"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder={
                draft.kind === "opportunity"
                  ? "e.g. Looking for a shop assistant in Kampala"
                  : draft.kind === "service"
                    ? "e.g. Home cleaning — same-day Kampala"
                    : "What are you selling?"
              }
              aria-invalid={showErrors && Boolean(errors.title)}
              required
            />
            {showErrors && errors.title ? (
              <p className="text-xs text-[color:var(--error)]">{errors.title}</p>
            ) : null}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="product-description"
              className="text-sm font-semibold text-foreground"
            >
              Description <span className="text-[color:var(--error)]">*</span>
            </label>
            <textarea
              id="product-description"
              className="dm-textarea text-sm"
              rows={5}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Write at least two clear sentences. Include condition, what’s included, location, or requirements."
              aria-invalid={showErrors && Boolean(errors.description)}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted">
                Tip: Detailed descriptions receive 3x more buyer inquiries and higher search ranking.
              </p>
              <button
                type="button"
                onClick={() => void runQualityCheck()}
                disabled={aiChecking}
                className="dm-btn dm-btn-ghost dm-btn-sm gap-1.5 border border-accent/25 text-accent hover:bg-accent/5 disabled:opacity-60"
              >
                <Sparkles className="size-3.5" aria-hidden />
                {aiChecking ? "Running AI review…" : "Check quality with AI"}
              </button>
            </div>
            {showErrors && errors.description ? (
              <p className="text-xs text-[color:var(--error)]">{errors.description}</p>
            ) : null}

            {aiCheck ? (
              <div
                className={`mt-2 rounded-2xl border p-3 sm:p-4 ${
                  aiCheck.ok
                    ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/10"
                    : "border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Sparkles
                    className={`mt-0.5 size-4 shrink-0 ${
                      aiCheck.ok
                        ? "text-[color:var(--success)]"
                        : "text-[color:var(--warning)]"
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold text-foreground">
                        AI review — {aiCheck.score}/100
                      </p>
                      <QualityPill
                        label="Title vs images"
                        ok={aiCheck.title_matches && aiCheck.images_match}
                      />
                      <QualityPill
                        label={`Description: ${aiCheck.description_quality}`}
                        ok={aiCheck.description_quality !== "poor"}
                      />
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80">
                      {aiCheck.feedback}
                    </p>
                    {aiCheck.suggestions.length > 0 ? (
                      <ul className="space-y-1 pt-1 text-xs text-foreground/80">
                        {aiCheck.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Lightbulb
                              className="mt-0.5 size-3 shrink-0 text-accent"
                              aria-hidden
                            />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Card 3: Media Upload */}
        <section className="dm-card p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">3. Photos & Video</h2>
            <p className="text-xs text-muted">
              Drag and drop up to 10 photos or short videos. At least 1 photo is required.
            </p>
          </div>

          <MediaGridWrapper
            urls={draft.image_urls}
            onRemove={(index) => {
              const target = draft.image_urls[index];
              setDraft((d) => ({
                ...d,
                image_urls: d.image_urls.filter((_, i) => i !== index),
              }));
              if (target) {
                setSessionRemoved((prev) => [...prev, target]);
              }
            }}
            onImageUploaded={(url) => {
              setDraft((d) => ({
                ...d,
                image_urls: [...d.image_urls, url],
              }));
              setSessionUploaded((prev) => [...prev, url]);
            }}
            onVideoUploaded={(url) => {
              setDraft((d) => ({
                ...d,
                image_urls: [...d.image_urls, url],
              }));
              setSessionUploaded((prev) => [...prev, url]);
            }}
          />

          {showErrors && errors.images ? (
            <p className="text-xs text-[color:var(--error)]">{errors.images}</p>
          ) : null}
        </section>

        {/* Card 4: Pricing & Stock */}
        <section className="dm-card p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">4. Pricing & Inventory</h2>
            <p className="text-xs text-muted">Set price in UGX and manage discount options.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="product-price" className="text-sm font-semibold text-foreground">
                {draft.kind === "opportunity" ? "Budget / pay (UGX)" : "Price (UGX)"}
              </label>
              <input
                id="product-price"
                className="dm-input text-base font-semibold"
                inputMode="numeric"
                value={draft.price_ugx}
                onChange={(e) => setDraft((d) => ({ ...d, price_ugx: e.target.value }))}
                placeholder={draft.kind === "opportunity" ? "Optional — 0 if unpaid" : "50000"}
              />
            </div>

            {draft.kind !== "opportunity" ? (
              <div className="space-y-1.5">
                <label htmlFor="product-sale" className="text-sm font-semibold text-foreground">
                  Sale price <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="product-sale"
                  className="dm-input text-base font-semibold"
                  inputMode="numeric"
                  value={draft.sale_price}
                  onChange={(e) => setDraft((d) => ({ ...d, sale_price: e.target.value }))}
                  placeholder="e.g. 40000"
                />
                {sale.kind === "ok" ? (
                  <p className="text-xs font-semibold text-[color:var(--success)]">
                    Buyer sees {UGX.format(parseAmount(draft.sale_price) ?? 0)} — saves{" "}
                    {UGX.format(sale.savings)} ({sale.percent}% off)
                  </p>
                ) : sale.kind === "invalid" && (showErrors || draft.sale_price.trim()) ? (
                  <p className="text-xs text-[color:var(--error)]">{sale.message}</p>
                ) : (
                  <p className="text-xs text-muted">Leave blank for no discount.</p>
                )}
              </div>
            ) : null}
          </div>

          {draft.kind === "product" ? (
            <div className="space-y-1.5 sm:max-w-xs">
              <label htmlFor="product-stock" className="text-sm font-semibold text-foreground">
                Stock quantity
              </label>
              <input
                id="product-stock"
                className="dm-input"
                inputMode="numeric"
                value={draft.stock_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, stock_quantity: e.target.value }))}
                placeholder="10"
              />
            </div>
          ) : null}
        </section>

        {/* Card 5: Category */}
        <section className="dm-card p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">5. Category</h2>
            <p className="text-xs text-muted">
              {draft.kind === "product"
                ? "Assign a category so buyers can filter and discover your item."
                : draft.kind === "service"
                  ? `Category is set to Services based on your listing type. Pick a subcategory.`
                  : `Category is set to Opportunities based on your listing type. Pick a subcategory.`}
            </p>
          </div>

          <div className="space-y-1.5">
            <CategoryPicker
              value={draft.category}
              onChange={(category) => setDraft((d) => ({ ...d, category }))}
              required
              idPrefix="product-category-page"
              lockedParentSlug={
                draft.kind === "service"
                  ? "services"
                  : draft.kind === "opportunity"
                    ? "opportunities"
                    : undefined
              }
              excludeParentSlugs={
                draft.kind === "product" ? ["services", "opportunities"] : undefined
              }
            />
            {showErrors && errors.category ? (
              <p className="text-xs text-[color:var(--error)]">{errors.category}</p>
            ) : null}
          </div>
        </section>

        {/* Card 6: Additional Attributes */}
        <section className="dm-card p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">6. Additional Attributes</h2>
            <p className="text-xs text-muted">
              Extra metadata for this {LISTING_KIND_LABEL[draft.kind].toLowerCase()}
              {categoryParts.parentLabel ? ` · ${categoryParts.parentLabel}` : ""}
            </p>
          </div>

          {draft.kind === "product" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Condition <span className="text-[color:var(--error)]">*</span>
                </label>
                <select
                  className="dm-input"
                  value={draft.meta.condition ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      meta: {
                        ...d.meta,
                        condition: (e.target.value || undefined) as ListingMeta["condition"],
                      },
                    }))
                  }
                >
                  <option value="">Select condition…</option>
                  {CONDITION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {!catFields.some((f) => f.key === "brand") ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Brand</label>
                  <input
                    className="dm-input"
                    value={draft.meta.brand ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        meta: { ...d.meta, brand: e.target.value },
                      }))
                    }
                    placeholder="Optional (e.g. Samsung, Nike)"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {draft.kind === "service" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Pricing model <span className="text-[color:var(--error)]">*</span>
                </label>
                <select
                  className="dm-input"
                  value={draft.meta.pricing_model ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      meta: {
                        ...d.meta,
                        pricing_model: (e.target.value ||
                          undefined) as ListingMeta["pricing_model"],
                      },
                    }))
                  }
                >
                  <option value="">Select model…</option>
                  {PRICING_MODEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Availability</label>
                <input
                  className="dm-input"
                  value={draft.meta.availability ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      meta: { ...d.meta, availability: e.target.value },
                    }))
                  }
                  placeholder="e.g. Mon–Sat 9am–6pm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Service area</label>
                <input
                  className="dm-input"
                  value={draft.meta.service_area ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      meta: { ...d.meta, service_area: e.target.value },
                    }))
                  }
                  placeholder="e.g. Kampala & Wakiso"
                />
              </div>
            </div>
          ) : null}

          {draft.kind === "opportunity" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Opportunity type <span className="text-[color:var(--error)]">*</span>
                </label>
                <select
                  className="dm-input"
                  value={draft.meta.opportunity_kind ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      meta: {
                        ...d.meta,
                        opportunity_kind: (e.target.value ||
                          undefined) as ListingMeta["opportunity_kind"],
                      },
                    }))
                  }
                >
                  <option value="">Select type…</option>
                  {OPPORTUNITY_KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Compensation</label>
                <select
                  className="dm-input"
                  value={draft.meta.compensation ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      meta: {
                        ...d.meta,
                        compensation: (e.target.value ||
                          undefined) as ListingMeta["compensation"],
                      },
                    }))
                  }
                >
                  <option value="">Select compensation…</option>
                  {COMPENSATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {showErrors && errors.meta ? (
            <p className="text-xs text-[color:var(--error)]">{errors.meta}</p>
          ) : null}
        </section>
      </form>

      {/* Sticky action bar. On mobile it sits above the mobile BottomNav
          (h-14 + safe area). On md+ it hugs the bottom of the viewport. */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-modal border-t border-border bg-surface/95 p-3 shadow-lg backdrop-blur-md md:bottom-0">
        <div className="mx-auto flex w-full items-center justify-between gap-3 px-2 md:max-w-none lg:px-8 xl:px-12">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="dm-btn dm-btn-ghost dm-btn-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form-page"
            disabled={saving || aiChecking || Boolean(aiCheck && !aiCheck.ok)}
            title={
              aiCheck && !aiCheck.ok
                ? "AI review flagged issues — please edit the listing first."
                : undefined
            }
            className="dm-btn dm-btn-primary dm-btn-md min-w-[160px] gap-2 shadow-md"
          >
            <Check className="size-4" />
            {saving
              ? "Saving…"
              : aiChecking
                ? "Running AI review…"
                : mode === "add"
                  ? "Publish listing"
                  : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
