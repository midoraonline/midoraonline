"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from "recharts";

import { apiShops } from "@/lib/api";
import type { MerchantStats, Shop } from "@/lib/api/shops";
import { useRealtimeTable } from "@/lib/realtime/hooks";

const PALETTE = ["#4a6767", "#66798f", "#d49b63", "#6a9379", "#8b6f9f", "#25D366"];
const CARTESIAN_STROKE = "rgba(102, 121, 143, 0.18)";
const AXIS_STROKE = "rgba(42,51,49,0.4)";

function fmt(n?: number | null) {
  return new Intl.NumberFormat().format(Number(n ?? 0));
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
    tone === "emerald" ? "text-emerald-600"
    : tone === "amber"  ? "text-amber-600"
    : "text-foreground";
  return (
    <div className="dm-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

// Custom label for pie slices — only show if slice is big enough
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number;
  percent: number; name: string;
}) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {name.split(" ")[0]}
    </text>
  );
}

export default function MerchantOverviewPage() {
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
    Promise.resolve().then(() => load());
  }, [load]);

  useRealtimeTable({ table: "shops", channel: "merchant-shops-overview" }, () => load());

  const shopChartData = shops.map((s) => ({
    name: s.name.length > 16 ? `${s.name.slice(0, 14)}…` : s.name,
    fullName: s.name,
    views: Number(s.view_count ?? 0),
    likes: Number(s.like_count ?? 0),
    followers: Number(s.follower_count ?? 0),
  }));

  const kpiStats = stats ? [
    { label: "Shop views",      value: stats.total_shop_views,     color: PALETTE[0] },
    { label: "Followers",       value: stats.total_followers,       color: PALETTE[1] },
    { label: "Shop likes",      value: stats.total_shop_likes,      color: PALETTE[4] },
    { label: "Products",        value: stats.total_products,        color: PALETTE[2] },
    { label: "Product views",   value: stats.total_product_views,   color: PALETTE[3] },
    { label: "Product likes",   value: stats.total_product_likes,   color: PALETTE[4] },
    { label: "WhatsApp clicks", value: stats.total_whatsapp_clicks, color: PALETTE[5] },
    { label: "Messages",        value: stats.total_messages,        color: PALETTE[0] },
  ] : [];

  // Donut chart — engagement breakdown from totals
  const donutData = stats ? [
    { name: "Shop Views",    value: stats.total_shop_views    ?? 0, fill: PALETTE[0] },
    { name: "Product Views", value: stats.total_product_views ?? 0, fill: PALETTE[3] },
    { name: "Followers",     value: stats.total_followers     ?? 0, fill: PALETTE[1] },
    { name: "Shop Likes",    value: stats.total_shop_likes    ?? 0, fill: PALETTE[4] },
    { name: "WhatsApp",      value: stats.total_whatsapp_clicks ?? 0, fill: PALETTE[5] },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Welcome back 👋
          </h2>
          <p className="mt-1 text-sm text-muted">
            Here's how your shops are performing.
          </p>
        </div>
        <Link
          href="/merchant/new"
          className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          + New shop
        </Link>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {/* Top KPI cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total shops"        value={loading ? "—" : fmt(shops.length)} />
        <StatCard label="Active"             value={loading ? "—" : fmt(shops.filter((s) => s.is_active).length)}  tone="emerald" />
        <StatCard label="Inactive / pending" value={loading ? "—" : fmt(shops.filter((s) => !s.is_active).length)} tone="amber" />
      </section>

      {/* Engagement KPI grid */}
      {stats && (
        <section className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          {kpiStats.map(({ label, value, color }) => (
            <div key={label} className="dm-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-2 font-display text-2xl font-semibold" style={{ color }}>
                {fmt(value)}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Charts row */}
      {(shopChartData.length > 0 || donutData.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
          {/* Bar chart */}
          {shopChartData.length > 0 && (
            <div className="dm-card p-5 sm:p-6">
              <h2 className="font-display text-base font-semibold">Shop Engagement</h2>
              <p className="mt-0.5 text-xs text-muted">Views, likes and followers per shop</p>
              <div className="mt-5 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shopChartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CARTESIAN_STROKE} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={AXIS_STROKE} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke={AXIS_STROKE} />
                    <Tooltip
                      labelFormatter={(_l, payload) =>
                        (payload?.[0]?.payload as { fullName?: string })?.fullName || ""
                      }
                      contentStyle={{ borderRadius: 12, border: "1px solid rgba(102,121,143,0.2)", fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                    {(["views", "likes", "followers"] as const).map((key, i) => (
                      <Bar key={key} dataKey={key} fill={PALETTE[i]} radius={[5, 5, 0, 0]}
                        name={key[0].toUpperCase() + key.slice(1)} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Donut chart */}
          {donutData.length > 0 && (
            <div className="dm-card flex w-full flex-col p-5 sm:p-6 lg:w-72">
              <h2 className="font-display text-base font-semibold">Engagement Split</h2>
              <p className="mt-0.5 text-xs text-muted">Overall activity breakdown</p>
              <div className="mt-4 flex flex-1 items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={PieLabel as never}
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [fmt(value), name]}
                      contentStyle={{ borderRadius: 12, border: "1px solid rgba(102,121,143,0.2)", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <ul className="mt-2 space-y-1.5">
                {donutData.map((d) => (
                  <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
                      <span className="text-muted">{d.name}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{fmt(d.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/merchant/conversations" className="dm-card dm-card-hover p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Conversations</p>
          <p className="mt-2 font-display text-3xl font-semibold">—</p>
          <p className="mt-1 text-[10px] text-muted">View all →</p>
        </Link>
        <Link href="/merchant/leads" className="dm-card dm-card-hover p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Leads</p>
          <p className="mt-2 font-display text-3xl font-semibold">—</p>
          <p className="mt-1 text-[10px] text-muted">View all →</p>
        </Link>
        <Link href="/merchant/shops" className="dm-card dm-card-hover p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Shops</p>
          <p className="mt-2 font-display text-3xl font-semibold">{fmt(shops.length)}</p>
          <p className="mt-1 text-[10px] text-muted">Manage shops →</p>
        </Link>
      </section>

      {/* Shops list */}
      <section className="dm-card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Your Shops</h2>
          <Link href="/merchant/new" className="rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20">
            + New
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : shops.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted">You haven&apos;t opened a shop yet.</p>
            <Link href="/merchant/new" className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
              Open your first shop
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      s.is_active ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
                    }`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-3 text-[11px] text-muted">
                    <span>👥 {fmt(s.follower_count)}</span>
                    <span>❤ {fmt(s.like_count)}</span>
                    <span>👁 {fmt(s.view_count)}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-foreground/60 transition-colors group-hover:text-accent">
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
