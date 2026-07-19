"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart,
  Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis, Legend,
} from "recharts";

import { apiShops } from "@/lib/api";
import type { MerchantAnalytics, MerchantStats, Shop } from "@/lib/api/shops";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { useAppSession } from "@/lib/state";

const PALETTE = ["#4a6767", "#66798f", "#d49b63", "#6a9379", "#8b6f9f", "#25D366"];
const CARTESIAN_STROKE = "rgba(102, 121, 143, 0.18)";
const AXIS_STROKE = "rgba(42,51,49,0.4)";

function fmt(n?: number | null) {
  return new Intl.NumberFormat().format(Number(n ?? 0));
}

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function mergeSeries(
  trends: MerchantAnalytics["trends"],
): Array<{ day: string; impressions: number; views: number; whatsapp: number; messages: number }> {
  const byDay = new Map<string, { day: string; impressions: number; views: number; whatsapp: number; messages: number }>();
  const put = (key: "impressions" | "views" | "whatsapp" | "messages") => {
    for (const p of trends[key] ?? []) {
      const row = byDay.get(p.day) ?? { day: p.day, impressions: 0, views: 0, whatsapp: 0, messages: 0 };
      row[key] = p.count;
      byDay.set(p.day, row);
    }
  };
  put("impressions");
  put("views");
  put("whatsapp");
  put("messages");
  return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "amber" }) {
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

type Props = {
  initialShops: Shop[];
  initialStats: MerchantStats | null;
};

export default function MerchantDashboardClient({ initialShops, initialStats }: Props) {
  const session = useAppSession();
  const displayName = session.user?.full_name?.trim().split(" ")[0] || session.user?.email?.trim() || "there";
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [stats, setStats] = useState<MerchantStats | null>(initialStats);
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [windowDays, setWindowDays] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [shopsRes, statsRes, analyticsRes] = await Promise.all([
        apiShops.myShops(),
        apiShops.myStats().catch(() => null),
        apiShops.myAnalytics(windowDays).catch(() => null),
      ]);
      setShops(shopsRes.items ?? []);
      if (statsRes) setStats(statsRes);
      if (analyticsRes) setAnalytics(analyticsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your shops");
    }
  }, [windowDays]);

  useEffect(() => { void load(); }, [load]);
  useRealtimeTable({ table: "shops", channel: "merchant-shops-overview" }, () => { void load(); });

  const shopChartData = shops.map((s) => ({
    name: s.name.length > 16 ? `${s.name.slice(0, 14)}…` : s.name,
    fullName: s.name,
    views: Number(s.view_count ?? 0),
    likes: Number(s.like_count ?? 0),
    followers: Number(s.follower_count ?? 0),
  }));

  const kpiStats = stats ? [
    { label: "Shop views",      value: stats.total_shop_views,       color: PALETTE[0] },
    { label: "Followers",       value: stats.total_followers,         color: PALETTE[1] },
    { label: "Shop likes",      value: stats.total_shop_likes,        color: PALETTE[4] },
    { label: "Products",        value: stats.total_products,          color: PALETTE[2] },
    { label: "Product views",   value: stats.total_product_views,     color: PALETTE[3] },
    { label: "Product likes",   value: stats.total_product_likes,     color: PALETTE[4] },
    { label: "WhatsApp clicks", value: stats.total_whatsapp_clicks,   color: PALETTE[5] },
    { label: "Messages",        value: stats.total_messages,          color: PALETTE[0] },
  ] : [];

  const donutData = [
    { name: "Shop Views",    value: stats?.total_shop_views       ?? 0, fill: PALETTE[0] },
    { name: "Product Views", value: stats?.total_product_views    ?? 0, fill: PALETTE[3] },
    { name: "Followers",     value: stats?.total_followers        ?? 0, fill: PALETTE[1] },
    { name: "Shop Likes",    value: stats?.total_shop_likes       ?? 0, fill: PALETTE[4] },
    { name: "WhatsApp",      value: stats?.total_whatsapp_clicks  ?? 0, fill: PALETTE[5] },
  ];
  const hasDonutData = donutData.some((d) => d.value > 0);

  // Recent activity — derived from shops sorted by view_count as a proxy
  const recentActivity = [...shops]
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      event: s.is_active ? "Shop is active" : "Shop pending review",
      meta: `${fmt(s.view_count)} views · ${fmt(s.like_count)} likes`,
      active: s.is_active,
      updatedAt: (s as Shop & { updated_at?: string }).updated_at ?? "",
    }));

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Page intro */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Welcome back, {displayName}
          </h2>
          <p className="mt-1 text-sm text-muted">Here's how your shops are performing.</p>
        </div>
        <Link
          href="/merchant/new"
          className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          + New shop
        </Link>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">{error}</p>
      )}

      {/* Top KPI cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total shops"        value={fmt(shops.length)} />
        <StatCard label="Active"             value={fmt(shops.filter((s) => s.is_active).length)} tone="emerald" />
        <StatCard label="Inactive / pending" value={fmt(shops.filter((s) => !s.is_active).length)} tone="amber" />
      </section>

      {/* Engagement KPI mini-grid */}
      {stats && (
        <section className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          {kpiStats.map(({ label, value, color }) => (
            <div key={label} className="dm-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-2 font-display text-2xl font-semibold" style={{ color }}>{fmt(value)}</p>
            </div>
          ))}
        </section>
      )}

      {/* ── Charts row: bar + donut side by side ── */}
      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">

        {/* Bar chart */}
        <div className="dm-card p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold">Shop Engagement</h2>
          <p className="mt-0.5 text-xs text-muted">Views, likes and followers per shop</p>
          {shopChartData.length === 0 ? (
            <div className="mt-6 flex h-52 items-center justify-center text-sm text-muted">
              No shop data yet.
            </div>
          ) : (
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
          )}
        </div>

        {/* Donut chart */}
        <div className="dm-card flex flex-col p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold">Engagement Split</h2>
          <p className="mt-0.5 text-xs text-muted">Overall activity breakdown</p>

          {!hasDonutData ? (
            <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted">
              No engagement data yet.
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={donutData.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                    >
                      {donutData.filter((d) => d.value > 0).map((entry, i) => (
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
              <ul className="mt-2 space-y-1.5">
                {donutData.filter((d) => d.value > 0).map((d) => (
                  <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
                      <span className="text-muted">{d.name}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{fmt(d.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* ── Analytics: impressions, trends, funnel, per-shop, top products ── */}
      {analytics && (
        <>
          <section className="dm-card p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold">Impressions & engagement</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Last {analytics.window_days} days across all your listings.
                </p>
              </div>
              <div className="flex gap-1 rounded-xl bg-surface-subtle p-1 text-[11px] font-semibold">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setWindowDays(d)}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      windowDays === d ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Impressions", value: analytics.summary.total_impressions, color: PALETTE[0] },
                { label: "Product views", value: analytics.summary.total_product_views, color: PALETTE[3] },
                { label: "WhatsApp clicks", value: analytics.summary.total_whatsapp_clicks, color: PALETTE[5] },
                { label: "Messages", value: analytics.summary.total_messages, color: PALETTE[1] },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-border/40 bg-surface-subtle/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-1.5 font-display text-2xl font-semibold" style={{ color }}>{fmt(value)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={mergeSeries(analytics.trends)}
                  margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                >
                  <defs>
                    {(["impressions", "views", "whatsapp", "messages"] as const).map((k, i) => (
                      <linearGradient key={k} id={`m-grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PALETTE[i]} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={PALETTE[i]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CARTESIAN_STROKE} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke={AXIS_STROKE} tickFormatter={formatDay} minTickGap={28} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} stroke={AXIS_STROKE} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(102,121,143,0.2)", fontSize: 12 }} labelFormatter={formatDay} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  {(["impressions", "views", "whatsapp", "messages"] as const).map((k, i) => (
                    <Area
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={PALETTE[i]}
                      strokeWidth={2}
                      fill={`url(#m-grad-${k})`}
                      name={k[0].toUpperCase() + k.slice(1)}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Conversion funnel */}
          <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="dm-card p-5 sm:p-6">
              <h2 className="font-display text-base font-semibold">Conversion funnel</h2>
              <p className="mt-0.5 text-xs text-muted">From impression to conversation, last {analytics.window_days} days.</p>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Impressions",       value: analytics.funnel.impressions,       rate: 1 },
                  { label: "Product views",     value: analytics.funnel.views,             rate: analytics.funnel.view_rate },
                  { label: "WhatsApp clicks",   value: analytics.funnel.whatsapp_clicks,   rate: analytics.funnel.wa_rate },
                  { label: "Messages",          value: analytics.funnel.messages,          rate: analytics.funnel.msg_rate },
                ].map((row, i) => {
                  const denom = analytics.funnel.impressions || 1;
                  const pct = Math.max(2, Math.round((row.value / denom) * 100));
                  return (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold">{row.label}</span>
                        <span className="tabular-nums text-muted">
                          {fmt(row.value)}
                          {i > 0 ? ` · ${(row.rate * 100).toFixed(1)}%` : ""}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PALETTE[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Impression pool mix */}
            <div className="dm-card flex flex-col p-5 sm:p-6">
              <h2 className="font-display text-base font-semibold">Impression sources</h2>
              <p className="mt-0.5 text-xs text-muted">Which feed pool surfaced your listings.</p>
              {analytics.pool_mix.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-8 text-sm text-muted">
                  No impressions yet.
                </div>
              ) : (
                <div className="mt-3 flex justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={analytics.pool_mix}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={2}
                        labelLine={false}
                      >
                        {analytics.pool_mix.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number, n: string) => [fmt(v), n]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(102,121,143,0.2)", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* Per-shop performance */}
          {analytics.per_shop.length > 0 && (
            <section className="dm-card p-5 sm:p-6">
              <h2 className="font-display text-base font-semibold">Per-shop performance</h2>
              <p className="mt-0.5 text-xs text-muted">Impressions vs. page views vs. followers.</p>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-1 text-sm">
                  <thead className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2">Shop</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Impressions</th>
                      <th className="px-3 py-2 text-right">Views</th>
                      <th className="px-3 py-2 text-right">Likes</th>
                      <th className="px-3 py-2 text-right">Followers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.per_shop.map((row, i) => (
                      <tr key={row.id} className="rounded-xl bg-foreground/[0.03]">
                        <td className="rounded-l-xl px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: PALETTE[i % PALETTE.length] }}>
                              {i + 1}
                            </span>
                            <Link href={`/merchant/shops/${row.id}`} className="min-w-0 hover:underline">
                              <p className="truncate font-semibold">{row.name}</p>
                              <p className="truncate text-[11px] text-muted">/{row.slug}</p>
                            </Link>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            row.is_active ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
                          }`}>
                            {row.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{fmt(row.impressions)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{fmt(row.view_count)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{fmt(row.like_count)}</td>
                        <td className="rounded-r-xl px-3 py-3 text-right tabular-nums">{fmt(row.follower_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Top products */}
          {analytics.top_products.length > 0 && (
            <section className="dm-card p-5 sm:p-6">
              <h2 className="font-display text-base font-semibold">Top listings</h2>
              <p className="mt-0.5 text-xs text-muted">Ranked by impressions with view-through and contact rates.</p>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-1 text-sm">
                  <thead className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2">Listing</th>
                      <th className="px-3 py-2 text-right">Impr.</th>
                      <th className="px-3 py-2 text-right">Views</th>
                      <th className="px-3 py-2 text-right">CTR</th>
                      <th className="px-3 py-2 text-right">WA</th>
                      <th className="px-3 py-2 text-right">Msg</th>
                      <th className="px-3 py-2 text-right">Likes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_products.map((p, i) => (
                      <tr key={p.id} className="rounded-xl bg-foreground/[0.03]">
                        <td className="rounded-l-xl px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: PALETTE[i % PALETTE.length] }}>
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{p.title}</p>
                              {p.category ? <p className="truncate text-[11px] text-muted">{p.category}</p> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{fmt(p.impressions)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{fmt(p.views)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{(p.ctr * 100).toFixed(1)}%</td>
                        <td className="px-3 py-3 text-right tabular-nums">{fmt(p.whatsapp_clicks)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{fmt(p.messages)}</td>
                        <td className="rounded-r-xl px-3 py-3 text-right tabular-nums">{fmt(p.likes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Bottom row: Your Shops + Recent Activity side by side ── */}
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">

        {/* Your shops */}
        <div className="dm-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Your Shops</h2>
            <div className="flex items-center gap-2">
              <Link
                href="/merchant/shops"
                className="text-xs font-medium text-accent hover:underline underline-offset-2"
              >
                View all →
              </Link>
              <Link
                href="/merchant/new"
                className="rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                + New
              </Link>
            </div>
          </div>

          {shops.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted">You haven't opened a shop yet.</p>
              <Link href="/merchant/new" className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
                Open your first shop
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {shops.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/merchant/shops/${s.id}`}
                    className="dm-card group flex h-full flex-col gap-3 p-4 transition hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{s.name}</p>
                        <p className="truncate text-xs text-muted">{s.slug}</p>
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
                    <p className="text-[11px] font-semibold text-foreground/50 transition-colors group-hover:text-accent">
                      Open dashboard →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {shops.length > 4 && (
            <div className="mt-4 text-center">
              <Link
                href="/merchant/shops"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground"
              >
                View all {shops.length} shops →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dm-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Recent Activity</h2>
            <Link href="/merchant/leads" className="text-xs font-medium text-accent hover:underline underline-offset-2">
              View all →
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted">No activity yet.</p>
              <p className="mt-1 text-xs text-muted/60">Activity will appear here as customers interact with your shops.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/merchant/shops/${item.id}`}
                    className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-surface-subtle"
                  >
                    {/* Status dot */}
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${item.active ? "bg-emerald-500" : "bg-amber-400"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-[11px] text-muted">{item.meta}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted/60">
                      {item.updatedAt ? timeAgo(item.updatedAt) : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Quick links */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <Link href="/merchant/conversations" className="rounded-xl bg-surface-subtle px-3 py-2.5 text-center text-xs font-medium text-foreground/70 transition-colors hover:bg-border/50 hover:text-foreground">
              Conversations
            </Link>
            <Link href="/merchant/leads" className="rounded-xl bg-surface-subtle px-3 py-2.5 text-center text-xs font-medium text-foreground/70 transition-colors hover:bg-border/50 hover:text-foreground">
              Leads
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
