"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Video as VideoIcon, X } from "lucide-react";
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
import { resolveCategoryParts } from "@/lib/categories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";

// ── Currency helpers ─────────────────────────────────────────────────────────
const UGX = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function parseAmount(v: string): number | null {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// ── Media grid tile ──────────────────────────────────────────────────────────
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

// ── Draft state ──────────────────────────────────────────────────────────────
type FormDraft = {
  title: string;
  description: string;
  price_ugx: string;
  sale_price: string; // Final price after discount (never a percentage)
  stock_quantity: string;
  category: string;
  image_urls: string[];
  is_published: boolean;
  is_negotiable: boolean;
};

function emptyDraft(): FormDraft {
  return {
    title: "",
    description: "",
    price_ugx: "",
    sale_price: "",
    stock_quantity: "",
    category: "",
    image_urls: [],
    is_published: true,
    is_negotiable: true,
  };
}

function productToDraft(p: Product): FormDraft {
  return {
    title: p.title ?? "",
    description: p.description ?? "",
    price_ugx: p.price_ugx != null ? String(p.price_ugx) : "",
    sale_price: p.discount_price != null ? String(p.discount_price) : "",
    stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : "",
    category: p.category ?? "",
    image_urls: productImageUrls(p),
    is_published: p.is_published ?? true,
    is_negotiable: p.is_negotiable !== false,
  };
}

function draftsEqual(a: FormDraft, b: FormDraft): boolean {
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.price_ugx === b.price_ugx &&
    a.sale_price === b.sale_price &&
    a.stock_quantity === b.stock_quantity &&
    a.category === b.category &&
    a.is_published === b.is_published &&
    a.is_negotiable === b.is_negotiable &&
    a.image_urls.length === b.image_urls.length &&
    a.image_urls.every((u, i) => u === b.image_urls[i])
  );
}

// ── Sale price helper ────────────────────────────────────────────────────────
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

