"use client";

import useSWR from "swr";
import BoostedTag from "@/components/BoostedTag";
import { ADMIN_ACTIVE_BOOSTS_KEY, listActiveBoosts, type ActiveBoost } from "@/lib/api/adminPlans";
import { describeBoost } from "@/lib/boostInfo";

export function useActiveBoosts() {
  return useSWR(ADMIN_ACTIVE_BOOSTS_KEY, listActiveBoosts, { dedupingInterval: 10_000 });
}

export function findBoosts(all: ActiveBoost[] | undefined, opts: { listingId?: string; shopId?: string }): ActiveBoost[] {
  if (!all) return [];
  if (opts.listingId) return all.filter((b) => b.listing_id === opts.listingId);
  if (opts.shopId) return all.filter((b) => b.shop_id === opts.shopId || b.listing_shop_id === opts.shopId);
  return [];
}

/** Which boost is active on a listing, or a business's boosts summary. Admin views only. */
export default function AdminBoostStatus({
  listingId,
  shopId,
  className = "",
}: {
  listingId?: string;
  shopId?: string;
  className?: string;
}) {
  const { data } = useActiveBoosts();
  const rows = findBoosts(data, { listingId, shopId });
  if (rows.length === 0) return null;
  const first = rows[0];
  const businessWide = rows.filter((b) => b.business_wide).length;
  const text = listingId
    ? describeBoost(first)
    : businessWide
      ? `Business boost on ${businessWide} listing${businessWide === 1 ? "" : "s"} · ${describeBoost(rows.find((b) => b.business_wide) ?? first)}`
      : `${rows.length} boosted listing${rows.length === 1 ? "" : "s"} · next: ${describeBoost(first)}`;
  return (
    <p className={`flex min-w-0 items-center gap-1.5 text-xs text-foreground ${className}`}>
      <BoostedTag />
      <span className="truncate" title={text}>
        {text}
      </span>
    </p>
  );
}
