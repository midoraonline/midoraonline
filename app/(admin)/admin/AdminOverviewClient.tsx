"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiAdmin } from "@/lib/api";
import type { AdminStatsOverview } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/base";
import { useRealtimeTable, usePresenceBreakdown } from "@/lib/realtime/hooks";
import {
  BTN_SECONDARY,
  EmptyState,
  ErrorState,
  LIST,
  PageHeader,
  PageSkeleton,
  ROW,
  Section,
  StatStrip,
  formatCount as fmt,
  formatUGXShort,
  relativeTime,
} from "@/components/dashboard/ui";

const GRID = "var(--border)";
const AXIS = "var(--foreground-muted)";

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AdminOverviewClient({ initialData }: { initialData: AdminStatsOverview | null }) {
  const [data, setData] = useState<AdminStatsOverview | null>(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh when underlying tables change.
  useRealtimeTable({ table: "shops", channel: "admin-overview-shops" }, () => {
    void load();
  });
  useRealtimeTable({ table: "products", channel: "admin-overview-products" }, () => {
    void load();
  });
  useRealtimeTable(
    { table: "shop_verifications", channel: "admin-overview-verifications" },
    () => {
      void load();
    },
  );

  // Live global presence — read-only view, admin passively tracks with role
  const presence = usePresenceBreakdown(
    "midora:presence:global",
    { role: "admin" },
    true,
  );

  const trendData = useMemo(() => {
    if (!data) return [];
    const byDay = new Map<string, { day: string; shops: number; products: number; users: number }>();
    const put = (
      key: "shops" | "products" | "users",
      series: AdminStatsOverview["trends"]["shops"] | undefined,
    ) => {
      for (const point of series ?? []) {
        const row = byDay.get(point.day) ?? {
          day: point.day,
          shops: 0,
          products: 0,
          users: 0,
        };
        row[key] = point.count;
        byDay.set(point.day, row);
      }
    };
    put("shops", data.trends.shops);
    put("products", data.trends.products);
    put("users", data.trends.users);
    return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
  }, [data]);

  const refreshButton = (
    <button type="button" onClick={() => void load()} disabled={refreshing} className={BTN_SECONDARY}>
      {refreshing ? "Refreshing…" : "Refresh"}
    </button>
  );

  if (!data && !error) return <PageSkeleton stats label="Loading platform stats" />;

  if (!data) {
    return (
      <div>
        <PageHeader title="Platform overview" action={refreshButton} />
        <ErrorState message={error} onRetry={() => void load()} />
      </div>
    );
  }

  const s = data.summary;
  const attention = [
    { label: "Verifications waiting", count: s.pending_verifications, href: "/admin/verifications" },
    { label: "Open reports", count: s.total_reports, href: "/admin/reports" },
    { label: "Flagged comments", count: s.total_flagged_comments, href: "/admin/comments" },
  ].filter((a) => a.count > 0);

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description={
          <>
            {fmt(presence.total)} online now, {fmt(presence.merchants)} merchants.
            {data.generated_at ? (
              <span title={new Date(data.generated_at).toLocaleString()}> Updated {relativeTime(data.generated_at)}.</span>
            ) : null}
          </>
        }
        action={refreshButton}
      />

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      <StatStrip
        items={[
          { label: "Shops", value: fmt(s.total_shops), hint: `${fmt(s.active_shops)} live` },
          { label: "Listings", value: fmt(s.total_products), hint: `${fmt(s.total_product_views)} views` },
          { label: "Users", value: fmt(s.total_users) },
          { label: "Subscription revenue", value: formatUGXShort(s.total_subscription_revenue_ugx) },
        ]}
      />

      <Section title="Needs attention">
        {attention.length === 0 ? (
          <EmptyState message="Nothing waiting on you." />
        ) : (
          <ul className={LIST}>
            {attention.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className={ROW}>
                  <span className="flex-1 text-sm font-medium">{a.label}</span>
                  <span className="text-sm tabular-nums text-[color:var(--warning)]">{fmt(a.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {trendData.length > 0 ? (
        <Section
          title={`${fmt(trendData.reduce((n, d) => n + d.products, 0))} new listings in this window`}
          description="New listings per day, with new users in grey."
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} strokeOpacity={0.6} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} tickFormatter={formatDay} minTickGap={28} />
                <YAxis tick={{ fontSize: 11, fill: AXIS }} allowDecimals={false} stroke={GRID} />
                <Tooltip
                  labelFormatter={formatDay}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="users" name="Users" stroke={AXIS} strokeWidth={1.5} fill="transparent" />
                <Area type="monotone" dataKey="products" name="Listings" stroke="var(--accent)" strokeWidth={2} fill="var(--accent)" fillOpacity={0.08} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
      ) : null}

      <div className="grid gap-x-8 lg:grid-cols-2">
        <Section title="Top shops" action={<Link href="/admin/shops" className="text-sm text-muted hover:text-foreground">All shops</Link>}>
          {data.top_shops.length === 0 ? (
            <EmptyState message="No shops yet." />
          ) : (
            <ul className={LIST}>
              {data.top_shops.slice(0, 6).map((shop) => (
                <li key={shop.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{shop.name || shop.slug}</span>
                    <span className="block text-xs tabular-nums text-muted">
                      {fmt(shop.product_count)} listings · {fmt(shop.follower_count)} followers
                    </span>
                  </span>
                  <span className="text-xs tabular-nums text-muted">{fmt(shop.view_count)} views</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Top listings" action={<Link href="/admin/listings" className="text-sm text-muted hover:text-foreground">All listings</Link>}>
          {data.top_products.length === 0 ? (
            <EmptyState message="No listings yet." />
          ) : (
            <ul className={LIST}>
              {data.top_products.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.title}</span>
                    <span className="block truncate text-xs text-muted">{p.shop_name || "No shop"}</span>
                  </span>
                  <span className="text-xs tabular-nums text-muted">{fmt(p.view_count)} views</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
