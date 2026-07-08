"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiProducts } from "@/lib/api";
import type { LikedProduct } from "@/lib/api/products";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import ProductCard from "@/components/productcard";
import { likedProductToCard } from "@/lib/productCardMap";

export default function WishlistPage() {
  const [items, setItems] = useState<LikedProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiProducts.myLikedProducts({ limit: 100 });
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load wishlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="dm-container py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Wishlist</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? "Loading…" : `${total} saved ${total === 1 ? "item" : "items"}`}
          </p>
        </div>
        <Link
          href="/products"
          className="dm-focus inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent/30 hover:text-accent"
        >
          <MaterialSymbol name="storefront" className="!text-sm" />
          Browse products
        </Link>
      </div>

      {error ? (
        <div className="dm-card p-8 text-sm text-red-600">{error}</div>
      ) : loading ? (
        <div className="dm-card p-8 text-sm text-muted">Loading your wishlist…</div>
      ) : items.length === 0 ? (
        <div className="dm-card flex flex-col items-center gap-3 p-8 text-center text-sm text-muted">
          <MaterialSymbol name="favorite_border" className="!text-3xl text-muted/60" />
          <p>No saved items yet. Tap the heart on any product to save it here.</p>
          <Link href="/products" className="text-accent font-semibold hover:underline">
            Explore products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={likedProductToCard(p)} />
          ))}
        </div>
      )}
    </div>
  );
}
