"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { apiProducts } from "@/lib/api";
import {
  isVideoUrl,
  productImageUrls,
  productPrimaryImage,
  productPriceUgx,
  type CreateProductRequest,
  type ItemType,
  type Product,
} from "@/lib/api/products";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { useAppSession } from "@/lib/state";

function formatUGX(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Media grid ───────────────────────────────────────────────────────────────
// Shared between the add-new form and the inline edit panel.

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
      {urls.map((url, i) => {
        const isVid = isVideoUrl(url);
        return (
          <li
            key={`${url}-${i}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-foreground/[0.04]"
          >
            {isVid ? (
              <video
                src={url}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
            ) : (
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="120px"
                unoptimized
              />
            )}
            {/* badges */}
            {isVid && (
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold uppercase text-white backdrop-blur-sm">
                vid
              </span>
            )}
            {i === 0 && !isVid && (
              <span className="absolute left-1 bottom-1 rounded bg-black/55 px-1 py-0.5 text-[9px] font-semibold uppercase text-white backdrop-blur-sm">
                cover
              </span>
            )}
            {/* remove */}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity backdrop-blur-sm hover:bg-black/85 group-hover:opacity-100 dm-focus focus-visible:opacity-100"
              aria-label="Remove"
              title="Remove"
            >
              <X className="size-3.5" strokeWidth={2.5} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Media upload section ─────────────────────────────────────────────────────
// Stacks image + video uploaders vertically so each review panel has full
// width.  Background removal is enabled for product images so users can strip
// cluttered backgrounds before uploading.

function MediaUploadSection({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] p-3 space-y-3">
      <div className="flex items-center gap-2">
        <ImagePlus className="size-4 text-muted" />
        <p className="text-xs font-semibold text-foreground/80">Photos &amp; videos</p>
      </div>

      {/* Uploaded thumbnail grid */}
      {urls.length > 0 ? (
        <MediaGrid urls={urls} onRemove={(i) => onChange(urls.filter((_, j) => j !== i))} />
      ) : (
        <p className="text-[11px] text-muted">
          No media yet — upload photos or a short video below.
        </p>
      )}

      {/* Image uploader — bg removal review panel shown before upload */}
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-foreground/60">Photos</p>
        <ImageUpload
          endpoint="productImage"
          multiple
          label="Add photos"
          onUploadManyComplete={(newUrls) => onChange([...urls, ...newUrls])}
        />
      </div>

      {/* Video uploader — compresses in-browser then uploads */}
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

// ─── Inline edit form ─────────────────────────────────────────────────────────

type EditDraft = {
  title: string;
  description: string;
  price_ugx: string;
  stock_quantity: string;
  category: string;
  image_urls: string[];
  is_published: boolean;
};

function productToEditDraft(p: Product): EditDraft {
  return {
    title: p.title ?? "",
    description: p.description ?? "",
    price_ugx:
      p.price_ugx != null
        ? String(p.price_ugx)
        : p.price != null
          ? String(p.price)
          : "",
    stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : "",
    category: p.category ?? "",
    image_urls: productImageUrls(p),
    is_published: p.is_published ?? true,
  };
}

function EditPanel({
  product,
  itemType,
  onSaved,
  onCancel,
}: {
  product: Product;
  itemType: ItemType;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<EditDraft>(() => productToEditDraft(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const price = Number(draft.price_ugx.replace(/,/g, ""));
      const body: Partial<CreateProductRequest> = {
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        price_ugx: Number.isFinite(price) && price >= 0 ? price : undefined,
        category: draft.category.trim() || undefined,
        image_urls: draft.image_urls.length ? [...draft.image_urls] : undefined,
        is_published: draft.is_published,
      };
      if (itemType === "product" && draft.stock_quantity.trim()) {
        body.stock_quantity = Math.max(0, parseInt(draft.stock_quantity, 10) || 0);
      }
      await apiProducts.updateProduct(product.id, body);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSave(e)}
      className="border-t border-foreground/[0.07] bg-foreground/[0.02] p-4 space-y-4 sm:p-5"
    >
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300">
          <CheckCircle2 className="size-4 shrink-0" /> Saved!
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-foreground/70">Title *</label>
          <input
            className="dm-input-xs dm-focus"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-foreground/70">Description</label>
          <textarea
            className="dm-textarea-xs dm-focus"
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </div>
        <div className={`space-y-1 ${itemType === "service" ? "sm:col-span-2" : ""}`}>
          <label className="text-[11px] font-medium text-foreground/70">Price (UGX)</label>
          <input
            className="dm-input-xs dm-focus"
            inputMode="numeric"
            value={draft.price_ugx}
            onChange={(e) => setDraft((d) => ({ ...d, price_ugx: e.target.value }))}
            placeholder="5000"
          />
        </div>
        {itemType === "product" && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground/70">Stock quantity</label>
            <input
              className="dm-input-xs dm-focus"
              inputMode="numeric"
              value={draft.stock_quantity}
              onChange={(e) => setDraft((d) => ({ ...d, stock_quantity: e.target.value }))}
              placeholder="10"
            />
          </div>
        )}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-foreground/70">Category</label>
          <input
            className="dm-input-xs dm-focus"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            placeholder="e.g. Drinks"
          />
        </div>

        {/* Media */}
        <div className="sm:col-span-2">
          <label className="mb-2 block text-[11px] font-medium text-foreground/70">
            Photos &amp; videos
          </label>
          <MediaUploadSection
            urls={draft.image_urls}
            onChange={(next) => setDraft((d) => ({ ...d, image_urls: next }))}
          />
        </div>

        {/* Published */}
        <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={draft.is_published}
            onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.checked }))}
          />
          <span className="text-[11px] font-medium text-foreground/85">
            Published on storefront
          </span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground dm-focus"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="dm-pill dm-focus inline-flex items-center gap-1.5 bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type AddDraft = {
  title: string;
  description: string;
  price_ugx: string;
  stock_quantity: string;
  category: string;
  image_urls: string[];
  is_published: boolean;
};

const EMPTY_DRAFT: AddDraft = {
  title: "",
  description: "",
  price_ugx: "",
  stock_quantity: "",
  category: "",
  image_urls: [],
  is_published: true,
};

export default function ShopCatalogEditor({
  shopId,
  itemType,
  heading,
}: {
  shopId: string;
  itemType: ItemType;
  heading: string;
}) {
  const session = useAppSession();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AddDraft>(EMPTY_DRAFT);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const isAuthed = session.isAuthenticated;
  const hydrated = session.hydrated;

  const load = useCallback(async () => {
    if (!isAuthed) return;
    setLoading(true);
    try {
      const { items: all } = await apiProducts.listShopProducts(shopId);
      setItems(all.filter((p) => (p.item_type ?? "product") === itemType));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [shopId, itemType, isAuthed]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthed || !draft.title.trim()) {
      if (!draft.title.trim()) setError("Title is required.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const price = Number(draft.price_ugx.replace(/,/g, ""));
      const body: CreateProductRequest = {
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        price_ugx: Number.isFinite(price) && price >= 0 ? price : undefined,
        category: draft.category.trim() || undefined,
        item_type: itemType,
        image_urls: draft.image_urls.length ? [...draft.image_urls] : undefined,
        is_published: draft.is_published,
      };
      if (itemType === "product" && draft.stock_quantity.trim()) {
        body.stock_quantity = Math.max(0, parseInt(draft.stock_quantity, 10) || 0);
      }
      await apiProducts.createProduct(shopId, body);
      setDraft(EMPTY_DRAFT);
      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create listing.");
    } finally {
      setCreating(false);
    }
  }

  async function removeProduct(id: string) {
    if (!isAuthed) return;
    if (!window.confirm("Remove this listing? This cannot be undone.")) return;
    setError(null);
    try {
      await apiProducts.deleteProduct(id);
      if (expandedId === id) setExpandedId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  async function togglePublish(p: Product) {
    if (!isAuthed) return;
    setError(null);
    try {
      await apiProducts.updateProduct(p.id, { is_published: !p.is_published });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  // ── Loading / auth states ────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="dm-card flex items-center gap-3 p-5 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="dm-card p-5 text-sm text-muted">
        Sign in to manage {itemType === "service" ? "services" : "products"}.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div>
        <h2 className="text-base font-semibold tracking-tight">{heading}</h2>
        <p className="mt-1 text-xs text-muted">
          Tap <strong>Edit</strong> on any listing to change its details, photos, or videos.
        </p>
      </div>

      {/* Global error */}
      {error && (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40">
          {error}
        </p>
      )}

      {/* ── Add-new card ── */}
      <form
        onSubmit={(e) => void handleCreate(e)}
        className="dm-card space-y-4 p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground/90">
            Add new {itemType}
          </p>
          {createSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-4" /> Added!
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Title */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className="dm-input-xs dm-focus"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder={itemType === "service" ? "e.g. Home visit consult" : "e.g. Espresso"}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">Description</label>
            <textarea
              className="dm-textarea-xs dm-focus min-h-[72px]"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="What buyers should know"
            />
          </div>

          {/* Price */}
          <div className={`space-y-1.5 ${itemType === "service" ? "sm:col-span-2" : ""}`}>
            <label className="text-xs font-medium text-foreground/80">Price (UGX)</label>
            <input
              className="dm-input-xs dm-focus"
              inputMode="numeric"
              value={draft.price_ugx}
              onChange={(e) => setDraft((d) => ({ ...d, price_ugx: e.target.value }))}
              placeholder="5000"
            />
          </div>

          {/* Stock */}
          {itemType === "product" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Stock quantity</label>
              <input
                className="dm-input-xs dm-focus"
                inputMode="numeric"
                value={draft.stock_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, stock_quantity: e.target.value }))}
                placeholder="10"
              />
            </div>
          )}

          {/* Category */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">Category</label>
            <input
              className="dm-input-xs dm-focus"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              placeholder="e.g. Drinks"
            />
          </div>

          {/* Media — full-width, stacked uploaders */}
          <div className="sm:col-span-2">
            <MediaUploadSection
              urls={draft.image_urls}
              onChange={(next) => setDraft((d) => ({ ...d, image_urls: next }))}
            />
          </div>

          {/* Published */}
          <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
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
        </div>

        <button
          type="submit"
          disabled={creating}
          className="dm-pill dm-focus inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
        >
          {creating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Adding…
            </>
          ) : (
            `Add ${itemType === "service" ? "service" : "product"}`
          )}
        </button>
      </form>

      {/* ── Existing listings ── */}
      <div>
        <p className="text-sm font-semibold text-foreground/90">
          Your {itemType === "service" ? "services" : "products"}
        </p>
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nothing here yet — add one above.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((p) => {
              const img = productPrimaryImage(p);
              const isOpen = expandedId === p.id;
              const mediaCount = productImageUrls(p).length;
              return (
                <li key={p.id} className="dm-card overflow-hidden">
                  {/* Row */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Thumbnail */}
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-foreground/[0.04] sm:size-16">
                      {img ? (
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <ImagePlus className="size-5 text-muted/50" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground/95">
                        {p.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatUGX(productPriceUgx(p))}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {p.is_published ? (
                          <span className="text-green-700 dark:text-green-400">Published</span>
                        ) : (
                          "Draft"
                        )}
                        {" · "}
                        {p.view_count ?? 0} views
                        {mediaCount > 0 && ` · ${mediaCount} media`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : p.id)}
                        aria-expanded={isOpen}
                        className={[
                          "dm-focus inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors",
                          isOpen
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/65 hover:bg-foreground/[0.06] hover:text-foreground",
                        ].join(" ")}
                        title={isOpen ? "Close editor" : "Edit listing"}
                      >
                        {isOpen ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <Pencil className="size-3.5" />
                        )}
                        <span className="hidden sm:inline">{isOpen ? "Close" : "Edit"}</span>
                      </button>

                      <button
                        type="button"
                        className="dm-focus inline-flex size-9 items-center justify-center rounded-xl text-foreground/65 hover:bg-foreground/[0.06]"
                        title={p.is_published ? "Unpublish" : "Publish"}
                        onClick={() => void togglePublish(p)}
                      >
                        {p.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>

                      <button
                        type="button"
                        className="dm-focus inline-flex size-9 items-center justify-center rounded-xl text-red-600/80 hover:bg-red-500/10"
                        title="Delete"
                        onClick={() => void removeProduct(p.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline edit panel */}
                  {isOpen && (
                    <EditPanel
                      product={p}
                      itemType={itemType}
                      onSaved={async () => {
                        setExpandedId(null);
                        await load();
                      }}
                      onCancel={() => setExpandedId(null)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
