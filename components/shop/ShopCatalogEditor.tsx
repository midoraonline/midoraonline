"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteUploadThingFiles } from "@/lib/uploadthing";
import StatusBadge from "@/components/shop/StatusBadge";

function formatUGX(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
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
}: {
  shopId: string;
  itemType: ItemType;
  heading: string;
  shopLogoUrl?: string | null;
}) {
  const router = useRouter();
  const session = useAppSession();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
        router.push(`/post-item?shop_id=${shopId}&item_type=${itemType}`);
      }
    }
  }, [shopId, itemType, router]);

  async function removeProduct(product: Product) {
    if (!isAuthed) return;
    setDeleting(true);
    const mediaUrls = productImageUrls(product);
    const request = apiProducts.deleteProduct(product.id);
    toast.promise(request, {
      loading: "Removing listing…",
      success: "Listing removed",
      error: (e) => (e instanceof Error ? e.message : "Delete failed."),
    });
    try {
      await request;
      if (mediaUrls.length) {
        void deleteUploadThingFiles(mediaUrls);
      }
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
          <Link
            href={`/post-item?shop_id=${shopId}&item_type=${itemType}`}
            className="dm-btn dm-btn-primary dm-btn-sm"
          >
            Add {LISTING_KIND_LABEL[normalizeListingKind(itemType)].toLowerCase()}
          </Link>
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
                    <Link
                      href={`/merchant/listings/${p.id}/edit`}
                      className="relative mt-0.5 size-14 shrink-0 overflow-hidden rounded-xl bg-foreground/[0.04] sm:size-16"
                    >
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
                    </Link>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/merchant/listings/${p.id}/edit`}
                        className="truncate text-sm font-semibold text-foreground/95 hover:text-accent transition-colors block"
                      >
                        {p.title}
                      </Link>
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
                      {(p.status === "rejected" || p.status === "pending_review") && p.review_notes ? (
                        <p
                          className={`mt-1 text-[11px] leading-snug ${
                            p.status === "rejected"
                              ? "text-[color:var(--error)]"
                              : "text-[color:var(--warning)]"
                          }`}
                          title={p.review_notes}
                        >
                          <span className="font-semibold">
                            {p.status === "rejected" ? "Rejected: " : "Reviewer note: "}
                          </span>
                          <span className="opacity-90">{p.review_notes}</span>
                        </p>
                      ) : p.status === "pending_review" ? (
                        <p className="mt-1 text-[11px] leading-snug text-[color:var(--warning)]">
                          <span className="font-semibold">Reviewing your listing — </span>
                          <span className="opacity-90">usually done within a minute. It goes live automatically once approved.</span>
                        </p>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {/* Row 1: Edit + Delete */}
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/merchant/listings/${p.id}/edit`}
                          className="dm-focus inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-foreground/65 hover:bg-foreground/[0.06] hover:text-foreground transition-colors"
                          title="Edit listing"
                        >
                          <Pencil className="size-3.5" />
                          <span>Edit</span>
                        </Link>
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

                      {/* Row 2: Publish toggle */}
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

                      {/* Row 3: Repost */}
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

                      {/* Row 4: Rejected → edit & resubmit */}
                      {p.status === "rejected" && (
                        <Link
                          href={`/merchant/listings/${p.id}/edit`}
                          className="dm-btn dm-btn-primary dm-btn-sm"
                          title="Edit the listing and resubmit for review"
                        >
                          Edit & resubmit
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
