"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiProducts } from "@/lib/api";
import type { LikedProduct } from "@/lib/api/products";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import ProductCard, { type ProductCardData } from "@/components/productcard";
import { productPageSlug } from "@/lib/productUrl";

function toCard(p: LikedProduct): ProductCardData {
  return {
    id: p.id,
    slug: productPageSlug(p),
    title: p.title,
    priceUGX: p.price_ugx,
    originalPriceUGX: p.price_ugx,
    discountPriceUGX: p.discount_price ?? null,
    discountPercent: p.discount_price != null && p.discount_price > 0 && p.discount_price < p.price_ugx
      ? Math.round((1 - p.discount_price / p.price_ugx) * 100)
      : 0,
    imageUrl: p.image_urls?.[0] ?? undefined,
    stockQuantity: null,
    viewCount: p.view_count,
    category: p.category ?? null,
    location_name: p.location_name ?? null,
    shopWhatsApp: p.shop_whatsapp ?? null,
    sellerId: p.owner_id ?? null,
    shop: {
      id: p.shop_id,
      name: p.shop_name ?? "Shop",
      slug: p.shop_slug ?? p.shop_id,
      verified: false,
      category: null,
      trust_score: null,
      available_now: null,
      location: null,
    },
    boosted: false,
    updated_at: p.created_at ?? null,
  };
}

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">My Wishlist</h1>
        <p className="mt-1 text-sm text-muted">
          {total > 0
            ? `You have ${total} saved ${total === 1 ? "item" : "items"}`
            : "Products you like will appear here"}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="dm-card p-8 text-sm text-muted">Loading your wishlist…</div>
      ) : items.length === 0 ? (
        <div className="dm-card flex flex-col items-center gap-3 p-8 text-center text-sm text-muted">
          <MaterialSymbol name="favorite" className="!text-4xl text-foreground/20" />
          <p>Your wishlist is empty.</p>
          <p className="text-xs">Tap the heart on any product to save it here.</p>
          <Link
            href="/products"
            className="dm-pill dm-focus mt-2 inline-flex bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            Browse Products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={toCard(p)} />
          ))}
        </div>
      )}
    </div>
  );
}
