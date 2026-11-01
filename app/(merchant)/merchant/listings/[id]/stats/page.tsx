"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";

import { apiShops } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import {
  ActivityBreakdown,
  ActivityChart,
  ActivityHeadline,
  PERIODS,
  type Period,
} from "@/components/dashboard/ListingActivity";
import {
  BTN_SECONDARY,
  BTN_TEXT,
  ErrorState,
  PageHeader,
  PageSkeleton,
  Section,
  Select,
  StatusDot,
  relativeTime,
} from "@/components/dashboard/ui";

export default function ListingStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [period, setPeriod] = useState<Period>("30");
  const { data, error, isLoading, mutate } = useSWR(["listing-stats", id, period], () =>
    apiShops.listingStats(id, Number(period)),
  );

  if (isLoading && !data) return <PageSkeleton stats rows={6} label="Loading listing stats" />;

  if (error instanceof ApiError && (error.status === 403 || error.code === "plan_upgrade_required")) {
    return (
      <Section title="Listing stats">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-sm text-muted">Listing stats aren&apos;t included in your plan.</p>
          <Link href="/merchant/billing" className={BTN_SECONDARY}>
            See plans
          </Link>
        </div>
      </Section>
    );
  }
  if (error) {
    return <ErrorState message={error instanceof Error ? error.message : "Couldn't load stats."} onRetry={() => void mutate()} />;
  }
  if (!data || apiShops.isAnalyticsDisabledBody(data)) {
    return (
      <Section title="Listing stats">
        <p className="text-sm text-muted">Analytics is turned off right now.</p>
      </Section>
    );
  }

  const { listing, stats, daily } = data;
  return (
    <div>
      <PageHeader
        title="Listing stats"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{listing.title || "Untitled"}</span>
            <StatusDot tone={listing.live ? "ok" : "neutral"}>{listing.live ? "Live" : "Not live"}</StatusDot>
            {listing.posted_at ? <span>Posted {relativeTime(listing.posted_at)}</span> : null}
          </span>
        }
        action={
          <>
            <Link href={`/merchant/listings/${id}/edit`} className={BTN_TEXT}>
              Edit listing
            </Link>
            <Select label="Period" hideLabel className="w-40" options={PERIODS} value={period} onChange={setPeriod} />
          </>
        }
      />
      <ActivityHeadline stats={stats} />
      <Section title="Day by day" description="Impressions, listing views and contacts (WhatsApp, calls and messages).">
        <ActivityChart daily={daily} />
      </Section>
      <Section
        title="Everything people did"
        description="Your own views and taps are not counted. An impression is counted at most once per person every 10 minutes."
      >
        <ActivityBreakdown stats={stats} />
      </Section>
    </div>
  );
}
