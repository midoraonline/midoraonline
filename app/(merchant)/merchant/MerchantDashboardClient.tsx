"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiShops } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { planHasAnalytics } from "@/lib/api/payments";
import { usePlatformAnalytics } from "@/lib/hooks/usePlatformAnalytics";
import type { MerchantAnalytics, MerchantStats, Shop } from "@/lib/api/shops";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { useAppSession } from "@/lib/state";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_TEXT,
  CARD,
  EmptyState,
  ErrorState,
  LIST,
  NUM,
  PageHeader,
  ROW,
  RowThumb,
  Section,
  Segmented,
  StatStrip,
  StatusDot,
  TD,
  TH,
  formatCount as fmt,
} from "@/components/dashboard/ui";

const GRID = "var(--border)";
const AXIS = "var(--foreground-muted)";

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function mergeSeries(trends: MerchantAnalytics["trends"]) {
  const byDay = new Map<string, { day: string; impressions: number; views: number }>();
  for (const key of ["impressions", "views"] as const) {
    for (const p of trends[key] ?? []) {
      const row = byDay.get(p.day) ?? { day: p.day, impressions: 0, views: 0 };
      row[key] = p.count;
      byDay.set(p.day, row);
    }
  }
  return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
}

const WINDOWS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;

type Props = {
  initialShops: Shop[];
  initialStats: MerchantStats | null;
};

