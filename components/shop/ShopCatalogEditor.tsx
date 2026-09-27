"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import { type ItemType, type Product } from "@/lib/api/products";
import { LISTING_KIND_LABEL, normalizeListingKind } from "@/lib/listingMeta";
import { useAppSession } from "@/lib/state";
import ConfirmDialog from "@/components/ConfirmDialog";
import ListingManageCard from "@/components/shop/ListingManageCard";

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

  const isAuthed = session.isAuthenticated;
  const hydrated = session.hydrated;

  const load = useCallback(async () => {
    if (!isAuthed) return;
    setLoading(true);
    try {
      const { items: all } = await apiProducts.listShopProducts(shopId, { includeUnpublished: true });
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
    const request = apiProducts.deleteProduct(product.id);
    toast.promise(request, {
      loading: "Removing listing…",
      success: "Listing removed",
      error: (e) => (e instanceof Error ? e.message : "Delete failed."),
    });
    try {
      await request;
      setPendingDelete(null);
      await load();
    } catch {
      /* sonner surfaced */
    } finally {
      setDeleting(false);
    }
  }

  function applyProduct(next: Product) {
    setItems((prev) => prev.map((item) => (item.id === next.id ? { ...item, ...next } : item)));
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
            {items.map((p) => (
              <li key={p.id}>
                <ListingManageCard
                  product={p}
                  onDelete={() => setPendingDelete(p)}
                  onUpdated={applyProduct}
                />
              </li>
            ))}
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
