"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import FallbackImage from "@/components/media/FallbackImage";
import StatusBadge from "@/components/shop/StatusBadge";
import ListingPromoteActions from "@/components/shop/ListingPromoteActions";
import ConfirmDialog from "@/components/ConfirmDialog";
import FormModal from "@/components/FormModal";
import { apiProducts } from "@/lib/api";
import {
  isVideoUrl,
  productImageUrls,
  productPriceUgx,
  productPrimaryImage,
  type Product,
} from "@/lib/api/products";
import { isTextOnlyListing, parseListingMeta } from "@/lib/listingMeta";
import ListingTypeTag from "@/components/ListingTypeTag";
import { listingTypeTagKind } from "@/lib/listingType";
import { isVerificationRequired, verificationMessage } from "@/lib/verification";
import { ApiError } from "@/lib/api/base";
import {
  categoryNeedsStock,
  isRestockStatus,
  primaryCloseAction,
  reactivateListingPatch,
  showsStock,
  stockLabel,
  withdrawListingPatch,
} from "@/lib/listingStatus";
import { isStockRequired, STOCK_REQUIRED_MESSAGE } from "@/lib/platformMessages";

function formatUGX(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ListingManageCard({
  product,
  shopName,
  onDelete,
  onUpdated,
}: {
  product: Product;
  shopName?: string | null;
  onDelete: () => void;
  onUpdated: (product: Product) => void;
}) {
  const router = useRouter();
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [stockAsk, setStockAsk] = useState<"available" | "show" | null>(null);
  const [stockValue, setStockValue] = useState("");
  const [stockError, setStockError] = useState<string | null>(null);
  const media = productImageUrls(product);
  const cover = productPrimaryImage(product);
  const textOnly = isTextOnlyListing(product.item_type, media.length);
  const typeKind = listingTypeTagKind(product.item_type, parseListingMeta(product.listing_meta));
  const editHref = `/merchant/listings/${product.id}/edit`;
  const status = product.status;
  const published = product.is_published !== false && status !== "hidden" && status !== "draft";

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function run(label: string, task: () => Promise<Product | null>) {
    setBusy(true);
    setOpen(false);
    try {
      const next = await task();
      if (next) onUpdated({ ...product, ...next });
      toast.success(label);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update listing.");
    } finally {
      setBusy(false);
    }
  }

  function withdraw(next: "sold" | "unavailable" | "filled" | "closed" | "hidden", ok: string) {
    return run(ok, async () => {
      const updated = await apiProducts.updateProduct(product.id, withdrawListingPatch(next));
      return {
        ...product,
        ...updated,
        status: next,
        is_published: false,
        stock_quantity: 0,
      };
    });
  }

  async function reactivate(mode: "available" | "show", stock: number | null) {
    setBusy(true);
    setOpen(false);
    try {
      const updated = await apiProducts.updateProduct(product.id, reactivateListingPatch(stock));
      const live = (updated.status ?? "active") === "active" && updated.is_published !== false;
      onUpdated({
        ...product,
        ...updated,
        status: live ? "active" : (updated.status ?? product.status),
        is_published: live,
        stock_quantity: stock ?? updated.stock_quantity ?? null,
      });
      if (live) toast.success(mode === "available" ? "Marked available" : "Listing published");
      else toast.message("Stock saved. This listing stays off the public feed until it can go live again.");
    } catch (e) {
      if (isStockRequired(e) || (e instanceof ApiError && e.status === 400 && e.code === "stock_required")) {
        toast.error(STOCK_REQUIRED_MESSAGE);
        return;
      }
      if (isVerificationRequired(e)) {
        toast.error(verificationMessage(e));
        return;
      }
      toast.error(e instanceof Error ? e.message : "Could not update listing.");
    } finally {
      setBusy(false);
    }
  }

  async function askOrReactivate(mode: "available" | "show") {
    setOpen(false);
    if (await categoryNeedsStock(product)) {
      setStockValue("");
      setStockError(null);
      setStockAsk(mode);
      return;
    }
    await reactivate(mode, null);
  }

  function submitStock() {
    const qty = Number(stockValue.trim());
    if (!Number.isInteger(qty) || qty < 1) {
      setStockError("Enter how many are in stock.");
      return;
    }
    const mode = stockAsk;
    setStockAsk(null);
    if (mode) void reactivate(mode, qty);
  }

  const closeAction = primaryCloseAction(product.item_type);
  const items: { key: string; label: string; onSelect: () => void; danger?: boolean }[] = [
    {
      key: "preview",
      label: "Preview",
      onSelect: () => {
        setOpen(false);
        window.open(`/products/${product.id}`, "_blank", "noopener");
      },
    },
  ];
  if (status === "rejected") {
    items.push({
      key: "resubmit",
      label: "Resubmit",
      onSelect: () => {
        setOpen(false);
        router.push(editHref);
      },
    });
  }
  if (isRestockStatus(status)) {
    items.push({
      key: "available",
      label: "Mark available",
      onSelect: () => void askOrReactivate("available"),
    });
  } else if (status === "active") {
    items.push({
      key: "close",
      label: closeAction.label,
      onSelect: () => {
        setOpen(false);
        setConfirmClose(true);
      },
    });
  }
  if (published && !isRestockStatus(status) && status !== "pending_review" && status !== "rejected") {
    items.push({
      key: "hide",
      label: "Hide",
      onSelect: () => void withdraw("hidden", "Listing hidden"),
    });
  } else if (!isRestockStatus(status) && (status === "hidden" || status === "draft" || product.is_published === false)) {
    items.push({
      key: "show",
      label: "Show",
      onSelect: () => void askOrReactivate("show"),
    });
  }
  if (status === "active" && product.is_published !== false) {
    items.push({
      key: "promote",
      label: "Promote",
      onSelect: () =>
        void run("Promoted to the latest feed", () => apiProducts.repostProduct(product.id)),
    });
  }
  items.push({
    key: "delete",
    label: "Delete",
    danger: true,
    onSelect: () => {
      setOpen(false);
      onDelete();
    },
  });

  return (
    <>
    <article className="flex min-w-0 gap-2.5 sm:gap-3">
      {textOnly ? (
        <Link href={editHref} className="shrink-0" aria-label={product.title || "Edit listing"}>
          <span
            className={`grid size-14 place-items-center rounded-lg text-base font-semibold uppercase sm:size-16 ${
              {
                product: "bg-listing-product text-listing-product-foreground",
                service: "bg-listing-service text-listing-service-foreground",
                opportunity: "bg-listing-opportunity text-listing-opportunity-foreground",
                job: "bg-listing-job text-listing-job-foreground",
              }[typeKind]
            }`}
          >
            {(product.title || "·").trim().charAt(0)}
          </span>
        </Link>
      ) : (
        <Link
          href={editHref}
          className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted ring-1 ring-border sm:size-16"
        >
          {cover ? (
            <FallbackImage
              urls={media.filter((url) => !isVideoUrl(url))}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
              fallback={
                <span className="grid h-full place-items-center text-[10px] text-muted">
                  {media.some((url) => isVideoUrl(url)) ? "Video" : "No photo"}
                </span>
              }
            />
          ) : (
            <span className="grid h-full place-items-center text-[10px] text-muted">
              {media.some((url) => isVideoUrl(url)) ? "Video" : "No photo"}
            </span>
          )}
        </Link>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <ListingTypeTag kind={typeKind} />
          <StatusBadge status={product.status} is_published={product.is_published} />
          {showsStock(product) ? (
            <span className="text-xs text-muted">Stock {stockLabel(product.stock_quantity)}</span>
          ) : null}
        </div>
        <div className="flex items-start justify-between gap-2">
          <Link
            href={editHref}
            className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:underline"
          >
            {product.title || "Untitled"}
          </Link>
          <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
            {formatUGX(productPriceUgx(product))}
          </p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {shopName ? <span className="truncate text-xs text-muted">{shopName}</span> : null}
        </div>
        {product.review_notes ? (
          <p
            className={`mt-1 line-clamp-1 text-xs ${
              status === "rejected" ? "text-[color:var(--error)]" : "text-[color:var(--warning)]"
            }`}
          >
            {product.review_notes}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Link
            href={editHref}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium shadow-xs transition-colors hover:bg-surface-muted sm:min-h-9"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Link>
          {status === "active" && product.is_published !== false ? (
            <ListingPromoteActions
              listingId={product.id}
              onReposted={(postedAt) => onUpdated?.({ ...product, created_at: postedAt })}
            />
          ) : null}
          <div ref={menuRef} className="relative ml-auto">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={menuId}
              disabled={busy}
              onClick={() => setOpen((v) => !v)}
              className="dm-focus grid size-10 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              <MoreHorizontal className="size-5" />
              <span className="sr-only">More actions</span>
            </button>
            {open ? (
              <div
                id={menuId}
                role="menu"
                className="absolute right-0 z-sticky mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg"
              >
                {items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    onClick={item.onSelect}
                    className={`dm-focus flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm ${
                      item.danger
                        ? "text-[color:var(--error)] hover:bg-[color:var(--error-subtle)]"
                        : "text-foreground hover:bg-foreground/[0.04]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      </article>
      {confirmClose ? (
        <ConfirmDialog
          title={closeAction.title}
          message={closeAction.message}
          confirmLabel={closeAction.label}
          destructive
          busy={busy}
          onConfirm={() => {
            setConfirmClose(false);
            void withdraw(closeAction.status, closeAction.done);
          }}
          onClose={() => {
            if (!busy) setConfirmClose(false);
          }}
        />
      ) : null}
      {stockAsk ? (
        <FormModal
          title="How many are in stock?"
          onClose={() => {
            if (!busy) setStockAsk(null);
          }}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="dm-btn dm-btn-ghost dm-btn-sm" onClick={() => setStockAsk(null)}>
                Cancel
              </button>
              <button type="button" className="dm-btn dm-btn-primary dm-btn-sm" disabled={busy} onClick={submitStock}>
                Publish
              </button>
            </div>
          }
        >
          <label className="block text-sm text-foreground" htmlFor={`${menuId}-stock`}>
            Stock quantity
          </label>
          <input
            id={`${menuId}-stock`}
            inputMode="numeric"
            className="dm-input mt-2"
            value={stockValue}
            onChange={(e) => {
              setStockValue(e.target.value);
              setStockError(null);
            }}
          />
          {stockError ? <p className="mt-2 text-xs text-[color:var(--error)]">{stockError}</p> : null}
        </FormModal>
      ) : null}
    </>
  );
}
