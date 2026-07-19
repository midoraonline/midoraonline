"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops, apiProducts } from "@/lib/api";
import type { Shop, Verification } from "@/lib/api/shops";
import type { Product } from "@/lib/api/products";
import { useRealtimeTable } from "@/lib/realtime/hooks";

type Props = {
  shopId: string;
  initialShop: Shop;
  initialProducts: Product[];
  initialVerification: Verification | null;
};

export default function ShopOverviewClient({
  shopId,
  initialShop,
  initialProducts,
  initialVerification,
}: Props) {
  const [shop, setShop] = useState<Shop>(initialShop);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [verification, setVerification] = useState<Verification | null>(initialVerification);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shopId) return;
    setError(null);
    try {
      const [s, p, v] = await Promise.all([
        apiShops.getShop(shopId),
        apiProducts.listShopProducts(shopId).catch(() => ({ items: [] as Product[] })),
        apiShops.getVerification(shopId).catch(() => null),
      ]);
      setShop(s);
      setProducts(p.items ?? []);
      setVerification(v);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shop");
    }
  }, [shopId]);

  useEffect(() => { void load(); }, [load]);

  useRealtimeTable(
    { table: "products", channel: `merchant-shop-${shopId}` },
    () => {
      void load();
    },
  );

  if (error) {
    return (
      <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
        {error}
      </p>
    );
  }

  const badges = verification?.badges ?? [];

  return (
    <div className="space-y-5">
      {/* Verification progress banner */}
      {verification && (!badges.includes("business_verified") || !badges.includes("identity_verified")) && (
        <section className="dm-card overflow-hidden bg-gradient-to-r from-surface to-accent/5 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground/90">Verification incomplete</h3>
              <p className="mt-1 text-xs text-muted max-w-lg">
                Complete your verification journey to unlock trust badges. Shops with badges get more views and sales.
              </p>
            </div>
            <Link
              href={`/merchant/shops/${shopId}/verification`}
              className="dm-btn dm-btn-primary dm-btn-sm shrink-0 whitespace-nowrap"
            >
              Complete verification →
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Views" value={shop.view_count ?? 0} />
        <StatCard label="Followers" value={shop.follower_count ?? 0} />
        <StatCard label="Likes" value={shop.like_count ?? 0} />
        <StatCard label="Products" value={products.length} />
      </section>

      <section className="dm-card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent products</h2>
          <div className="flex items-center gap-3">
            <Link
              href={`/merchant/shops/${shopId}/catalog?openAdd=true`}
              className="dm-btn dm-btn-secondary dm-btn-sm"
            >
              Add Product
            </Link>
            <Link
              href={`/merchant/shops/${shopId}/catalog`}
              className="text-xs font-semibold text-foreground/75 hover:text-foreground"
            >
              Manage catalog →
            </Link>
          </div>
        </div>
        {products.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No products yet. Add your first product to start selling.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {products.slice(0, 6).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.title}</p>
                  <p className="truncate text-[11px] text-muted">
                    {p.price_ugx != null
                      ? `UGX ${p.price_ugx.toLocaleString()}`
                      : "—"}
                  </p>
                </div>
                <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-semibold">
                  {p.is_published ? "Live" : "Draft"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="dm-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
