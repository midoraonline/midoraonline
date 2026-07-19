"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import type { ProductStatus } from "@/lib/api/products";
import {
  productImageUrls,
  productPrimaryImage,
  productPriceUgx,
  productIsDiscounted,
  productDiscountPercent,
  productOriginalPriceUgx,
  type ItemType,
  type Product,
} from "@/lib/api/products";
import { useAppSession } from "@/lib/state";
import ProductFormModal from "@/components/shop/ProductFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";

function formatUGX(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_CONFIG: Record<ProductStatus, { label: string; className: string }> = {
  active:         { label: "Active",         className: "text-[color:var(--success)]" },
  pending_review: { label: "Pending review", className: "text-[color:var(--warning)]" },
  rejected:       { label: "Rejected",       className: "text-[color:var(--error)]" },
  draft:          { label: "Draft",          className: "text-foreground/60" },
  hidden:         { label: "Hidden",         className: "text-foreground/60" },
  expired:        { label: "Expired",        className: "text-foreground/60" },
  sold:           { label: "Sold",           className: "text-foreground/60" },
};

function StatusBadge({ status, is_published }: { status?: ProductStatus | null; is_published?: boolean | null }) {
  const cfg = status ? STATUS_CONFIG[status] : null;
  if (cfg) {
    return <span className={cfg.className}>{cfg.label}</span>;
  }
  return is_published ? (
    <span className="text-[color:var(--success)]">Published</span>
  ) : (
    <span className="text-foreground/60">Draft</span>
  );
}

// ── Inline toggle switch — uses the design-system dm-toggle utility ──────────
function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="dm-toggle dm-toggle-sm"
    >
      <span className="dm-toggle-thumb" />
    </button>
  );
}

