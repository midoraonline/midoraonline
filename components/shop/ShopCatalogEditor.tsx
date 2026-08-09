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
import {
  LISTING_KIND_LABEL,
  normalizeListingKind,
} from "@/lib/listingMeta";
import { useAppSession } from "@/lib/state";
import ProductFormModal from "@/components/shop/ProductFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteUploadThingFiles } from "@/lib/uploadthing";

function formatUGX(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; pillClass: string; dot?: "pulse" | "solid" | "none" }
> = {
  active: {
    label: "Live",
    pillClass:
      "bg-[color:var(--success)]/12 text-[color:var(--success)] ring-1 ring-inset ring-[color:var(--success)]/25",
    dot: "solid",
  },
  pending_review: {
    label: "Reviewing",
    pillClass:
      "bg-[color:var(--warning)]/12 text-[color:var(--warning)] ring-1 ring-inset ring-[color:var(--warning)]/25",
    dot: "pulse",
  },
  rejected: {
    label: "Not approved",
    pillClass:
      "bg-[color:var(--error)]/12 text-[color:var(--error)] ring-1 ring-inset ring-[color:var(--error)]/25",
    dot: "solid",
  },
  draft: {
    label: "Draft",
    pillClass: "bg-foreground/[0.06] text-foreground/70 ring-1 ring-inset ring-foreground/10",
  },
  hidden: {
    label: "Hidden",
    pillClass: "bg-foreground/[0.06] text-foreground/70 ring-1 ring-inset ring-foreground/10",
  },
  expired: {
    label: "Expired",
    pillClass: "bg-foreground/[0.06] text-foreground/60 ring-1 ring-inset ring-foreground/10",
  },
  sold: {
    label: "Sold",
    pillClass: "bg-foreground/[0.06] text-foreground/60 ring-1 ring-inset ring-foreground/10",
  },
};

function StatusBadge({
  status,
  is_published,
}: {
  status?: ProductStatus | null;
  is_published?: boolean | null;
}) {
  const cfg = status ? STATUS_CONFIG[status] : null;
  const resolved =
    cfg ??
    (is_published
      ? STATUS_CONFIG.active
      : STATUS_CONFIG.draft);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${resolved.pillClass}`}
    >
      {resolved.dot === "pulse" ? (
        <span className="relative inline-flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : resolved.dot === "solid" ? (
        <span className="inline-flex size-1.5 rounded-full bg-current" />
      ) : null}
      {resolved.label}
    </span>
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
      const want = normalizeListingKind(itemType);
      setItems(
        all.filter((p) => normalizeListingKind(p.item_type) === want),
      );
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
    // Grab the URLs *before* the delete lands so we can reap the CDN
    // files. Losing the product row would leave these orphaned in
    // UploadThing storage forever.
    const mediaUrls = productImageUrls(product);
    const request = apiProducts.deleteProduct(product.id);
    toast.promise(request, {
      loading: "Removing listing…",
      success: "Listing removed",
      error: (e) => (e instanceof Error ? e.message : "Delete failed."),
    });
    try {
      await request;
      // Fire-and-forget — storage cleanup, not user-critical.
      if (mediaUrls.length) {
        void deleteUploadThingFiles(mediaUrls);
      }
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


  const kindLabel =
    LISTING_KIND_LABEL[normalizeListingKind(itemType)].toLowerCase() + "s";

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
        Sign in to manage {kindLabel}.
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
            Your {kindLabel}
          </p>
          <button
            type="button"
            onClick={() => setModal({ mode: "add" })}
            className="dm-btn dm-btn-primary dm-btn-sm"
          >
            Add {LISTING_KIND_LABEL[normalizeListingKind(itemType)].toLowerCase()}
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
                      {/* Moderation reason \u2014 shown for rejected or under-review\n                          listings when the pipeline stamped review_notes. Lets\n                          the merchant fix the underlying issue without opening\n                          the edit modal first. */}\n                      {(p.status === \"rejected\" || p.status === \"pending_review\") && p.review_notes ? (\n                        <p\n                          className={`mt-1 text-[11px] leading-snug ${\n                            p.status === \"rejected\"\n                              ? \"text-[color:var(--error)]\"\n                              : \"text-[color:var(--warning)]\"\n                          }`}\n                          title={p.review_notes}\n                        >\n                          <span className=\"font-semibold\">\n                            {p.status === \"rejected\" ? \"Rejected: \" : \"Reviewer note: \"}\n                          </span>\n                          <span className=\"opacity-90\">{p.review_notes}</span>\n                        </p>\n                      ) : p.status === \"pending_review\" ? (\n                        <p className=\"mt-1 text-[11px] leading-snug text-[color:var(--warning)]\">\n                          <span className=\"font-semibold\">Reviewing your listing \u2014 </span>\n                          <span className=\"opacity-90\">usually done within a minute. It goes live automatically once approved.</span>\n                        </p>\n                      ) : null}
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

                      {/* Row 4: Rejected \u2192 open the editor so the merchant can\n                          actually fix what the moderator flagged before\n                          resubmitting. A silent status flip would just get\n                          rejected again for the same reason. */}\n                      {p.status === \"rejected\" && (\n                        <button\n                          type=\"button\"\n                          className=\"dm-btn dm-btn-primary dm-btn-sm\"\n                          title=\"Edit the listing and resubmit for review\"\n                          onClick={() => setModal({ mode: \"edit\", product: p })}\n                        >\n                          Edit & resubmit\n                        </button>\n                      )}
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
