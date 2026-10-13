"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiShops } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { planHasAnalytics } from "@/lib/api/payments";
import { usePlatformAnalytics } from "@/lib/hooks/usePlatformAnalytics";
import type { Shop, ShopEngagement } from "@/lib/api/shops";
import type { Product } from "@/lib/api/products";
import {
  BTN_SECONDARY,
  EmptyState,
  ErrorState,
  NUM,
  PageSkeleton,
  Section,
  StatStrip,
  TD,
  TH,
  formatCount,
} from "@/components/dashboard/ui";
import { useAppSession } from "@/lib/state";
import { canManageShopStorefront } from "@/lib/shop/storefront-access";

export default function ShopAnalyticsPage({ shop }: { shop: Shop }) {
  const session = useAppSession();
  const platformAnalytics = usePlatformAnalytics();
  const canManage = canManageShopStorefront(session, shop.id);
  const hydrated = session.hydrated;

  const [engagement, setEngagement] = useState<ShopEngagement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopProfile, setShopProfile] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planLocked, setPlanLocked] = useState(false);

  const load = useCallback(async () => {
    if (!session.isAuthenticated) return;
    setLoading(true);
    setError(null);
    if (!planHasAnalytics(session.user?.plan_tier)) {
      setPlanLocked(true);
      setLoading(false);
      return;
    }
    setPlanLocked(false);
    try {
      const dash = await apiShops.getShopDashboard(shop.id);
      setEngagement(dash.engagement);
      setProducts(dash.products ?? []);
      setShopProfile(dash.shop as Shop);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.code === "plan_upgrade_required")) {
        setPlanLocked(true);
      } else if (err instanceof ApiError && err.code === "timeout") {
        setError("Analytics took too long to load. Retry in a moment.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      }
    } finally {
      setLoading(false);
    }
  }, [shop.id, session.isAuthenticated, session.user?.plan_tier]);

  useEffect(() => {
    if (!hydrated) return;
    if (!canManage) {
      setLoading(false);
      return;
    }
    if (!platformAnalytics.ready) return;
    if (!platformAnalytics.enabled) {
      setLoading(false);
      return;
    }
    void load();
  }, [hydrated, canManage, load, platformAnalytics.ready, platformAnalytics.enabled]);

  const shopBars = useMemo(() => {
    const views = Number(
      engagement?.view_count ?? shopProfile?.view_count ?? 0
    );
    return [
      { name: "Page views", value: views },
      { name: "Likes", value: Number(engagement?.like_count ?? 0) },
      { name: "Followers", value: Number(engagement?.follower_count ?? 0) },
      { name: "WhatsApp", value: Number(engagement?.whatsapp_clicks ?? 0) },
      { name: "Messages", value: Number(engagement?.messages ?? 0) },
    ];
  }, [engagement, shopProfile]);

  const productViewRows = useMemo(() => {
    return [...products]
      .map((p) => ({
        name: p.title.length > 26 ? `${p.title.slice(0, 24)}…` : p.title,
        fullTitle: p.title,
        views: Number(p.view_count ?? 0),
        likes: Number(p.like_count ?? 0),
        whatsapp: Number(p.whatsapp_clicks ?? 0),
        messages: Number(p.messages ?? 0),
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 16);
  }, [products]);

  if (!hydrated) return <PageSkeleton stats label="Loading analytics" />;

  if (!canManage) {
    return (
      <EmptyState
        message="Sign in as this shop's owner or an admin to see analytics."
        action={
          <Link href={`/shops/${shop.slug}`} className={BTN_SECONDARY}>
            Back to shop
          </Link>
        }
      />
    );
  }

  if (platformAnalytics.ready && !platformAnalytics.enabled) {
    return <EmptyState message="Analytics is turned off right now." />;
  }

  if (planLocked) {
    return (
      <EmptyState
        message="Shop analytics is on the Standard plan and above."
        action={
          <Link href="/merchant/billing" className={BTN_SECONDARY}>
            See plans
          </Link>
        }
      />
    );
  }

  if (loading) return <PageSkeleton stats label="Loading analytics" />;

  return (
    <div>
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      <StatStrip items={shopBars.map((row) => ({ label: row.name, value: formatCount(row.value) }))} />

      <Section title="Listings" description="Top listings by views.">
        {productViewRows.length === 0 ? (
          <EmptyState message="No listings in this shop yet." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className={TH}>Listing</th>
                  <th className={`${TH} text-right`}>Views</th>
                  <th className={`${TH} hidden text-right sm:table-cell`}>Likes</th>
                  <th className={`${TH} text-right`}>WhatsApp</th>
                  <th className={`${TH} hidden text-right sm:table-cell`}>Messages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productViewRows.map((r) => (
                  <tr key={r.fullTitle} className="transition-colors hover:bg-surface-subtle">
                    <td className={`${TD} max-w-[12rem] truncate font-medium`} title={r.fullTitle}>
                      {r.fullTitle}
                    </td>
                    <td className={`${TD} ${NUM}`}>{formatCount(r.views)}</td>
                    <td className={`${TD} ${NUM} hidden sm:table-cell`}>{formatCount(r.likes)}</td>
                    <td className={`${TD} ${NUM}`}>{formatCount(r.whatsapp)}</td>
                    <td className={`${TD} ${NUM} hidden sm:table-cell`}>{formatCount(r.messages)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
