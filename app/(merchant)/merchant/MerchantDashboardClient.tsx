"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { planHasAnalytics } from "@/lib/api/payments";
import { usePlatformAnalytics } from "@/lib/hooks/usePlatformAnalytics";
import type { MerchantAnalytics, MerchantStats, Shop } from "@/lib/api/shops";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { useAppSession } from "@/lib/state";
import { ActivityChart, ActivityHeadline, PERIODS, type Period } from "@/components/dashboard/ListingActivity";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_TEXT,
  EmptyState,
  ErrorState,
  LIST,
  NUM,
  PageHeader,
  ROW,
  RowThumb,
  Section,
  Select,
  StatStrip,
  StatusDot,
  TD,
  TH,
  formatCount as fmt,
} from "@/components/dashboard/ui";

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
  const platformAnalytics = usePlatformAnalytics();
  const analyticsOn = platformAnalytics.ready && platformAnalytics.enabled;
  const canAnalytics = platformAnalytics.allPlans || planHasAnalytics(session.user?.plan_tier);

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
      setError(err instanceof Error ? err.message : "Couldn't load your business");
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
            : "Post ads now, or create a business for a storefront and analytics."
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
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{s.name}</span>
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
              Impressions, reach, views and contacts for each listing are on the Standard plan and above.
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
            title={`How your ads did in the last ${analytics.window_days} days`}
            description="Impressions count every time an ad was on someone's screen for at least a second, even without a tap."
            action={
              <Select
                label="Period"
                hideLabel
                className="w-40"
                options={PERIODS}
                value={String(windowDays) as Period}
                onChange={(v) => setWindowDays(Number(v))}
              />
            }
          >
            <ActivityHeadline stats={analytics.summary} />
            <ActivityChart daily={analytics.daily} />
          </Section>

          {analytics.listings.length > 0 ? (
            <Section title="Your listings" description="Ranked by impressions. Tap a listing for its full breakdown.">
              <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-surface-subtle">
                    <tr>
                      <th className={TH}>Listing</th>
                      <th className={`${TH} text-right`}>Impressions</th>
                      <th className={`${TH} hidden text-right md:table-cell`}>Reach</th>
                      <th className={`${TH} text-right`}>Views</th>
                      <th className={`${TH} hidden text-right sm:table-cell`}>WhatsApp</th>
                      <th className={`${TH} hidden text-right md:table-cell`}>Messages</th>
                      <th className={`${TH} hidden text-right lg:table-cell`}>Likes</th>
                      <th className={`${TH} hidden text-right lg:table-cell`}>Comments</th>
                      <th className={`${TH} hidden text-right lg:table-cell`}>Reports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analytics.listings.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-surface-subtle">
                        <td className={`${TD} max-w-[14rem]`}>
                          <Link href={`/merchant/listings/${p.id}/stats`} className="block hover:underline">
                            <span className="block truncate font-medium">{p.title || "Untitled"}</span>
                            <span className="block truncate text-xs text-muted">
                              {p.live ? p.category ?? "Live" : "Not live"}
                            </span>
                          </Link>
                        </td>
                        <td className={`${TD} ${NUM}`}>{fmt(p.impressions)}</td>
                        <td className={`${TD} ${NUM} hidden md:table-cell`}>{fmt(p.reach)}</td>
                        <td className={`${TD} ${NUM}`}>{fmt(p.views)}</td>
                        <td className={`${TD} ${NUM} hidden sm:table-cell`}>{fmt(p.whatsapp_clicks)}</td>
                        <td className={`${TD} ${NUM} hidden md:table-cell`}>{fmt(p.messages)}</td>
                        <td className={`${TD} ${NUM} hidden lg:table-cell`}>{fmt(p.likes)}</td>
                        <td className={`${TD} ${NUM} hidden lg:table-cell`}>{fmt(p.comments)}</td>
                        <td className={`${TD} ${NUM} hidden lg:table-cell`}>{fmt(p.reports)}</td>
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
        title="My business"
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
            message="No business yet. You can still post ads."
            action={
              <Link href="/post-item" className={BTN_SECONDARY}>
                Post an ad
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
                    <span className="block truncate text-sm font-semibold">{s.name}</span>
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
