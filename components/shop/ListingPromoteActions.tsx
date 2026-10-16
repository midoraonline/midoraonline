"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Loader2, LocateFixed, RefreshCw, Rocket } from "lucide-react";
import FormModal from "@/components/FormModal";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/dashboard/ui";
import {
  boostListing,
  getFeedPosition,
  getPromoteOptions,
  promoteKey,
  repostListing,
  type FeedPosition,
} from "@/lib/api/listingActions";

const ACTION =
  "dm-focus inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-surface-muted disabled:opacity-50 sm:min-h-9";

const UGX = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

function durationLabel(hours: number) {
  if (hours % 24 === 0) return `${hours / 24} day${hours === 24 ? "" : "s"}`;
  return `${hours} hours`;
}

function endsLabel(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function Skeleton() {
  return (
    <div className="space-y-2" aria-busy>
      {[0, 1].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-muted" />
      ))}
    </div>
  );
}

function BoostDialog({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const { data, error, isLoading, mutate } = useSWR(promoteKey(listingId), () => getPromoteOptions(listingId));
  const [busy, setBusy] = useState<string | null>(null);
  const allowance = data?.allowance;

  async function boost(packageId: string, useAllowance: boolean) {
    setBusy(packageId);
    try {
      const res = await boostListing(listingId, packageId, useAllowance);
      if (res.status === "active") {
        toast.success("Your ad is boosted");
        await mutate();
        onClose();
      } else {
        toast.message("Payment needed", { description: res.message });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't boost this ad.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <FormModal title="Boost this ad" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          A boost moves your ad higher in the feed for a while and shows a Boosted tag. It doesn&apos;t change anything else.
        </p>
        {isLoading ? <Skeleton /> : null}
        {error ? <p className="text-sm text-[color:var(--error)]">{error instanceof Error ? error.message : "Couldn't load boosts."}</p> : null}
        {data?.active_boost ? (
          <p className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-foreground">
            Boosted until {endsLabel(data.active_boost.ends_at)}.
          </p>
        ) : null}
        {data && !data.active_boost ? (
          <>
            <p className="text-sm text-foreground">
              {allowance && allowance.per_month > 0
                ? `Your ${data.plan.name ?? "plan"} includes ${allowance.per_month} free boost${allowance.per_month === 1 ? "" : "s"} a month · ${allowance.remaining} left.`
                : `Your ${data.plan.name ?? "plan"} doesn't include free boosts.`}
            </p>
            <ul className="space-y-2">
              {data.packages.map((pkg) => {
                const free = (allowance?.remaining ?? 0) > 0;
                return (
                  <li key={pkg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{pkg.name}</p>
                      <p className="text-xs text-muted">
                        {durationLabel(pkg.duration_hours)} · {pkg.price_amount ? UGX.format(pkg.price_amount) : "Free"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void boost(pkg.id, free)}
                      className={free ? BTN_PRIMARY : BTN_SECONDARY}
                    >
                      {busy === pkg.id ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Rocket className="size-4" aria-hidden />}
                      {free ? "Use free boost" : "Buy boost"}
                    </button>
                  </li>
                );
              })}
              {data.packages.length === 0 ? <li className="text-sm text-muted">No boost packages are available right now.</li> : null}
            </ul>
            {allowance && allowance.remaining === 0 ? (
              <a href="/merchant/billing" className="text-sm font-medium text-accent underline underline-offset-2">
                Upgrade your plan for free boosts
              </a>
            ) : null}
          </>
        ) : null}
      </div>
    </FormModal>
  );
}

function PositionDialog({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<FeedPosition>(`feed-position:${listingId}`, () => getFeedPosition(listingId), {
    revalidateOnFocus: false,
  });
  const go = () => {
    onClose();
    router.push(`/?focus=${encodeURIComponent(listingId)}`);
  };
  return (
    <FormModal
      title="Find in feed"
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button type="button" onClick={go} disabled={!data?.live} className={BTN_PRIMARY}>
            <LocateFixed className="size-4" aria-hidden />
            Show me in the feed
          </button>
        </div>
      }
    >
      {isLoading ? <Skeleton /> : null}
      {error ? <p className="text-sm text-[color:var(--error)]">{error instanceof Error ? error.message : "Couldn't check the feed."}</p> : null}
      {data ? (
        !data.live ? (
          <p className="text-sm text-muted">This ad isn&apos;t live, so it&apos;s not in the feed.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-2xl font-semibold text-foreground">
              {data.position ? `Your ad is #${data.position} in the feed` : `Not in the top ${data.scanned ?? 0} ads`}
            </p>
            {data.category ? (
              <p className="text-sm text-foreground">
                {data.category_position
                  ? `#${data.category_position} in ${data.category}`
                  : `Not in the top ${data.category_scanned ?? 0} in ${data.category}`}
              </p>
            ) : null}
            <p className="text-xs text-muted">
              Live position for buyers right now{data.boosted ? " · boosted" : ""}. Boost or repost to move up.
            </p>
          </div>
        )
      ) : null}
    </FormModal>
  );
}

export default function ListingPromoteActions({ listingId, onReposted }: { listingId: string; onReposted?: (postedAt: string) => void }) {
  const [dialog, setDialog] = useState<"boost" | "position" | null>(null);
  const [reposting, setReposting] = useState(false);

  async function repost() {
    setReposting(true);
    try {
      const res = await repostListing(listingId);
      toast.success("Reposted. Your ad is fresh again.");
      onReposted?.(res.posted_at);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't repost this ad.");
    } finally {
      setReposting(false);
    }
  }

  return (
    <>
      <button type="button" className={ACTION} onClick={() => setDialog("boost")}>
        <Rocket className="size-3.5" aria-hidden />
        Boost
      </button>
      <button type="button" className={ACTION} onClick={() => void repost()} disabled={reposting}>
        {reposting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <RefreshCw className="size-3.5" aria-hidden />}
        Repost
      </button>
      <button type="button" className={ACTION} onClick={() => setDialog("position")}>
        <LocateFixed className="size-3.5" aria-hidden />
        Find in feed
      </button>
      {dialog === "boost" ? <BoostDialog listingId={listingId} onClose={() => setDialog(null)} /> : null}
      {dialog === "position" ? <PositionDialog listingId={listingId} onClose={() => setDialog(null)} /> : null}
    </>
  );
}
