"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops, apiProducts } from "@/lib/api";
import type { Shop, Verification } from "@/lib/api/shops";
import type { Product } from "@/lib/api/products";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  EmptyState,
  ErrorState,
  LIST,
  Section,
  StatStrip,
  StatusDot,
  formatCount as fmt,
} from "@/components/dashboard/ui";

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
        apiProducts.listShopProducts(shopId, { includeUnpublished: true }).catch(() => ({ items: [] as Product[] })),
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

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const badges = verification?.badges ?? [];
  const unverified =
    verification && (!badges.includes("business_verified") || !badges.includes("identity_verified"));

  return (
    <div>
      {unverified ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface shadow-xs px-4 py-3">
          <p className="text-sm text-muted">Verification isn&apos;t finished. Verified shops show a trust badge.</p>
          <Link href={`/merchant/shops/${shopId}/verification`} className={BTN_SECONDARY}>
            Continue verification
          </Link>
        </div>
      ) : null}

      <StatStrip
        items={[
          { label: "Views", value: fmt(shop.view_count) },
          { label: "Followers", value: fmt(shop.follower_count) },
          { label: "Likes", value: fmt(shop.like_count) },
          { label: "Listings", value: fmt(products.length) },
        ]}
      />

      <Section
        title="Recent listings"
        action={
          <div className="flex items-center gap-3">
            <Link href={`/merchant/shops/${shopId}/catalog`} className="text-sm text-muted hover:text-foreground">
              Catalog
            </Link>
            <Link href={`/merchant/shops/${shopId}/catalog?openAdd=true`} className={BTN_PRIMARY}>
              Add listing
            </Link>
          </div>
        }
      >
        {products.length === 0 ? (
          <EmptyState message="No listings in this shop yet." />
        ) : (
          <ul className={LIST}>
            {products.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.title}</span>
                  <span className="block text-xs tabular-nums text-muted">
                    {p.price_ugx != null ? `UGX ${fmt(p.price_ugx)}` : "No price"}
                  </span>
                </span>
                <StatusDot tone={p.is_published ? "ok" : "neutral"}>{p.is_published ? "Live" : "Draft"}</StatusDot>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
