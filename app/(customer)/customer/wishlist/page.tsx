"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiProducts } from "@/lib/api";
import type { LikedProduct } from "@/lib/api/products";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import ProductLikeButton from "@/components/product/ProductLikeButton";

function fmtPrice(price: number): string {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function WishlistCard({ product }: { product: LikedProduct }) {
  const img = product.image_urls?.[0] ?? null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="dm-card group flex flex-col overflow-hidden transition hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-subtle">
        {img ? (
          <Image
            src={img}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <MaterialSymbol name="image" className="!text-3xl" />
          </div>
        )}
        {/* Like button overlay */}
        <div className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
          <ProductLikeButton
            productId={product.id}
            size="compact"
            initialLiked={true}
            initialLikeCount={0}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-2.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.title}</p>
        <p className="text-xs text-muted">{product.category ?? "Uncategorised"}</p>
        <p className="mt-auto pt-1 text-sm font-bold text-accent">
          {fmtPrice(product.price_ugx)}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="flex items-center gap-0.5">
            <MaterialSymbol name="visibility" className="!text-xs" />
            {product.view_count}
          </span>
          {product.location_name && (
            <span className="flex items-center gap-0.5">
              <MaterialSymbol name="location_on" className="!text-xs" />
              {product.location_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
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
            <WishlistCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
