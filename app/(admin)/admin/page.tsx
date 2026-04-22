"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiAdmin } from "@/lib/api";
import type { AdminStatsOverview } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/base";
import { useRealtimeTable } from "@/lib/realtime/hooks";

const PALETTE = [
  "#4a6767", // primary (teal)
  "#66798f", // accent (slate blue)
  "#d49b63", // warm amber
  "#8b6f9f", // dusty purple
  "#6a9379", // sage
  "#c17767", // terracotta
  "#5b7c99", // steel
  "#a68868", // taupe
  "#9b5f6a", // muted rose
  "#7d8c6a", // olive
];

const CARTESIAN_STROKE = "rgba(102, 121, 143, 0.18)";
const AXIS_STROKE = "rgba(42,51,49,0.5)";

function fmt(n: number) {
  return new Intl.NumberFormat().format(n);
}

function fmtCurrency(n: number) {
  return `UGX ${new Intl.NumberFormat().format(Math.round(n))}`;
}

function shortLabel(str: string, max = 22) {
  if (!str) return "";
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminStatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isInitial: boolean) => {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await apiAdmin.statsOverview();
        setData(res);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load platform stats",
        );
      } finally {
        if (isInitial) setLoading(false);
        else setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  // Refresh when underlying tables change.
  useRealtimeTable({ table: "shops", channel: "admin-overview-shops" }, () =>
    load(false),
  );
  useRealtimeTable({ table: "products", channel: "admin-overview-products" }, () =>
    load(false),
  );
  useRealtimeTable(
    { table: "shop_verifications", channel: "admin-overview-verifications" },
    () => load(false),
  );

  const trendData = useMemo(() => {
    if (!data) return [];
    const byDay = new Map<string, { day: string; shops: number; products: number; users: number; orders: number }>();
    const put = (
      key: "shops" | "products" | "users" | "orders",
      series: AdminStatsOverview["trends"]["shops"] | undefined,
    ) => {
      for (const point of series ?? []) {
        const row = byDay.get(point.day) ?? {
          day: point.day,
          shops: 0,
          products: 0,
          users: 0,
          orders: 0,
        };
        row[key] = point.count;
        byDay.set(point.day, row);
      }
    };
    put("shops", data.trends.shops);
    put("products", data.trends.products);
    put("users", data.trends.users);
    put("orders", data.trends.orders);
    return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
  }, [data]);

  const topShopsChart = useMemo(() => {
    if (!data) return [];
    return data.top_shops.map((s) => ({
      name: shortLabel(s.name || s.slug || s.id.slice(0, 8), 22),
      fullName: s.name,
      slug: s.slug,
      views: s.view_count,
      products: s.product_count,
      likes: s.like_count,
      followers: s.follower_count,
      verification: s.verification_status,
    }));
  }, [data]);

  const topProductsChart = useMemo(() => {
    if (!data) return [];
    return data.top_products.map((p) => ({
      name: shortLabel(p.title || p.id.slice(0, 8), 22),
      fullName: p.title,
      shop: p.shop_name || "",
      views: p.view_count,
      likes: p.like_count,
      price: p.price_ugx,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <p className="text-sm text-muted">Loading platform stats…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Header onRefresh={() => load(false)} refreshing={refreshing} generated={null} />
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const s = data.summary;

  return (
    <div className="space-y-6 sm:space-y-8">
      <Header
        onRefresh={() => load(false)}
        refreshing={refreshing}
        generated={data.generated_at}
      />

      {/* KPI row */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard
          label="Shops"
          value={fmt(s.total_shops)}
          sub={`${fmt(s.active_shops)} active`}
          href="/admin/shops"
          accent={PALETTE[0]}
        />
        <KpiCard
          label="Products"
          value={fmt(s.total_products)}
          sub={`${fmt(s.total_product_views)} views`}
          accent={PALETTE[1]}
        />
        <KpiCard
          label="Users"
          value={fmt(s.total_users)}
          sub={data.role_breakdown
            .map((r) => `${r.count} ${r.role}`)
            .slice(0, 2)
            .join(" · ") || "—"}
          accent={PALETTE[3]}
        />
        <KpiCard
          label="Pending verifications"
          value={fmt(s.pending_verifications)}
          sub={`${fmt(s.verified_shops)} verified`}
          href="/admin/verifications"
          accent={PALETTE[2]}
          tone="warn"
        />
        <KpiCard
          label="Orders"
          value={fmt(s.total_orders)}
          sub={fmtCurrency(s.total_revenue_ugx)}
          accent={PALETTE[4]}
        />
        <KpiCard
          label="Subscription revenue"
          value={fmtCurrency(s.total_subscription_revenue_ugx)}
          sub="Completed payments"
          href="/admin/subscriptions"
          accent={PALETTE[5]}
        />
      </section>

      {/* Growth trend */}
      <section className="dm-card p-5 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Growth trend
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Daily new shops, products, signups, and orders over the last{" "}
              {data.window_days} days.
            </p>
          </div>
        </div>
        <div className="mt-6 h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <defs>
                {(["shops", "products", "users", "orders"] as const).map((k, i) => (
                  <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE[i]} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PALETTE[i]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CARTESIAN_STROKE} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                stroke={AXIS_STROKE}
                tickFormatter={formatDay}
                minTickGap={32}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke={AXIS_STROKE} />
              <Tooltip
                labelFormatter={(v: string) => formatDay(v)}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(102, 121, 143, 0.25)",
                  backgroundColor: "rgba(255,255,255,0.98)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              {(["shops", "products", "users", "orders"] as const).map((k, i) => (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={PALETTE[i]}
                  strokeWidth={2}
                  fill={`url(#grad-${k})`}
                  name={k[0].toUpperCase() + k.slice(1)}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top shops + verification mix */}
      <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        <section className="dm-card p-5 sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Most visited shops
              </h2>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Top 10 by recorded page views.
              </p>
            </div>
            <Link
              href="/admin/shops"
              className="text-xs font-semibold text-foreground/75 hover:text-foreground"
            >
              Manage shops →
            </Link>
          </div>
          {topShopsChart.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No shop traffic yet.</p>
          ) : (
            <div
              className="mt-6 w-full"
              style={{ height: Math.max(300, topShopsChart.length * 40) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topShopsChart}
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CARTESIAN_STROKE} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} stroke={AXIS_STROKE} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 11 }}
                    stroke={AXIS_STROKE}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(102,121,143,0.08)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(102, 121, 143, 0.25)",
                      backgroundColor: "rgba(255,255,255,0.98)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [fmt(value), "Views"]}
                    labelFormatter={(_label, payload) => {
                      const row = (payload?.[0]?.payload ?? {}) as { fullName?: string };
                      return row.fullName || "";
                    }}
                  />
                  <Bar dataKey="views" radius={[0, 8, 8, 0]}>
                    {topShopsChart.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="dm-card flex flex-col p-5 sm:p-6 lg:col-span-2">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Verification mix
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Where shops stand today.
            </p>
          </div>
          <DistributionChart
            slices={data.distributions.verification_status}
            emptyLabel="No shops yet"
          />
        </section>
      </div>

      {/* Top products + shop types */}
      <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        <section className="dm-card p-5 sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Most viewed products
              </h2>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Top 10 by product detail views.
              </p>
            </div>
          </div>
          {topProductsChart.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No product views yet.</p>
          ) : (
            <div
              className="mt-6 w-full"
              style={{ height: Math.max(300, topProductsChart.length * 40) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topProductsChart}
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CARTESIAN_STROKE} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} stroke={AXIS_STROKE} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 11 }}
                    stroke={AXIS_STROKE}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(102,121,143,0.08)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(102, 121, 143, 0.25)",
                      backgroundColor: "rgba(255,255,255,0.98)",
                      fontSize: 12,
                    }}
                    labelFormatter={(_label, payload) => {
                      const row = (payload?.[0]?.payload ?? {}) as { fullName?: string; shop?: string };
                      return `${row.fullName || ""}${row.shop ? ` — ${row.shop}` : ""}`;
                    }}
                    formatter={(value: number) => [fmt(value), "Views"]}
                  />
                  <Bar dataKey="views" radius={[0, 8, 8, 0]}>
                    {topProductsChart.map((_, i) => (
                      <Cell key={i} fill={PALETTE[(i + 1) % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="dm-card p-5 sm:p-6 lg:col-span-2">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Shop types
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Breakdown of product / service / both.
            </p>
          </div>
          <DistributionChart
            slices={data.distributions.shop_types}
            emptyLabel="No shops yet"
          />
        </section>
      </div>

      {/* Categories + order status + item types */}
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <section className="dm-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Product categories
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Share of each category across the catalogue.
          </p>
          <DistributionChart
            slices={data.distributions.product_categories}
            emptyLabel="No products yet"
          />
        </section>
        <section className="dm-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Item types
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Products vs. services across the platform.
          </p>
          <DistributionChart
            slices={data.distributions.product_item_types}
            emptyLabel="No items yet"
          />
        </section>
        <section className="dm-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Order status
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Current distribution of order outcomes.
          </p>
          <DistributionChart
            slices={data.distributions.order_status}
            emptyLabel="No orders yet"
          />
        </section>
      </div>

      {/* User roles + orders trend simplified */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section className="dm-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            User roles
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Customers vs. merchants vs. admins.
          </p>
          <DistributionChart
            slices={data.role_breakdown.map((r) => ({
              label: r.role,
              value: r.count,
            }))}
            emptyLabel="No users yet"
          />
        </section>
        <section className="dm-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Shops created per day
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Granular view of the shop creation curve.
          </p>
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends.shops} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CARTESIAN_STROKE} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  stroke={AXIS_STROKE}
                  tickFormatter={formatDay}
                  minTickGap={32}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke={AXIS_STROKE} />
                <Tooltip
                  labelFormatter={(v: string) => formatDay(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(102, 121, 143, 0.25)",
                    backgroundColor: "rgba(255,255,255,0.98)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={PALETTE[0]}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: PALETTE[0] }}
                  activeDot={{ r: 5 }}
                  name="New shops"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Top shops table */}
      <section className="dm-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Top shops leaderboard
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Engagement snapshot for the highest-traffic storefronts.
            </p>
          </div>
          <Link
            href="/admin/shops"
            className="text-xs font-semibold text-foreground/75 hover:text-foreground"
          >
            Manage shops →
          </Link>
        </div>
        {data.top_shops.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No shops yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1 text-sm">
              <thead className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Shop</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Views</th>
                  <th className="px-3 py-2 text-right">Products</th>
                  <th className="px-3 py-2 text-right">Likes</th>
                  <th className="px-3 py-2 text-right">Followers</th>
                </tr>
              </thead>
              <tbody>
                {data.top_shops.map((shop, i) => (
                  <tr key={shop.id} className="rounded-xl bg-foreground/[0.03]">
                    <td className="rounded-l-xl px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{shop.name}</p>
                          <p className="truncate text-[11px] text-muted">/{shop.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <VerificationBadge status={shop.verification_status} active={!!shop.is_active} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmt(shop.view_count)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmt(shop.product_count)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmt(shop.like_count)}</td>
                    <td className="rounded-r-xl px-3 py-3 text-right tabular-nums">
                      {fmt(shop.follower_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Header({
  onRefresh,
  refreshing,
  generated,
}: {
  onRefresh: () => void;
  refreshing: boolean;
  generated: string | null;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Admin
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Platform overview
        </h1>
        <p className="mt-2 text-sm text-muted">
          Live snapshot of shops, products, engagement, and revenue.
          {generated ? (
            <>
              {" "}
              <span className="text-muted/70">
                Updated {new Date(generated).toLocaleTimeString()}.
              </span>
            </>
          ) : null}
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-foreground/[0.04] disabled:opacity-60"
      >
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </header>
  );
}

function KpiCard({
  label,
  value,
  sub,
  href,
  accent,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  accent: string;
  tone?: "warn";
}) {
  const inner = (
    <div className="dm-card group flex h-full flex-col gap-2 p-4 sm:p-5 transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <span
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: accent }}
        />
      </div>
      <p
        className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
        style={{ color: tone === "warn" ? "#b45309" : "inherit" }}
      >
        {value}
      </p>
      {sub ? <p className="mt-auto truncate text-xs text-muted">{sub}</p> : null}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="contents">
        {inner}
      </Link>
    );
  }
  return inner;
}

function DistributionChart({
  slices,
  emptyLabel,
}: {
  slices: { label: string; value: number }[];
  emptyLabel: string;
}) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  if (!total) {
    return <p className="mt-6 text-sm text-muted">{emptyLabel}.</p>;
  }
  return (
    <div className="mt-4">
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={82}
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="rgba(255,255,255,0.8)"
              strokeWidth={1.5}
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name) => [fmt(value), name as string]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(102, 121, 143, 0.25)",
                backgroundColor: "rgba(255,255,255,0.98)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        {slices.map((slice, i) => {
          const pct = total > 0 ? (slice.value / total) * 100 : 0;
          return (
            <li
              key={`${slice.label}-${i}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-foreground/[0.03] px-2.5 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                <span className="truncate capitalize text-foreground/85">
                  {slice.label || "—"}
                </span>
              </span>
              <span className="tabular-nums text-muted">
                {fmt(slice.value)} <span className="text-muted/70">({pct.toFixed(0)}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function VerificationBadge({
  status,
  active,
}: {
  status: "unverified" | "pending" | "verified" | "rejected";
  active: boolean;
}) {
  const tone =
    status === "verified"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : status === "pending"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : status === "rejected"
          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
          : "bg-foreground/[0.06] text-foreground/70";
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-max rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
      >
        {status}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
