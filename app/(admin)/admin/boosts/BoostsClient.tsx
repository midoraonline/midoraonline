"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/base";
import { ADMIN_ACTIVE_BOOSTS_KEY, adminEndBoost, listActiveBoosts } from "@/lib/api/adminPlans";
import { BTN_TEXT, EmptyState, ErrorState, LIST, PageHeader, PageSkeleton } from "@/components/dashboard/ui";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Kampala", dateStyle: "medium", timeStyle: "short" }) + " EAT";

const SOURCE: Record<string, string> = { admin: "Admin", plan_allowance: "Plan", paid: "Paid" };

export default function BoostsClient() {
  const { data, error, isLoading, mutate } = useSWR(ADMIN_ACTIVE_BOOSTS_KEY, listActiveBoosts);
  const [ending, setEnding] = useState<string | null>(null);

  async function end(id: string) {
    setEnding(id);
    try {
      await adminEndBoost(id);
      await mutate((prev) => prev?.filter((b) => b.id !== id), { revalidate: false });
      toast.success("Boost ended");
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
        <ul className={LIST}>
          {data.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/listings/${b.listing_id}`} className="block truncate text-sm font-semibold text-foreground hover:underline">
                  {b.listing_title ?? b.listing_id}
                </Link>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {b.shop_name ?? "—"} · {SOURCE[b.source ?? ""] ?? b.source ?? "Paid"}
                  {b.business_wide ? " · business boost" : ""} · +{b.score_bonus}
                  {b.package_name ? ` · ${b.package_name}` : ""} · ends {when(b.ends_at)}
                </p>
              </div>
              <button type="button" disabled={ending === b.id} onClick={() => void end(b.id)} className={`${BTN_TEXT} self-start sm:self-auto`}>
                {ending === b.id ? "Ending…" : "End"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
