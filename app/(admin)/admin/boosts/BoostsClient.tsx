"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/base";
import { ADMIN_ACTIVE_BOOSTS_KEY, adminEndBoost, listActiveBoosts } from "@/lib/api/adminPlans";
import { refreshAfterRankChange } from "@/lib/api/listingActions";
import { boostEndsLabel, boostPackageLabel, boostScopeLabel, boostSourceLabel, boostTimeLeft } from "@/lib/boostInfo";
import { BTN_TEXT, EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/dashboard/ui";


export default function BoostsClient() {
  const { data, error, isLoading, mutate } = useSWR(ADMIN_ACTIVE_BOOSTS_KEY, listActiveBoosts);
  const [ending, setEnding] = useState<string | null>(null);

  async function end(id: string) {
    setEnding(id);
    try {
      await adminEndBoost(id);
      await mutate((prev) => prev?.filter((b) => b.id !== id), { revalidate: false });
      toast.success("Boost ended");
      refreshAfterRankChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't end boost.");
    } finally {
      setEnding(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Boosts"
        description="Active boosts. Grant free test boosts from a listing, business or user."
      />
      {error ? (
        <ErrorState
          message={error instanceof ApiError && error.status === 503 ? "Run migration 059 first." : "Couldn't load boosts."}
          onRetry={() => void mutate()}
        />
      ) : null}
      {isLoading && !data ? <PageSkeleton rows={4} label="Loading boosts" /> : null}
      {data && data.length === 0 ? <EmptyState message="No active boosts." /> : null}
      {data && data.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-foreground-muted">
                <th className="px-4 py-2 font-semibold">Listing</th>
                <th className="px-3 py-2 font-semibold">Business</th>
                <th className="px-3 py-2 font-semibold">Scope</th>
                <th className="px-3 py-2 font-semibold">Package</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Score</th>
                <th className="px-3 py-2 font-semibold">Ends (EAT)</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((b) => (
                <tr key={b.id}>
                  <td className="max-w-[16rem] px-4 py-2">
                    <Link href={`/admin/listings/${b.listing_id}`} className="block truncate font-medium text-foreground hover:underline">
                      {b.listing_title ?? b.listing_id}
                    </Link>
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2 text-muted">{b.shop_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                        b.business_wide ? "bg-accent/15 text-accent" : "bg-surface-muted text-foreground"
                      }`}
                    >
                      {boostScopeLabel(b)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground">{boostPackageLabel(b)}</td>
                  <td className="px-3 py-2 text-foreground">{boostSourceLabel(b)}</td>
                  <td className="px-3 py-2 tabular-nums text-foreground">+{b.score_bonus}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {boostEndsLabel(b.ends_at)}
                    {boostTimeLeft(b.ends_at) ? <span className="block text-xs">{boostTimeLeft(b.ends_at)}</span> : null}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" disabled={ending === b.id} onClick={() => void end(b.id)} className={BTN_TEXT}>
                      {ending === b.id ? "Ending…" : "End"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
