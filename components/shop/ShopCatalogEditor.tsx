"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
  ArrowUpCircle,
} from "lucide-react";
import { apiProducts } from "@/lib/api";
import type { ProductStatus } from "@/lib/api/products";
import {
  productImageUrls,
  productPrimaryImage,
  productPriceUgx,
  type ItemType,
  type Product,
} from "@/lib/api/products";
import { useAppSession } from "@/lib/state";
import ProductFormModal from "@/components/shop/ProductFormModal";

function formatUGX(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_CONFIG: Record<ProductStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "text-green-700 dark:text-green-400" },
  pending_review: { label: "Pending review", className: "text-amber-600 dark:text-amber-400" },
  rejected: { label: "Rejected", className: "text-red-600 dark:text-red-400" },
  draft: { label: "Draft", className: "text-foreground/60" },
  hidden: { label: "Hidden", className: "text-foreground/60" },
  expired: { label: "Expired", className: "text-foreground/60" },
  sold: { label: "Sold", className: "text-foreground/60" },
};

function StatusBadge({ status, is_published }: { status?: ProductStatus | null; is_published?: boolean | null }) {
  const cfg = status ? STATUS_CONFIG[status] : null;
  if (cfg) {
    return <span className={cfg.className}>{cfg.label}</span>;
  }
  return is_published ? (
    <span className="text-green-700 dark:text-green-400">Published</span>
  ) : (
    <span className="text-foreground/60">Draft</span>
  );
}

// Shared between the add-new form and the inline edit panel.
export default function ShopCatalogEditor({
  shopId,
  itemType,
  heading,
  shopLogoUrl,
}: {
  shopId: string;
  itemType: ItemType;
  heading: string;
  /** Public shop logo; when present, new product photos are watermarked before storage. */
  shopLogoUrl?: string | null;
}) {
  const session = useAppSession();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; product: Product } | null>(null);
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

  async function removeProduct(id: string) {
    if (!isAuthed) return;
    if (!window.confirm("Remove this listing? This cannot be undone.")) return;
    setError(null);
    try {
      await apiProducts.deleteProduct(id);
      if (modal?.mode === "edit" && modal.product?.id === id) setModal(null);
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

  async function handleRepost(p: Product) {
    if (!isAuthed) return;
    setError(null);
    try {
      await apiProducts.repostProduct(p.id);
      await load();
      alert("Product reposted to the Latest Feed!");
     } catch (e: unknown) {
       setError(e instanceof Error ? e.message : (e instanceof Object && 'message' in e && typeof e.message === 'string' ? e.message : "Repost failed. Daily limit might be reached."));
     }
  }

  async function submitForReview(p: Product) {
    if (!isAuthed) return;
    setError(null);
    try {
      await apiProducts.updateProduct(p.id, { status: "pending_review" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed.");
    }
  }

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
      <div>
        <h2 className="text-base font-semibold tracking-tight">{heading}</h2>
        <p className="mt-1 text-xs text-muted">
          Tap <strong>Edit</strong> on any listing to change its details, photos, or videos.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40">
          {error}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground/90">
            Your {itemType === "service" ? "services" : "products"}
          </p>
          <button
            type="button"
            onClick={() => setModal({ mode: "add" })}
            className="dm-focus inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
          >
            Add {itemType}
          </button>
        </div>
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
              const mediaCount = productImageUrls(p).length;
              return (
                <li key={p.id} className="dm-card overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
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

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground/95">
                        {p.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatUGX(productPriceUgx(p))}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        <StatusBadge status={p.status} is_published={p.is_published} />
                        {" · "}
                        {p.view_count ?? 0} views
                        {mediaCount > 0 && ` · ${mediaCount} media`}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "edit", product: p })}
                        className="dm-focus inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground/65 hover:bg-foreground/[0.06] hover:text-foreground transition-colors"
                        title="Edit listing"
                      >
                        <Pencil className="size-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        className="dm-focus inline-flex size-9 items-center justify-center rounded-xl text-foreground/65 hover:bg-foreground/[0.06]"
                        title={p.is_published ? "Unpublish" : "Publish"}
                        onClick={() => void togglePublish(p)}
                      >
                        {p.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>

                      {p.is_published && (
                        <button
                          type="button"
                          className="dm-focus inline-flex size-9 items-center justify-center rounded-xl text-blue-600/80 hover:bg-blue-500/10"
                          title="Repost to Latest Feed"
                          onClick={() => void handleRepost(p)}
                        >
                          <ArrowUpCircle className="size-4" />
                        </button>
                      )}

                      {p.status === "rejected" && (
                        <button
                          type="button"
                          className="dm-focus inline-flex items-center gap-1 rounded-xl bg-amber-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-700"
                          title="Submit for admin review"
                          onClick={() => void submitForReview(p)}
                        >
                          Resubmit
                        </button>
                      )}

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
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modal && (
        <ProductFormModal
          mode={modal.mode}
          product={modal.mode === "edit" ? modal.product : undefined}
          shopId={shopId}
          itemType={itemType}
          shopLogoUrl={shopLogoUrl}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
