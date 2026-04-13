"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Trash2, X } from "lucide-react";
import { apiProducts } from "@/lib/api";
import {
  productPrimaryImage,
  productPriceUgx,
  type CreateProductRequest,
  type ItemType,
  type Product,
} from "@/lib/api/products";
import { ImageUpload } from "@/components/image-upload";
import { useAppSession } from "@/lib/state";

function formatUGX(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
}

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
  const token = session.token;

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    price_ugx: "",
    stock_quantity: "",
    category: "",
    image_urls: [] as string[],
    is_published: true,
  });

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { items: all } = await apiProducts.listShopProducts(shopId, { token });
      const filtered = all.filter((p) => (p.item_type ?? "product") === itemType);
      setItems(filtered);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [shopId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    const price = Number(draft.price_ugx.replace(/,/g, ""));
    setError(null);
    try {
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
      await apiProducts.createProduct(token, shopId, body);
      setDraft({
        title: "",
        description: "",
        price_ugx: "",
        stock_quantity: "",
        category: "",
        image_urls: [],
        is_published: true,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create listing.");
    }
  }

  async function removeProduct(id: string) {
    if (!token) return;
    if (!window.confirm("Remove this listing? This cannot be undone.")) return;
    setError(null);
    try {
      await apiProducts.deleteProduct(token, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  async function togglePublish(p: Product) {
    if (!token) return;
    setError(null);
    try {
      await apiProducts.updateProduct(token, p.id, {
        is_published: !p.is_published,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-muted">
        Sign in to manage {itemType === "service" ? "services" : "products"}.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{heading}</h2>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          Images are uploaded securely via UploadThing and stored as URLs on the listing.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40">
          {error}
        </p>
      ) : null}

      <form onSubmit={(e) => void handleCreate(e)} className="dm-card space-y-4 p-5 sm:p-6">
        <p className="text-sm font-semibold text-foreground/90">Add new</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">Title</label>
            <input
              className="dm-input-xs dm-focus"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder={itemType === "service" ? "e.g. Home visit consult" : "e.g. Espresso"}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">Description</label>
            <textarea
              className="dm-textarea-xs dm-focus min-h-[88px]"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="What buyers should know"
            />
          </div>
          <div className={itemType === "service" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
            <label className="text-xs font-medium text-foreground/80">Price (UGX)</label>
            <input
              className="dm-input-xs dm-focus"
              inputMode="numeric"
              value={draft.price_ugx}
              onChange={(e) => setDraft((d) => ({ ...d, price_ugx: e.target.value }))}
              placeholder="5000"
            />
          </div>
          {itemType === "product" ? (
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
          ) : null}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">Category</label>
            <input
              className="dm-input-xs dm-focus"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              placeholder="e.g. Drinks"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">Images</label>
            <p className="text-[11px] text-muted">
              Preview matches storefront aspect (~4:3). Remove any image before saving if you change your mind.
            </p>
            <ImageUpload
              endpoint="productImage"
              multiple
              label="Upload images"
              onUploadManyComplete={(urls) =>
                setDraft((d) => ({ ...d, image_urls: [...d.image_urls, ...urls] }))
              }
            />
            {draft.image_urls.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                {draft.image_urls.map((url, i) => (
                  <li
                    key={`${url}-${i}`}
                    className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border border-border bg-foreground/[0.04] shadow-sm"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 28rem"
                      unoptimized
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 inline-flex size-10 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/75 dm-focus"
                      aria-label={`Remove image ${i + 1}`}
                      title="Remove image"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          image_urls: d.image_urls.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      <X className="size-5" strokeWidth={2.25} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={draft.is_published}
              onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.checked }))}
            />
            <span className="text-xs font-medium text-foreground/85">Published on storefront</span>
          </label>
        </div>
        <button
          type="submit"
          className="dm-pill dm-focus bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          Add {itemType === "service" ? "service" : "product"}
        </button>
      </form>

      <div>
        <p className="text-sm font-semibold text-foreground/90">Your listings</p>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing here yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((p) => {
              const img = productPrimaryImage(p);
              return (
                <li key={p.id} className="dm-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl bg-foreground/[0.04] sm:h-16 sm:w-20">
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground/95">{p.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{formatUGX(productPriceUgx(p))}</p>
                    <p className="mt-1 text-xs text-muted">
                      {p.is_published ? "Published" : "Draft"} · {p.view_count ?? 0} views
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className="dm-focus inline-flex size-9 items-center justify-center rounded-xl text-foreground/70 hover:bg-foreground/[0.06]"
                      title={p.is_published ? "Unpublish" : "Publish"}
                      onClick={() => void togglePublish(p)}
                    >
                      {p.is_published ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="dm-focus inline-flex size-9 items-center justify-center rounded-xl text-red-600/90 hover:bg-red-500/10"
                      title="Delete"
                      onClick={() => void removeProduct(p.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