export default function ShopCatalogEditor({
  shopId,
  itemType,
  heading,
  shopLogoUrl,
}: {
  shopId: string;
  itemType: ItemType;
  heading: string;
  shopLogoUrl?: string | null;
}) {
  const session = useAppSession();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; product: Product } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Track per-item loading states for optimistic toggle feedback
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const isAuthed = session.isAuthenticated;
  const hydrated = session.hydrated;

  const load = useCallback(async () => {
    if (!isAuthed) return;
    setLoading(true);
    try {
      const { items: all } = await apiProducts.listShopProducts(shopId);
      setItems(all.filter((p) => (p.item_type ?? "product") === itemType));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [shopId, itemType, isAuthed]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("openAdd") === "true") {
        setModal({ mode: "add" });
        // Clean up URL without reloading
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  async function removeProduct(product: Product) {
    if (!isAuthed) return;
    setDeleting(true);
    const request = apiProducts.deleteProduct(product.id);
    toast.promise(request, {
      loading: "Removing listing…",
      success: "Listing removed",
      error: (e) => (e instanceof Error ? e.message : "Delete failed."),
    });
    try {
      await request;
      if (modal?.mode === "edit" && modal.product?.id === product.id) setModal(null);
      setPendingDelete(null);
      await load();
    } catch {
      /* sonner surfaced */
    } finally {
      setDeleting(false);
    }
  }

  async function togglePublish(p: Product) {
    if (!isAuthed) return;
    // Optimistic UI update
    setToggling((prev) => ({ ...prev, [p.id]: true }));
    setItems((prev) =>
      prev.map((item) =>
        item.id === p.id ? { ...item, is_published: !item.is_published } : item
      )
    );
    try {
      await apiProducts.toggleAvailability(p.id);
      await load();
    } catch (e) {
      // Revert optimistic update on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, is_published: p.is_published } : item
        )
      );
      toast.error(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setToggling((prev) => ({ ...prev, [p.id]: false }));
    }
  }

  async function handleRepost(p: Product) {
    if (!isAuthed) return;
    const request = apiProducts.repostProduct(p.id);
    toast.promise(request, {
      loading: "Reposting…",
      success: "Reposted to the Latest Feed",
      error: (e) =>
        e instanceof Error ? e.message : "Repost failed. Daily limit might be reached.",
    });
    try {
      await request;
      await load();
    } catch {
      /* sonner surfaced */
    }
  }

  async function submitForReview(p: Product) {
    if (!isAuthed) return;
    const request = apiProducts.updateProduct(p.id, { status: "pending_review" });
    toast.promise(request, {
      loading: "Submitting for review…",
      success: "Submitted for review",
      error: (e) => (e instanceof Error ? e.message : "Submit failed."),
    });
    try {
      await request;
      await load();
    } catch {
      /* sonner surfaced */
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

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground/90">
            Your {itemType === "service" ? "services" : "products"}
          </p>
          <button
            type="button"
            onClick={() => setModal({ mode: "add" })}
            className="dm-btn dm-btn-primary dm-btn-sm"
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
              const isToggling = toggling[p.id] ?? false;
              return (
                <li key={p.id} className="dm-card overflow-hidden">
                  <div className="flex items-start gap-3 p-4">
                    {/* Thumbnail */}
                    <div className="relative mt-0.5 size-14 shrink-0 overflow-hidden rounded-xl bg-foreground/[0.04] sm:size-16">
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
                        {productIsDiscounted(p) ? (
                          <span className="flex items-center gap-1.5">
                            <span className="font-semibold text-[color:var(--error)]">
                              {formatUGX(productPriceUgx(p))}
                            </span>
                            <span className="text-[11px] line-through text-muted/60">
                              {formatUGX(productOriginalPriceUgx(p))}
                            </span>
                            <span className="dm-pill dm-pill--error px-1.5 py-0.5 text-[10px] font-bold">
                              -{productDiscountPercent(p)}%
                            </span>
                          </span>
                        ) : (
                          formatUGX(productPriceUgx(p))
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        <StatusBadge status={p.status} is_published={p.is_published} />
                        {" · "}
                        {p.view_count ?? 0} views
                        {mediaCount > 0 && ` · ${mediaCount} media`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {/* Row 1: Edit + Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setModal({ mode: "edit", product: p })}
                          className="dm-focus inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-foreground/65 hover:bg-foreground/[0.06] hover:text-foreground transition-colors"
                          title="Edit listing"
                        >
                          <Pencil className="size-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="dm-focus inline-flex size-8 items-center justify-center rounded-xl transition-colors hover:bg-[color:var(--error-subtle)]"
                          style={{ color: "var(--error)" }}
                          title="Delete listing"
                          onClick={() => setPendingDelete(p)}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Row 2: Publish toggle with label */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted select-none">
                          {p.is_published ? "Published" : "Unpublished"}
                        </span>
                        <ToggleSwitch
                          id={`publish-${p.id}`}
                          checked={p.is_published ?? false}
                          onChange={() => void togglePublish(p)}
                          disabled={isToggling}
                          label={p.is_published ? "Unpublish" : "Publish"}
                        />
                      </div>

                      {/* Row 3: Repost (only when published) */}
                      {p.is_published && (
                        <button
                          type="button"
                          className="dm-focus inline-flex items-center gap-1.5 rounded-xl border border-foreground/[0.1] bg-foreground/[0.04] px-2.5 py-1 text-[11px] font-semibold text-foreground/90 transition-colors hover:bg-foreground/[0.08]"
                          title="Repost to the Latest Feed to boost visibility"
                          onClick={() => void handleRepost(p)}
                        >
                          Repost to feed
                        </button>
                      )}

                      {/* Row 4: Resubmit for review (only when rejected) */}
                      {p.status === "rejected" && (
                        <button
                          type="button"
                          className="dm-btn dm-btn-primary dm-btn-sm"
                          title="Submit for admin review"
                          onClick={() => void submitForReview(p)}
                        >
                          Resubmit for review
                        </button>
                      )}
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

      {pendingDelete && (
        <ConfirmDialog
          title="Remove listing?"
          message={`"${pendingDelete.title}" will be removed permanently. This cannot be undone.`}
          confirmLabel="Remove listing"
          destructive
          busy={deleting}
          onConfirm={() => void removeProduct(pendingDelete)}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
