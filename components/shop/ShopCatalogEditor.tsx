"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import { type ItemType, type Product } from "@/lib/api/products";
import { LISTING_KIND_LABEL, normalizeListingKind } from "@/lib/listingMeta";
import { useAppSession } from "@/lib/state";
import ConfirmDialog from "@/components/ConfirmDialog";
import ListingManageCard from "@/components/shop/ListingManageCard";
import { BTN_PRIMARY, EmptyState, PageSkeleton, Section } from "@/components/dashboard/ui";

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

  if (!hydrated) return <PageSkeleton rows={4} label="Loading catalog" />;

  if (!isAuthed) return <EmptyState message={`Sign in to manage ${kindLabel}.`} />;

  return (
    <div>
      <Section
        title={`Your ${kindLabel}`}
        description={heading}
        action={
          <Link href={`/post-item?shop_id=${shopId}&item_type=${itemType}`} className={BTN_PRIMARY}>
            Add {LISTING_KIND_LABEL[normalizeListingKind(itemType)].toLowerCase()}
          </Link>
        }
      >
        {loading ? (
          <PageSkeleton rows={4} label="Loading catalog" />
        ) : items.length === 0 ? (
          <EmptyState message={`No ${kindLabel} in this shop yet.`} />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
            {items.map((p) => (
              <li key={p.id} className="px-3 py-3 sm:px-4">
                <ListingManageCard product={p} onDelete={() => setPendingDelete(p)} onUpdated={applyProduct} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {pendingDelete && (
        <ConfirmDialog
          title="Remove listing?"
          message={`"${pendingDelete.title}" will be removed. This can't be undone.`}
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