// ── Main component ──────────────────────────────────────────────────────────
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
  itemType: ItemType;
  shopLogoUrl?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialDraft = useMemo(
    () => (mode === "edit" && product ? productToDraft(product) : emptyDraft()),
    [mode, product],
  );
  const [draft, setDraft] = useState<FormDraft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const { items: categoryItems, tree: categoryTree } = useCategoryItems();
  const initialRef = useRef(initialDraft);

  const isDirty = !draftsEqual(draft, initialRef.current);
  const sale = evaluateSalePrice(draft.price_ugx, draft.sale_price);

  // Field-level validation surfaced only after a submit attempt.
  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormDraft, string>> = {};
    if (!draft.title.trim()) e.title = "Title is required.";
    if (!draft.category.trim()) e.category = "Pick a category.";
    else {
      const parts = resolveCategoryParts(draft.category, categoryItems);
      const parentGroup = categoryTree.find(
        (g) => g.parent.label === parts.parentLabel,
      );
      if (parentGroup && parentGroup.children.length > 0 && !parts.subcategoryLabel) {
        e.category = "Pick a subcategory.";
      }
    }
    if (sale.kind === "invalid") e.sale_price = sale.message;
    return e;
  }, [draft, sale, categoryItems, categoryTree]);

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
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    if (!canSubmit) return;

    const price = parseAmount(draft.price_ugx);
    const salePrice = sale.kind === "ok" ? parseAmount(draft.sale_price) : null;

    const body: CreateProductRequest = {
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      price_ugx: price ?? undefined,
      discount_price: salePrice ?? undefined,
      category: draft.category.trim() || undefined,
      image_urls: draft.image_urls.length ? [...draft.image_urls] : undefined,
      is_published: draft.is_published,
      is_negotiable: draft.is_negotiable,
    };
    if (mode === "add") body.item_type = itemType;
    if (itemType === "product" && draft.stock_quantity.trim()) {
      body.stock_quantity = Math.max(0, parseInt(draft.stock_quantity, 10) || 0);
    }

    setSaving(true);
    const label = mode === "add" ? `Adding ${itemType}` : "Saving changes";
    const done = mode === "add" ? `${itemType} added` : "Changes saved";
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
      initialRef.current = draft;
      onSaved();
    } catch {
      // Sonner already surfaced the error.
    } finally {
      setSaving(false);
    }
  }

  // Warn on hard navigation / refresh while dirty.
  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const title = mode === "add" ? `Add ${itemType}` : "Edit listing";
  const errorId = (field: keyof FormDraft) =>
    showErrors && errors[field] ? `product-error-${field}` : undefined;

  return (
    <FormModal
      title={title}
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
            {saving ? "Saving…" : mode === "add" ? `Add ${itemType}` : "Save changes"}
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
            placeholder="What are you selling?"
            aria-invalid={showErrors && Boolean(errors.title)}
            aria-describedby={errorId("title")}
            required
          />
          {showErrors && errors.title ? (
            <p id={errorId("title")} className="text-xs text-[color:var(--error)]">
              {errors.title}
            </p>
          ) : null}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label
            htmlFor="product-description"
            className="text-sm font-medium text-foreground"
          >
            Description
          </label>
          <textarea
            id="product-description"
            className="dm-textarea"
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Condition, size, features, what's included…"
          />
        </div>

        {/* Price + Sale price */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="product-price" className="text-sm font-medium text-foreground">
              Price (UGX)
            </label>
            <input
              id="product-price"
              className="dm-input"
              inputMode="numeric"
              value={draft.price_ugx}
              onChange={(e) => setDraft((d) => ({ ...d, price_ugx: e.target.value }))}
              placeholder="50000"
            />
            <p className="text-xs text-muted">The regular listing price.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="product-sale" className="text-sm font-medium text-foreground">
              Sale price{" "}
              <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="product-sale"
              className="dm-input"
              inputMode="numeric"
              value={draft.sale_price}
              onChange={(e) => setDraft((d) => ({ ...d, sale_price: e.target.value }))}
              placeholder="e.g. 40000"
              aria-invalid={showErrors && Boolean(errors.sale_price)}
              aria-describedby={errorId("sale_price")}
            />
            {sale.kind === "ok" ? (
              <p className="text-xs font-medium text-[color:var(--success)]">
                Buyer sees {UGX.format(parseAmount(draft.sale_price) ?? 0)} — saves{" "}
                {UGX.format(sale.savings)} ({sale.percent}% off)
              </p>
            ) : sale.kind === "invalid" && (showErrors || draft.sale_price.trim()) ? (
              <p
                id={errorId("sale_price")}
                className="text-xs text-[color:var(--error)]"
              >
                {sale.message}
              </p>
            ) : (
              <p className="text-xs text-muted">
                What the buyer actually pays. Leave blank for no discount.
              </p>
            )}
          </div>
        </div>

        {itemType === "product" ? (
          <div className="space-y-1.5 sm:max-w-[220px]">
            <label
              htmlFor="product-stock"
              className="text-sm font-medium text-foreground"
            >
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

        {/* Category */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            Category &amp; subcategory{" "}
            <span className="text-[color:var(--error)]">*</span>
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

        {/* Media */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-foreground">Photos &amp; video</p>
            <p className="text-xs text-muted">
              {draft.image_urls.length
                ? `${draft.image_urls.length} attached`
                : "Add at least one photo"}
            </p>
          </div>
          <div className="dm-card space-y-3 p-3 sm:p-4">
            <MediaGrid
              urls={draft.image_urls}
              onRemove={(i) =>
                setDraft((d) => ({
                  ...d,
                  image_urls: d.image_urls.filter((_, j) => j !== i),
                }))
              }
            />
            <div className="flex flex-wrap items-center gap-3">
              <ImageUpload
                endpoint="productImage"
                multiple
                label="Add photos"
                watermarkLogoUrl={shopLogoUrl}
                onUploadManyComplete={(newUrls) =>
                  setDraft((d) => ({
                    ...d,
                    image_urls: [...d.image_urls, ...newUrls],
                  }))
                }
              />
              <VideoUpload
                endpoint="productVideo"
                label="Add video"
                onUploadManyComplete={(newUrls) =>
                  setDraft((d) => ({
                    ...d,
                    image_urls: [...d.image_urls, ...newUrls],
                  }))
                }
              />
            </div>
            <p className="text-xs text-muted">
              Photos upload the moment you pick them. Videos are compressed in your
              browser, then upload automatically.
            </p>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid gap-2 sm:grid-cols-2">
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
