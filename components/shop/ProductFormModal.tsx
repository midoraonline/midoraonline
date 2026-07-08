"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiProducts } from "@/lib/api";
import {
  productImageUrls,
  type CreateProductRequest,
  type ItemType,
  type Product,
} from "@/lib/api/products";
import CategoryPicker from "@/components/CategoryPicker";
import FormModal, {
  formFieldClass,
  formLabelClass,
  formTextareaClass,
} from "@/components/FormModal";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { X } from "lucide-react";

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
          className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"
        >
          <img src={url} alt="" className="h-full w-full object-cover" />
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
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 space-y-3 sm:p-4">
      <p className="text-xs font-semibold text-neutral-800">Photos &amp; videos</p>
      {urls.length > 0 ? (
        <MediaGrid urls={urls} onRemove={(i) => onChange(urls.filter((_, j) => j !== i))} />
      ) : (
        <p className="text-[11px] text-neutral-500">No media yet. Add at least one photo.</p>
      )}
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-neutral-600">Photos</p>
        <ImageUpload
          endpoint="productImage"
          multiple
          label="Add photos"
          watermarkLogoUrl={shopLogoUrl}
          onUploadManyComplete={(newUrls) => onChange([...urls, ...newUrls])}
        />
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-neutral-600">Video (optional)</p>
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
  is_negotiable: boolean;
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
    is_negotiable: true,
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
    is_negotiable: p.is_negotiable !== false,
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
    mode === "edit" && product ? productToDraft(product) : emptyDraft(),
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
    if (!draft.category.trim()) {
      setError("Please select a category and subcategory.");
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
        is_negotiable: draft.is_negotiable,
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

  const title = mode === "add" ? `Add ${itemType}` : "Edit listing";

  return (
    <FormModal
      title={title}
      onClose={onClose}
      maxWidthClass="sm:max-w-xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form-modal"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : mode === "add" ? (
              `Add ${itemType}`
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      }
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {saved ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
          <CheckCircle2 className="size-4 shrink-0" /> Saved!
        </div>
      ) : null}

      <form id="product-form-modal" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-1.5">
          <label className={formLabelClass}>
            Title <span className="text-red-500">*</span>
          </label>
          <input
            className={formFieldClass}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder={`What are you selling?`}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={formLabelClass}>Description</label>
          <textarea
            className={formTextareaClass}
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Describe condition, size, features, or what's included…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={formLabelClass}>Price (UGX)</label>
            <input
              className={formFieldClass}
              inputMode="numeric"
              value={draft.price_ugx}
              onChange={(e) => setDraft((d) => ({ ...d, price_ugx: e.target.value }))}
              placeholder="50000"
            />
          </div>

          <div className="space-y-1.5">
            <label className={formLabelClass}>
              Discount price{" "}
              <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              className={formFieldClass}
              inputMode="numeric"
              value={draft.discount_price}
              onChange={(e) => setDraft((d) => ({ ...d, discount_price: e.target.value }))}
              placeholder="40000"
            />
          </div>
        </div>

        {itemType === "product" ? (
          <div className="space-y-1.5 sm:max-w-[200px]">
            <label className={formLabelClass}>Stock quantity</label>
            <input
              className={formFieldClass}
              inputMode="numeric"
              value={draft.stock_quantity}
              onChange={(e) => setDraft((d) => ({ ...d, stock_quantity: e.target.value }))}
              placeholder="10"
            />
          </div>
        ) : null}

        <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
          <CategoryPicker
            value={draft.category}
            onChange={(category) => setDraft((d) => ({ ...d, category }))}
            required
            idPrefix="product-category"
          />
        </div>

        <MediaUploadSection
          urls={draft.image_urls}
          onChange={(next) => setDraft((d) => ({ ...d, image_urls: next }))}
          shopLogoUrl={shopLogoUrl}
        />

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2.5">
          <input
            type="checkbox"
            className="size-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
            checked={draft.is_negotiable}
            onChange={(e) => setDraft((d) => ({ ...d, is_negotiable: e.target.checked }))}
          />
          <span className="text-sm font-medium text-neutral-800">Price is negotiable</span>
        </label>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2.5">
          <input
            type="checkbox"
            className="size-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
            checked={draft.is_published}
            onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.checked }))}
          />
          <span className="text-sm font-medium text-neutral-800">Published on storefront</span>
        </label>
      </form>
    </FormModal>
  );
}
