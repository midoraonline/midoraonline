"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock, Video as VideoIcon, X } from "lucide-react";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import {
  isVideoUrl,
  productImageUrls,
  type CreateProductRequest,
  type ItemType,
  type Product,
} from "@/lib/api/products";
import CategoryPicker from "@/components/CategoryPicker";
import FormModal from "@/components/FormModal";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { deleteUploadThingFiles } from "@/lib/uploadthing";
import { resolveCategoryParts } from "@/lib/categories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import {
  categoryMetaFields,
  cleanListingMeta,
  COMPENSATION_OPTIONS,
  CONDITION_OPTIONS,
  descriptionMeetsStandard,
  hasRequiredListingImage,
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

const UGX = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function parseAmount(v: string): number | null {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function MediaGrid({
  urls,
  onRemove,
}: {
  urls: string[];
  onRemove: (index: number) => void;
}) {
  if (!urls.length) return null;
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {urls.map((url, i) => {
        const video = isVideoUrl(url);
        return (
          <li
            key={`${url}-${i}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-subtle"
          >
            {video ? (
              <video
                src={url}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- CDN URLs
              <img src={url} alt="" className="h-full w-full object-cover" />
            )}
            {video ? (
              <span className="pointer-events-none absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                <VideoIcon className="size-2.5" aria-hidden="true" />
                Video
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity backdrop-blur-sm hover:bg-black/85 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Remove ${video ? "video" : "photo"}`}
            >
              <X className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type FormDraft = {
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

type SalePriceState =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; savings: number; percent: number };

function evaluateSalePrice(priceStr: string, saleStr: string): SalePriceState {
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

type FieldErrors = Partial<
  Record<"title" | "description" | "category" | "sale_price" | "images" | "meta", string>
>;

export default function ProductFormModal({
  mode,
  product,
  shopId,
  itemType,
  shopLogoUrl,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  product?: Product;
  shopId: string;
  /** Initial / locked kind when opened from a catalog tab. */
  itemType: ItemType;
  shopLogoUrl?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
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
  // Track media the user added *this session* (for cancel-cleanup) and
  // media they X-ed off the grid (for save-cleanup). UploadThing charges
  // for storage, so we reap orphaned files as soon as intent is clear.
  const [sessionUploaded, setSessionUploaded] = useState<string[]>([]);
  const [sessionRemoved, setSessionRemoved] = useState<string[]>([]);
  const { items: categoryItems, tree: categoryTree } = useCategoryItems();
  const initialRef = useRef(initialDraft);

  const isDirty = !draftsEqual(draft, initialRef.current);
  const sale = evaluateSalePrice(draft.price_ugx, draft.sale_price);
  const allowTypePick = mode === "add";

  const categoryParts = useMemo(
    () => resolveCategoryParts(draft.category, categoryItems),
    [draft.category, categoryItems],
  );
  const catFields = useMemo(
    () => categoryMetaFields(categoryParts.parentLabel),
    [categoryParts.parentLabel],
  );

  const errors = useMemo((): FieldErrors => {
    const e: FieldErrors = {};
    if (!draft.title.trim()) e.title = "Title is required.";
    const descCheck = descriptionMeetsStandard(draft.description);
    if (!descCheck.ok) e.description = descCheck.message;
    if (!hasRequiredListingImage(draft.image_urls, isVideoUrl)) {
      e.images = "Upload at least one photo (video alone is not enough).";
    }
    if (!draft.category.trim()) e.category = "Pick a category.";
    else {
      const parts = categoryParts;
      const parentGroup = categoryTree.find(
        (g) => g.parent.label === parts.parentLabel,
      );
      if (parentGroup && parentGroup.children.length > 0 && !parts.subcategoryLabel) {
        e.category = "Pick a subcategory.";
      }
    }
    if (sale.kind === "invalid") e.sale_price = sale.message;
    if (draft.kind === "product" && !draft.meta.condition) {
      e.meta = "Select product condition.";
    }
    if (draft.kind === "service" && !draft.meta.pricing_model) {
      e.meta = "Select how you price this service.";
    }
    if (draft.kind === "opportunity" && !draft.meta.opportunity_kind) {
      e.meta = "Select what kind of opportunity this is.";
    }
    for (const field of catFields) {
      if (!field.required) continue;
      const v = draft.meta[field.key];
      if (v == null || String(v).trim() === "") {
        e.meta = `${field.label} is required for this category.`;
        break;
      }
    }
    return e;
  }, [draft, sale, categoryParts, categoryTree, catFields]);

  const canSubmit = Object.keys(errors).length === 0;

  function handleClose() {
    if (saving) return;
    if (isDirty) {
      const ok =
        typeof window === "undefined"
          ? true
          : window.confirm("Discard your changes?");
      if (!ok) return;
    }
    // Any media the user uploaded this session but never saved is now
    // orphaned — drop it from UploadThing. Persisted media (sessionRemoved)
    // is left alone because the DB row still points at it.
    if (sessionUploaded.length) {
      void deleteUploadThingFiles(sessionUploaded);
    }
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    if (!canSubmit) {
      toast.error("Fix the required fields before saving.");
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
      // Save succeeded → media the user X-ed off is truly gone.
      // Session-uploaded media that survived the save is now persisted,
      // so it stops being an orphan candidate.
      if (sessionRemoved.length) {
        void deleteUploadThingFiles(sessionRemoved);
      }
      setSessionRemoved([]);
      setSessionUploaded([]);
      initialRef.current = draft;
      onSaved();
    } catch {
      /* toast already */
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

  const modalTitle =
    mode === "add"
      ? `Add ${LISTING_KIND_LABEL[draft.kind].toLowerCase()}`
      : "Edit listing";

  return (
    <FormModal
      title={modalTitle}
      onClose={handleClose}
      maxWidthClass="sm:max-w-xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="dm-btn dm-btn-ghost dm-btn-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form-modal"
            disabled={saving}
            className="dm-btn dm-btn-primary"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      }
    >
      <form
        id="product-form-modal"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="space-y-5"
      >
        {/* Moderation status banner — covers three cases:
            1. rejected + notes  → explain why + how to fix
            2. pending_review + notes → reviewer flagged something, needs edit
            3. pending_review (no notes) → fresh submission, set expectation */}
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
                  className={`flex gap-3 rounded-xl border px-3 py-2.5 text-sm ${tone}`}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-semibold">{heading}</p>
                    <p className="text-xs leading-snug opacity-90">{body}</p>
                    {hint ? <p className="text-[11px] opacity-70">{hint}</p> : null}
                  </div>
                </div>
              );
            })()
          : null}

        {/* Listing type */}
        {allowTypePick ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              What are you posting? <span className="text-[color:var(--error)]">*</span>
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
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
                        meta: {},
                      }))
                    }
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                        : "border-border bg-surface hover:border-accent/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs font-medium text-muted">
            Type: {LISTING_KIND_LABEL[draft.kind]}
          </p>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="product-title" className="text-sm font-medium text-foreground">
            Title <span className="text-[color:var(--error)]">*</span>
          </label>
          <input
            id="product-title"
            className="dm-input"
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
            className="text-sm font-medium text-foreground"
          >
            Description <span className="text-[color:var(--error)]">*</span>
          </label>
          <textarea
            id="product-description"
            className="dm-textarea"
            rows={4}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Write at least two clear sentences. Include condition, what’s included, location, or requirements."
            aria-invalid={showErrors && Boolean(errors.description)}
          />
          <p className="text-[11px] text-muted">
            Tip: buyers trust listings with a real written description — not just a title.
          </p>
          {showErrors && errors.description ? (
            <p className="text-xs text-[color:var(--error)]">{errors.description}</p>
          ) : null}
        </div>

        {/* Price */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="product-price" className="text-sm font-medium text-foreground">
              {draft.kind === "opportunity" ? "Budget / pay (UGX)" : "Price (UGX)"}
            </label>
            <input
              id="product-price"
              className="dm-input"
              inputMode="numeric"
              value={draft.price_ugx}
              onChange={(e) => setDraft((d) => ({ ...d, price_ugx: e.target.value }))}
              placeholder={draft.kind === "opportunity" ? "Optional — 0 if unpaid" : "50000"}
            />
          </div>

          {draft.kind !== "opportunity" ? (
            <div className="space-y-1.5">
              <label htmlFor="product-sale" className="text-sm font-medium text-foreground">
                Sale price <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="product-sale"
                className="dm-input"
                inputMode="numeric"
                value={draft.sale_price}
                onChange={(e) => setDraft((d) => ({ ...d, sale_price: e.target.value }))}
                placeholder="e.g. 40000"
              />
              {sale.kind === "ok" ? (
                <p className="text-xs font-medium text-[color:var(--success)]">
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
          <div className="space-y-1.5 sm:max-w-[220px]">
            <label htmlFor="product-stock" className="text-sm font-medium text-foreground">
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

        {/* Category — before meta so category-specific fields can appear */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            Category &amp; subcategory <span className="text-[color:var(--error)]">*</span>
          </p>
          <div className="dm-card p-3 sm:p-4">
            <CategoryPicker
              value={draft.category}
              onChange={(category) => setDraft((d) => ({ ...d, category }))}
              required
              compact
              idPrefix="product-category"
            />
          </div>
          {showErrors && errors.category ? (
            <p className="text-xs text-[color:var(--error)]">{errors.category}</p>
          ) : null}
        </div>

        {/* More information — type + category metadata */}
        <div className="space-y-3 rounded-xl border border-border bg-surface-subtle/50 p-3 sm:p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">More information</p>
            <p className="mt-0.5 text-[11px] text-muted">
              Extra details for this {LISTING_KIND_LABEL[draft.kind].toLowerCase()}
              {categoryParts.parentLabel
                ? ` · ${categoryParts.parentLabel}`
                : ""}{" "}
              — shown to buyers and used for discovery.
            </p>
          </div>

          {draft.kind === "product" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
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
                  <option value="">Select…</option>
                  {CONDITION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {!catFields.some((f) => f.key === "brand") ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Brand</label>
                  <input
                    className="dm-input"
                    value={draft.meta.brand ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        meta: { ...d.meta, brand: e.target.value },
                      }))
                    }
                    placeholder="Optional"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {draft.kind === "service" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-foreground">
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
                  <option value="">Select…</option>
                  {PRICING_MODEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Availability</label>
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
                <label className="text-xs font-medium text-foreground">Service area</label>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
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
                  <option value="">Select…</option>
                  {OPPORTUNITY_KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Compensation</label>
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
                  <option value="">Select…</option>
                  {COMPENSATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Deadline</label>
                <input
                  type="date"
                  className="dm-input"
                  value={draft.meta.deadline ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      meta: { ...d.meta, deadline: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-foreground">Requirements</label>
                <textarea
                  className="dm-textarea"
                  rows={2}
                  value={draft.meta.requirements ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      meta: { ...d.meta, requirements: e.target.value },
                    }))
                  }
                  placeholder="Skills, experience, documents needed…"
                />
              </div>
            </div>
          ) : null}


          {catFields.length > 0 ? (
            <div className="grid gap-3 border-t border-border/70 pt-3 sm:grid-cols-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted sm:col-span-2">
                {categoryParts.parentLabel} details
              </p>
              {catFields.map((field) => {
                const value = draft.meta[field.key];
                const strVal = value == null ? "" : String(value);
                return (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {field.label}
                      {field.required ? (
                        <span className="text-[color:var(--error)]"> *</span>
                      ) : null}
                    </label>
                    {field.kind === "select" ? (
                      <select
                        className="dm-input"
                        value={strVal}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            meta: {
                              ...d.meta,
                              [field.key]: e.target.value || undefined,
                            },
                          }))
                        }
                      >
                        <option value="">Select…</option>
                        {(field.options ?? []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="dm-input"
                        value={strVal}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            meta: {
                              ...d.meta,
                              [field.key]: e.target.value,
                            },
                          }))
                        }
                        placeholder={field.placeholder ?? "Optional"}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {showErrors && errors.meta ? (
            <p className="text-xs text-[color:var(--error)]">{errors.meta}</p>
          ) : null}
        </div>

        {/* Media */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              Photos &amp; video <span className="text-[color:var(--error)]">*</span>
            </p>
            <p className="text-xs text-muted">
              {draft.image_urls.length
                ? `${draft.image_urls.length} attached`
                : "At least one photo required"}
            </p>
          </div>
          <div className="dm-card space-y-3 p-3 sm:p-4">
            <MediaGrid
              urls={draft.image_urls}
              onRemove={(i) =>
                setDraft((d) => {
                  const gone = d.image_urls[i];
                  if (gone) {
                    setSessionRemoved((prev) =>
                      prev.includes(gone) ? prev : [...prev, gone],
                    );
                  }
                  return {
                    ...d,
                    image_urls: d.image_urls.filter((_, j) => j !== i),
                  };
                })
              }
            />
            <div className="flex flex-wrap items-center gap-3">
              <ImageUpload
                endpoint="productImage"
                multiple
                label="Add photos"
                watermarkLogoUrl={shopLogoUrl}
                onUploadManyComplete={(newUrls) => {
                  setSessionUploaded((prev) => [...prev, ...newUrls]);
                  setDraft((d) => ({
                    ...d,
                    image_urls: [...d.image_urls, ...newUrls],
                  }));
                }}
              />
              <VideoUpload
                endpoint="productVideo"
                label="Add video"
                onUploadManyComplete={(newUrls) => {
                  setSessionUploaded((prev) => [...prev, ...newUrls]);
                  setDraft((d) => ({
                    ...d,
                    image_urls: [...d.image_urls, ...newUrls],
                  }));
                }}
              />
            </div>
            {showErrors && errors.images ? (
              <p className="text-xs text-[color:var(--error)]">{errors.images}</p>
            ) : (
              <p className="text-xs text-muted">
                Photos upload when you pick them. A cover photo is required to publish.
              </p>
            )}
          </div>
        </div>

        {/* Toggles */}
        <div className="grid gap-2 sm:grid-cols-2">
          {draft.kind !== "opportunity" ? (
            <label className="dm-card flex cursor-pointer items-center gap-3 px-3 py-2.5">
              <input
                type="checkbox"
                className="size-4 rounded border-border text-accent focus:ring-accent"
                checked={draft.is_negotiable}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, is_negotiable: e.target.checked }))
                }
              />
              <span className="text-sm font-medium text-foreground">
                Price is negotiable
              </span>
            </label>
          ) : null}
          <label className="dm-card flex cursor-pointer items-center gap-3 px-3 py-2.5">
            <input
              type="checkbox"
              className="size-4 rounded border-border text-accent focus:ring-accent"
              checked={draft.is_published}
              onChange={(e) =>
                setDraft((d) => ({ ...d, is_published: e.target.checked }))
              }
            />
            <span className="text-sm font-medium text-foreground">
              Published on storefront
            </span>
          </label>
        </div>
      </form>
    </FormModal>
  );
}