export default function MerchantDashboardClient({ initialShops, initialStats }: Props) {
  const session = useAppSession();
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [stats, setStats] = useState<MerchantStats | null>(initialStats);
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [analyticsLocked, setAnalyticsLocked] = useState(false);
  const [analyticsEndpointOff, setAnalyticsEndpointOff] = useState(false);
  const [windowDays, setWindowDays] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);
  const canAnalytics = planHasAnalytics(session.user?.plan_tier);
  const platformAnalytics = usePlatformAnalytics();
  const analyticsOn = platformAnalytics.ready && platformAnalytics.enabled;

  const load = useCallback(async () => {
    if (!session.hydrated) return;
    setError(null);
    if (!analyticsOn || !canAnalytics) {
      setAnalyticsLocked(!analyticsOn ? false : !canAnalytics);
      setAnalytics(null);
    }
    try {
      const [shopsRes, statsRes, analyticsRes] = await Promise.all([
        apiShops.myShops(),
        apiShops.myStats().catch(() => null),
        analyticsOn && canAnalytics
          ? apiShops.myAnalytics(windowDays).catch((err) => {
              if (err instanceof ApiError && err.code === "analytics_disabled") {
                setAnalyticsEndpointOff(true);
                return null;
              }
              if (err instanceof ApiError && (err.status === 403 || err.code === "plan_upgrade_required")) {
                setAnalyticsLocked(true);
                return null;
              }
              if (err instanceof ApiError && (err.code === "timeout" || err.code === "network_error")) {
                setError("Analytics took too long to load. Try 7 days, or retry.");
                return null;
              }
              return null;
            })
          : Promise.resolve(null),
      ]);
      setShops(shopsRes.items ?? []);
      if (statsRes) setStats(statsRes);
      if (analyticsRes && apiShops.isAnalyticsDisabledBody(analyticsRes)) {
        setAnalytics(null);
        setAnalyticsEndpointOff(true);
      } else if (analyticsRes) {
        setAnalyticsEndpointOff(false);
        setAnalyticsLocked(false);
        setAnalytics(analyticsRes);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Your session expired. Sign in again to load analytics.");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load your shops");
    }
  }, [windowDays, session.hydrated, canAnalytics, analyticsOn, platformAnalytics.ready]);

  useEffect(() => { void load(); }, [load]);
  useRealtimeTable({ table: "shops", channel: "merchant-shops-overview" }, () => { void load(); });

  const active = shops.filter((s) => s.is_active);
  const pending = shops.filter((s) => !s.is_active);
  const analyticsOff = analyticsEndpointOff || (platformAnalytics.ready && !platformAnalytics.enabled);

  return (
    <div>
      <PageHeader
        title="Overview"
        description={
          shops.length
            ? `${fmt(shops.length)} ${shops.length === 1 ? "shop" : "shops"}, ${fmt(active.length)} live`
            : "Post listings now, or open a shop for a storefront and analytics."
        }
        action={
          <Link href="/open-shop" className={BTN_PRIMARY}>
            New shop
          </Link>
        }
      />

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {stats ? (
        <StatStrip
          items={[
            { label: "Listings", value: fmt(stats.total_products) },
            { label: "Listing views", value: fmt(stats.total_product_views) },
            { label: "WhatsApp clicks", value: fmt(stats.total_whatsapp_clicks) },
            { label: "Messages", value: fmt(stats.total_messages) },
          ]}
        />
      ) : null}

      {pending.length > 0 ? (
        <Section title="Needs attention" description="These shops are not live yet.">
          <ul className={LIST}>
            {pending.map((s) => (
              <li key={s.id}>
                <Link href={`/merchant/shops/${s.id}/verification`} className={ROW}>
                  <RowThumb src={s.logo_url} label={s.name} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
                  <StatusDot tone="warn">Pending review</StatusDot>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {analyticsOff ? (
        <Section title="Analytics">
          <p className="text-sm text-muted">Analytics is turned off right now.</p>
        </Section>
      ) : null}

      {analyticsOn && analyticsLocked ? (
        <Section title="Analytics">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface shadow-xs p-5">
            <p className="text-sm text-muted">
              Impressions, trends and the contact funnel are on the Standard plan and above.
            </p>
            <Link href="/merchant/billing" className={BTN_SECONDARY}>
              See plans
            </Link>
          </div>
        </Section>
      ) : null}

      {analyticsOn && analytics ? (
        <>
          <Section
            title={`${fmt(analytics.summary.total_impressions)} impressions in the last ${analytics.window_days} days`}
            description={`${fmt(analytics.summary.total_product_views)} listing views from those impressions.`}
          >
            <div className={`${CARD} p-4 sm:p-5`}>
            <div className="mb-4 flex justify-end">
              <Segmented
                options={WINDOWS}
                value={String(windowDays) as (typeof WINDOWS)[number]["value"]}
                onChange={(v) => setWindowDays(Number(v))}
              />
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mergeSeries(analytics.trends)} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashAccentFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" strokeOpacity={0.8} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} tickFormatter={formatDay} minTickGap={28} />
                  <YAxis tick={{ fontSize: 11, fill: AXIS }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    labelFormatter={formatDay}
                    contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 12, boxShadow: "var(--shadow-md)" }}
                  />
                  <Area type="monotone" dataKey="views" name="Views" stroke={AXIS} strokeWidth={1.5} strokeDasharray="4 3" fill="transparent" />
                  <Area type="monotone" dataKey="impressions" name="Impressions" stroke="var(--accent)" strokeWidth={2} fill="url(#dashAccentFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            </div>
          </Section>

          <Section title="Contact funnel" description={`Last ${analytics.window_days} days.`}>
            <ul className={LIST}>
              {[
                { label: "Impressions", value: analytics.funnel.impressions, rate: null },
                { label: "Listing views", value: analytics.funnel.views, rate: analytics.funnel.view_rate },
                { label: "WhatsApp clicks", value: analytics.funnel.whatsapp_clicks, rate: analytics.funnel.wa_rate },
                { label: "Messages", value: analytics.funnel.messages, rate: analytics.funnel.msg_rate },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="flex-1">{row.label}</span>
                  <span className="tabular-nums">{fmt(row.value)}</span>
                  <span className="w-14 text-right text-xs tabular-nums text-muted">
                    {row.rate == null ? "" : `${(row.rate * 100).toFixed(1)}%`}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          {analytics.top_products.length > 0 ? (
            <Section title="Top listings" description="Ranked by impressions.">
              <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-surface-subtle">
                    <tr>
                      <th className={TH}>Listing</th>
                      <th className={`${TH} text-right`}>Impressions</th>
                      <th className={`${TH} hidden text-right sm:table-cell`}>Views</th>
                      <th className={`${TH} hidden text-right sm:table-cell`}>CTR</th>
                      <th className={`${TH} text-right`}>WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analytics.top_products.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-surface-subtle">
                        <td className={`${TD} max-w-[12rem]`}>
                          <p className="truncate font-medium">{p.title}</p>
                          {p.category ? <p className="truncate text-xs text-muted">{p.category}</p> : null}
                        </td>
                        <td className={`${TD} ${NUM}`}>{fmt(p.impressions)}</td>
                        <td className={`${TD} ${NUM} hidden sm:table-cell`}>{fmt(p.views)}</td>
                        <td className={`${TD} ${NUM} hidden sm:table-cell`}>{(p.ctr * 100).toFixed(1)}%</td>
                        <td className={`${TD} ${NUM}`}>{fmt(p.whatsapp_clicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : null}
        </>
      ) : null}

      <Section
        title="Your shops"
        action={
          shops.length > 0 ? (
            <Link href="/merchant/shops" className={BTN_TEXT}>
              View all
            </Link>
          ) : null
        }
      >
        {shops.length === 0 ? (
          <EmptyState
            message="No shop yet. You can still post listings."
            action={
              <Link href="/post-item" className={BTN_SECONDARY}>
                Post a listing
              </Link>
            }
          />
        ) : (
          <ul className={LIST}>
            {shops.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link href={`/merchant/shops/${s.id}`} className={ROW}>
                  <RowThumb src={s.logo_url} label={s.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{s.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {fmt(s.view_count)} views · {fmt(s.follower_count)} followers
                    </span>
                  </span>
                  <StatusDot tone={s.is_active ? "ok" : "warn"}>{s.is_active ? "Live" : "Pending"}</StatusDot>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
