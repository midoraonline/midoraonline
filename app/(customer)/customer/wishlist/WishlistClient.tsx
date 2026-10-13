"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiProducts } from "@/lib/api";
import type { LikedProduct } from "@/lib/api/products";
import { BTN_SECONDARY, EmptyState, ErrorState, PageHeader, formatCount as fmt } from "@/components/dashboard/ui";
import ProductCard, { productCardSlotClass } from "@/components/productcard";
import { likedProductToCard } from "@/lib/productCardMap";

type Props = {
  initialItems: LikedProduct[];
  initialTotal: number;
};

export default function WishlistClient({ initialItems, initialTotal }: Props) {
  const [items, setItems] = useState<LikedProduct[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await apiProducts.myLikedProducts({ limit: 100 });
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh wishlist");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div>
      <PageHeader
        title="Wishlist"
        description={`${fmt(total)} saved ${total === 1 ? "item" : "items"}.`}
        action={
          <Link href="/products" className={BTN_SECONDARY}>
            Browse listings
          </Link>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : items.length === 0 ? (
        <EmptyState
          message="Nothing saved yet. Tap the heart on any listing to save it here."
          action={
            <Link href="/products" className={BTN_SECONDARY}>
              Browse listings
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((p) => {
            const card = likedProductToCard(p);
            return (
              <div key={p.id} className={productCardSlotClass(card)}>
                <ProductCard product={card} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
