"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { apiProducts } from "@/lib/api";
import {
  productImageUrls,
  type CreateProductRequest,
  type ItemType,
  type Product,
} from "@/lib/api/products";
import CategorySelect from "@/components/CategorySelect";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";

function MediaGrid({
  urls,
  onRemove,
}: {
  urls: string[];
  onRemove: (index: number) => void;
}) {
  if (!urls.length) return null;
  return (
    <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {urls.map((url, i) => (
        <li
          key={`${url}-${i}`}
          className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-foreground/[0.04]"
        >
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity backdrop-blur-sm hover:bg-black/85 group-hover:opacity-100"
            aria-label="Remove"
          >
            <X className="size-3.5" strokeWidth={2.5} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function MediaUploadSection({
  urls,
  onChange,
  shopLogoUrl,
}: {
  urls: string[];
  onChange: (next: string[]) => void;
  shopLogoUrl?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] p-3 space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-foreground/80">Photos &amp; videos</p>
      </div>
      {urls.length > 0 ? (
        <MediaGrid urls={urls} onRemove={(i) => onChange(urls.filter((_, j) => j !== i))} />
      ) : (
        <p className="text-[11px] text-muted">No media yet.</p>
      )}
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-foreground/60">Photos</p>
        <ImageUpload
          endpoint="productImage"
          multiple
          label="Add photos"
          watermarkLogoUrl={shopLogoUrl}
          onUploadManyComplete={(newUrls) => onChange([...urls, ...newUrls])}
        />
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-foreground/60">Video (optional)</p>
        <VideoUpload
          endpoint="productVideo"
          label="Add video"
          onUploadManyComplete={(newUrls) => onChange([...urls, ...newUrls])}
        />
      </div>
    </div>
  );
}

type FormDraft = {
  title: string;
  description: string;
  price_ugx: string;
  discount_price: string;
  stock_quantity: string;
  category: string;
  image_urls: string[];
  is_published: boolean;
};

function emptyDraft(): FormDraft {
  return {
    title: "",
    description: "",
    price_ugx: "",
    discount_price: "",
    stock_quantity: "",
    category: "",
    image_urls: [],
    is_published: true,
  };
}

function productToDraft(p: Product): FormDraft {
  return {
    title: p.title ?? "",
    description: p.description ?? "",
    price_ugx: p.price_ugx != null ? String(p.price_ugx) : "",
    discount_price: p.discount_price != null ? String(p.discount_price) : "",
    stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : "",
    category: p.category ?? "",
    image_urls: productImageUrls(p),
    is_published: p.is_published ?? true,
  };
}

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
  const [draft, setDraft] = useState<FormDraft>(() =>
    mode === "edit" && product ? productToDraft(product) : emptyDraft()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const price = Number(draft.price_ugx.replace(/,/g, ""));
      const body: CreateProductRequest = {
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        price_ugx: Number.isFinite(price) && price >= 0 ? price : undefined,
        discount_price: draft.discount_price.trim()
          ? Number(draft.discount_price.replace(/,/g, ""))
          : undefined,
        category: draft.category.trim() || undefined,
        image_urls: draft.image_urls.length ? [...draft.image_urls] : undefined,
        is_published: draft.is_published,
      };
      if (mode === "add") {
        body.item_type = itemType;
      }
      if (itemType === "product" && draft.stock_quantity.trim()) {
        body.stock_quantity = Math.max(0, parseInt(draft.stock_quantity, 10) || 0);
      }

      if (mode === "add") {
        await apiProducts.createProduct(shopId, body);
      } else if (product) {
        await apiProducts.updateProduct(product.id, body);
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {mode === "add" ? `Add ${itemType}` : "Edit listing"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="dm-focus flex size-8 items-center justify-center rounded-xl hover:bg-foreground/[0.06]"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        )}

        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300">
            <CheckCircle2 className="size-4 shrink-0" /> Saved!
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/80">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className="dm-input-xs dm-focus w-full"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/80">Description</label>
            <textarea
              className="dm-textarea-xs dm-focus w-full min-h-[72px]"
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </div>

          <div className={`space-y-1 ${itemType === "service" ? "" : ""}`}>
            <label className="text-xs font-medium text-foreground/80">Price (UGX)</label>
            <input
              className="dm-input-xs dm-focus w-full"
              inputMode="numeric"
              value={draft.price_ugx}
              onChange={(e) => setDraft((d) => ({ ...d, price_ugx: e.target.value }))}
              placeholder="5000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/80">
              Discount price (UGX){" "}
              <span className="font-normal text-muted">— optional, leave empty for no discount</span>
            </label>
            <input
              className="dm-input-xs dm-focus w-full"
              inputMode="numeric"
              value={draft.discount_price}
              onChange={(e) => setDraft((d) => ({ ...d, discount_price: e.target.value }))}
              placeholder="4000"
            />
          </div>

          {itemType === "product" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground/80">Stock quantity</label>
              <input
                className="dm-input-xs dm-focus w-full"
                inputMode="numeric"
                value={draft.stock_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, stock_quantity: e.target.value }))}
                placeholder="10"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/80">Category</label>
            <CategorySelect
              value={draft.category}
              onChange={(category) => setDraft((d) => ({ ...d, category }))}
            />
          </div>

          <MediaUploadSection
            urls={draft.image_urls}
            onChange={(next) => setDraft((d) => ({ ...d, image_urls: next }))}
            shopLogoUrl={shopLogoUrl}
          />

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={draft.is_published}
              onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.checked }))}
            />
            <span className="text-xs font-medium text-foreground/85">
              Published on storefront
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="dm-focus inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : mode === "add" ? (
                `Add ${itemType}`
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
