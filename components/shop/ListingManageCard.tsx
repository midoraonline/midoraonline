"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import FallbackImage from "@/components/media/FallbackImage";
import StatusBadge from "@/components/shop/StatusBadge";
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
import { isTextOnlyListing, LISTING_KIND_LABEL, normalizeListingKind } from "@/lib/listingMeta";
import {
  categoryNeedsStock,
  reactivateListingPatch,
  showsStock,
  stockLabel,
  withdrawListingPatch,
} from "@/lib/listingStatus";

function formatUGX(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
}

function statsLine(product: Product): string | null {
  const parts: string[] = [];
  if (typeof product.view_count === "number") {
    parts.push(`${product.view_count.toLocaleString()} view${product.view_count === 1 ? "" : "s"}`);
  }
  if (typeof product.whatsapp_clicks === "number") {
    parts.push(
      `${product.whatsapp_clicks.toLocaleString()} WhatsApp tap${product.whatsapp_clicks === 1 ? "" : "s"}`,
    );
  }
  return parts.length ? parts.join(" · ") : null;
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
  const [confirmSold, setConfirmSold] = useState(false);
  const [stockAsk, setStockAsk] = useState<"available" | "show" | null>(null);
  const [stockValue, setStockValue] = useState("");
  const [stockError, setStockError] = useState<string | null>(null);
  const media = productImageUrls(product);
  const cover = productPrimaryImage(product);
  const textOnly = isTextOnlyListing(product.item_type, media.length);
  const kind = normalizeListingKind(product.item_type);
  const editHref = `/merchant/listings/${product.id}/edit`;
  const status = product.status;
  const published = product.is_published !== false && status !== "hidden" && status !== "draft";
  const stats = statsLine(product);

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

  function withdraw(next: "sold" | "hidden", ok: string) {
    return run(ok, async () => {
      const updated = await apiProducts.updateProduct(product.id, withdrawListingPatch(next));
      return {
        ...product,
        ...updated,
        status: next,
        is_published: false,
        stock_quantity: null,
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
  if (status === "sold") {
    items.push({
      key: "available",
      label: "Mark available",
      onSelect: () => void askOrReactivate("available"),
    });
  } else if (status === "active") {
    items.push({
      key: "sold",
      label: "Mark sold",
      onSelect: () => {
        setOpen(false);
        setConfirmSold(true);
      },
    });
  }
  if (published && status !== "sold" && status !== "pending_review" && status !== "rejected") {
    items.push({
      key: "hide",
      label: "Hide",
      onSelect: () => void withdraw("hidden", "Listing hidden"),
    });
  } else if (status === "hidden" || status === "draft" || product.is_published === false) {
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
    <article className="dm-card flex gap-3 p-3 sm:gap-4 sm:p-4">
      {textOnly ? null : (
        <Link
          href={editHref}
          className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-border bg-surface-subtle sm:size-24"
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
        {textOnly ? (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {LISTING_KIND_LABEL[kind]}
          </p>
        ) : null}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={editHref}
            className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-accent"
          >
            {product.title || "Untitled"}
          </Link>
          <p className="shrink-0 text-sm font-bold tabular-nums text-accent">
            {formatUGX(productPriceUgx(product))}
          </p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={product.status} is_published={product.is_published} />
          {showsStock(product) ? (
            <span className="text-[11px] text-muted">Stock: {stockLabel(product.stock_quantity)}</span>
          ) : null}
          {shopName ? <span className="truncate text-[11px] text-muted">{shopName}</span> : null}
        </div>
        {stats ? <p className="mt-1 text-[11px] text-muted">{stats}</p> : null}
        {product.review_notes ? (
          <p
            className={`mt-1 line-clamp-2 text-[11px] ${
              status === "rejected" ? "text-[color:var(--error)]" : "text-[color:var(--warning)]"
            }`}
          >
            {product.review_notes}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <Link
            href={editHref}
            className="dm-btn dm-btn-primary dm-btn-sm inline-flex min-h-11 items-center gap-1.5 sm:min-h-9"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Link>
          <div ref={menuRef} className="relative ml-auto">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={menuId}
              disabled={busy}
              onClick={() => setOpen((v) => !v)}
              className="dm-focus grid size-11 place-items-center rounded-xl text-foreground/70 hover:bg-foreground/[0.06] disabled:opacity-50"
            >
              <MoreHorizontal className="size-5" />
              <span className="sr-only">More actions</span>
            </button>
            {open ? (
              <div
                id={menuId}
                role="menu"
                className="absolute right-0 z-sticky mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
              >
                {items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    onClick={item.onSelect}
                    className={`dm-focus flex min-h-11 w-full items-center px-3 text-left text-sm ${
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
      {confirmSold ? (
        <ConfirmDialog
          title="Mark this listing sold?"
          message="It leaves the public feed, and stock is cleared."
          confirmLabel="Mark sold"
          destructive
          busy={busy}
          onConfirm={() => {
            setConfirmSold(false);
            void withdraw("sold", "Marked sold");
          }}
          onClose={() => {
            if (!busy) setConfirmSold(false);
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
