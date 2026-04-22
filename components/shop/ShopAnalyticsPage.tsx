"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiProducts, apiShops } from "@/lib/api";
import type { Product } from "@/lib/api/products";
import type { Shop, ShopEngagement } from "@/lib/api/shops";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useAppSession } from "@/lib/state";

const ACCENT = ["#4a6767", "#66798f", "#757779"];

function formatNum(n: number) {
  return new Intl.NumberFormat().format(n);
}

export default function ShopAnalyticsPage({ shop }: { shop: Shop }) {
  const session = useAppSession();
  const isOwner = session.ownedShopIds.includes(shop.id);
  const hydrated = session.hydrated;

  const [engagement, setEngagement] = useState<ShopEngagement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopProfile, setShopProfile] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session.isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [e, list, full] = await Promise.all([
        apiShops.getShopEngagement(shop.id),
        apiProducts.listShopProducts(shop.id),
        apiShops.getShop(shop.id).catch(() => null),
      ]);
      setEngagement(e);
      setProducts(list.items);
      setShopProfile(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [shop.id, session.isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isOwner) {
      setLoading(false);
      return;
    }
    void load();
  }, [hydrated, isOwner, load]);

  const shopBars = useMemo(() => {
    const views = Number(
      engagement?.view_count ?? shopProfile?.view_count ?? 0
    );
    return [
      { name: "Page views", value: views },
      { name: "Likes", value: Number(engagement?.like_count ?? 0) },
      { name: "Followers", value: Number(engagement?.follower_count ?? 0) },
    ];
  }, [engagement, shopProfile]);

  const productViewRows = useMemo(() => {
    return [...products]
      .map((p) => ({
        name: p.title.length > 26 ? `${p.title.slice(0, 24)}…` : p.title,
        fullTitle: p.title,
        views: Number(p.view_count ?? 0),
        likes: Number(p.like_count ?? 0),
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 16);
  }, [products]);

  const productLikeRows = useMemo(() => {
    return [...products]
      .map((p) => ({
        name: p.title.length > 26 ? `${p.title.slice(0, 24)}…` : p.title,
        fullTitle: p.title,
        likes: Number(p.like_count ?? 0),
      }))
      .filter((r) => r.likes > 0)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 12);
  }, [products]);

  if (!hydrated) {
    return (
      <div className="dm-card p-8 text-center text-sm text-muted sm:p-10">
        Loading session…
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="dm-card p-8 text-center sm:p-10">
        <MaterialSymbol
          name="lock"
          className="mx-auto !text-[40px] leading-none text-muted"
        />
        <p className="mt-4 text-base font-semibold tracking-tight">Owner only</p>
        <p className="mt-2 text-sm text-muted">
          Sign in with the account that owns this shop to view analytics.
        </p>
        <Link
          href={`/shops/${shop.slug}`}
          className="dm-pill dm-focus mt-6 inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          <MaterialSymbol name="arrow_back" className="!text-[18px] leading-none" />
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/shops/${shop.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground dm-focus"
          >
            <MaterialSymbol name="arrow_back" className="!text-[18px] leading-none" />
            Back to shop
          </Link>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted">{shop.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/shops/${shop.slug}/edit`}
            className="dm-pill dm-focus inline-flex items-center gap-1.5 border border-foreground/[0.1] bg-foreground/[0.05] px-4 py-2 text-sm font-semibold transition-colors hover:bg-foreground/[0.08]"
          >
            <MaterialSymbol name="edit" className="!text-[18px] leading-none" />
            Edit shop
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading analytics…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {shopBars.map((row, i) => (
              <div
                key={row.name}
                className="dm-card border-foreground/[0.06] p-5 sm:p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {row.name}
                </p>
                <p
                  className="mt-2 text-2xl font-semibold tabular-nums tracking-tight"
                  style={{ color: ACCENT[i % ACCENT.length] }}
                >
                  {formatNum(row.value)}
                </p>
              </div>
            ))}
          </div>

          <section className="dm-card p-5 sm:p-8">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              Shop engagement
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Views, likes, and followers for this storefront.
            </p>
            <div className="mt-6 h-64 w-full min-h-[16rem]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shopBars} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 121, 143, 0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgba(42,51,49,0.45)" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="rgba(42,51,49,0.45)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(102, 121, 143, 0.2)",
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {shopBars.map((_, i) => (
                      <Cell key={i} fill={ACCENT[i % ACCENT.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="dm-card p-5 sm:p-8">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              Mix of engagement
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Share of each metric (same totals as above).
            </p>
            <div className="mx-auto mt-6 h-72 w-full max-w-md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shopBars}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${name ?? ""} (${Math.round((percent ?? 0) * 100)}%)`
                    }
                  >
                    {shopBars.map((_, i) => (
                      <Cell key={i} fill={ACCENT[i % ACCENT.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNum(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="dm-card p-5 sm:p-8">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              Product views
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Top listings by recorded product views (merchant view includes all products).
            </p>
            {productViewRows.length === 0 ? (
              <p className="mt-6 text-sm text-muted">No products yet.</p>
            ) : (
              <div
                className="mt-6 w-full"
                style={{ height: Math.max(280, productViewRows.length * 36) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={productViewRows}
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 121, 143, 0.2)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={118}
                      tick={{ fontSize: 10 }}
                      stroke="rgba(42,51,49,0.45)"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatNum(value), "Views"]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullTitle ?? ""
                      }
                    />
                    <Bar dataKey="views" fill="#4a6767" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {productLikeRows.length > 0 ? (
            <section className="dm-card p-5 sm:p-8">
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                Product likes
              </h2>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Listings with at least one like.
              </p>
              <div
                className="mt-6 w-full"
                style={{ height: Math.max(240, productLikeRows.length * 36) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={productLikeRows}
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 121, 143, 0.2)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={118}
                      tick={{ fontSize: 10 }}
                      stroke="rgba(42,51,49,0.45)"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatNum(value), "Likes"]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullTitle ?? ""
                      }
                    />
                    <Bar dataKey="likes" fill="#66798f" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : null}

          <p className="text-center text-xs text-muted">
            Time-based trends will appear here when the API exposes historical series.
          </p>
        </>
      )}
    </div>
  );
}
