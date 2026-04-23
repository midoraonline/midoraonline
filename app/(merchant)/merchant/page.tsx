"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiShops } from "@/lib/api";
import type { MerchantStats, Shop } from "@/lib/api/shops";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { useAppSession } from "@/lib/state";

const PALETTE = ["#4a6767", "#66798f", "#d49b63", "#6a9379", "#8b6f9f"];
const CARTESIAN_STROKE = "rgba(102, 121, 143, 0.18)";
const AXIS_STROKE = "rgba(42,51,49,0.5)";

function fmt(n?: number | null) {
  return new Intl.NumberFormat().format(Number(n ?? 0));
}

export default function MerchantOverviewPage() {
  const session = useAppSession();
  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopsRes, statsRes] = await Promise.all([
        apiShops.myShops(),
        apiShops.myStats().catch(() => null),
      ]);
      setShops(shopsRes.items ?? []);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your shops");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable({ table: "shops", channel: "merchant-shops-overview" }, () =>
    load(),
  );

  const displayName =
    session.user?.full_name?.trim() || session.user?.email?.trim() || "there";

  const shopChartData = shops.map((s) => ({
    name: s.name.length > 18 ? `${s.name.slice(0, 16)}…` : s.name,
    fullName: s.name,
    views: Number(s.view_count ?? 0),
    likes: Number(s.like_count ?? 0),
    followers: Number(s.follower_count ?? 0),
  }));

  const kpiStats = stats
    ? [
        { label: "Shop views", value: stats.total_shop_views, color: PALETTE[0] },
        { label: "Followers", value: stats.total_followers, color: PALETTE[1] },
        { label: "Shop likes", value: stats.total_shop_likes, color: PALETTE[4] },
        { label: "Products", value: stats.total_products, color: PALETTE[2] },
        { label: "Product views", value: stats.total_product_views, color: PALETTE[3] },
        { label: "Product likes", value: stats.total_product_likes, color: PALETTE[4] },
      ]
    : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Merchant
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome, {displayName}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Manage your shops, track performance, and keep your catalog fresh.
          </p>
        </div>
        <Link
          href="/merchant/new"
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
        >
          + New shop
        </Link>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {/* Summary KPIs */}
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total shops"
          value={loading ? "—" : fmt(shops.length)}
        />
        <StatCard
          label="Active"
          value={loading ? "—" : fmt(shops.filter((s) => s.is_active).length)}
          tone="emerald"
        />
        <StatCard
          label="Awaiting / inactive"
          value={loading ? "—" : fmt(shops.filter((s) => !s.is_active).length)}
          tone="amber"
        />
      </section>

      {/* Engagement KPIs */}
      {stats && (
        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpiStats.map(({ label, value, color }) => (
            <div key={label} className="dm-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {label}
              </p>
              <p
                className="mt-2 font-display text-2xl font-semibold"
                style={{ color }}
              >
                {fmt(value)}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Shop engagement bar chart */}
      {shopChartData.length > 0 && (
        <section className="dm-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">
            Shop engagement
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Views, likes, and followers per shop.
          </p>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shopChartData}
                margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CARTESIAN_STROKE}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke={AXIS_STROKE}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                  stroke={AXIS_STROKE}
                />
                <Tooltip
                  labelFormatter={(_l, payload) =>
                    (payload?.[0]?.payload as { fullName?: string })?.fullName ||
                    ""
                  }
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(102,121,143,0.25)",
                    fontSize: 12,
                  }}
                />
                {(["views", "likes", "followers"] as const).map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={PALETTE[i]}
                    radius={[6, 6, 0, 0]}
                    name={key[0].toUpperCase() + key.slice(1)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Your shops list */}
      <section className="dm-card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Your shops</h2>
          <Link
            href="/merchant/new"
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95"
          >
            + New
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted">Loading your shops…</p>
        ) : shops.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted">
              You haven&apos;t opened a shop yet.
            </p>
            <Link
              href="/merchant/new"
              className="dm-pill dm-focus mt-4 inline-flex bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
            >
              Open your first shop
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shops.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/merchant/shops/${s.id}`}
                  className="dm-card group flex h-full flex-col gap-3 p-4 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.name}</p>
                      <p className="truncate text-xs text-muted">/{s.slug}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        s.is_active
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-3 text-[11px] text-muted">
                    <span>👥 {fmt(s.follower_count)}</span>
                    <span>❤ {fmt(s.like_count)}</span>
                    <span>👁 {fmt(s.view_count)}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-foreground/70 group-hover:text-primary">
                    Open dashboard →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-300"
        : "text-foreground";
  return (
    <div className="dm-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
