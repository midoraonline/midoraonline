import { mutate } from "swr";
import { apiFetch } from "./base";
import type { BoostInfo } from "@/lib/boostInfo";
import { markFeedStale } from "@/lib/feedFreshness";

export type BoostPackage = {
  id: string;
  name: string;
  duration_hours: number;
  price_amount: number;
  score_bonus: number;
};

export type RepostStatus = {
  per_day: number;
  used_today: number;
  cooldown_hours: number;
  next_allowed_at: string | null;
  can_repost: boolean;
  reason: string | null;
};

export type PromoteOptions = {
  listing_id: string;
  plan: { key?: string; name?: string };
  packages: BoostPackage[];
  allowance: { per_month: number; used: number; remaining: number };
  active_boost: (BoostInfo & { id: string; ends_at: string }) | null;
  repost: RepostStatus;
};

export type FeedPosition = {
  listing_id: string;
  live: boolean;
  position: number | null;
  scanned?: number;
  category?: string | null;
  category_position: number | null;
  category_scanned?: number;
  boosted?: boolean;
  boost?: BoostInfo | null;
  computed_at?: string;
};

export const promoteKey = (id: string) => `listing-promote:${id}`;
export const feedPositionKey = (id: string) => `feed-position:${id}`;
export const MY_BOOSTS_PREFIX = "my-boosts:";
export const myBoostsKey = (ids: string[]) => (ids.length ? `${MY_BOOSTS_PREFIX}${[...ids].sort().join(",")}` : null);

export async function getMyBoosts(ids: string[]): Promise<Record<string, BoostInfo>> {
  if (!ids.length) return {};
  const data = await apiFetch<{ items: Record<string, BoostInfo> }>(
    `/api/v1/listings/boosts?ids=${encodeURIComponent(ids.join(","))}`,
  );
  return data.items ?? {};
}

const RANK_KEYS = ["listing-promote:", "feed-position:", MY_BOOSTS_PREFIX, "admin-active-boosts"];

/** After boost / repost / end boost: mark the feed stale and refetch every SWR key that shows rank or boost state. */
export function refreshAfterRankChange(): void {
  markFeedStale();
  void mutate((key) => typeof key === "string" && RANK_KEYS.some((p) => key.startsWith(p)));
}

export function getPromoteOptions(id: string) {
  return apiFetch<PromoteOptions>(`/api/v1/listings/${encodeURIComponent(id)}/promote`);
}

export function boostListing(id: string, packageId: string, useAllowance: boolean) {
  return apiFetch<{ status: "active" | "payment_required"; message?: string }>(
    `/api/v1/listings/${encodeURIComponent(id)}/boost`,
    { method: "POST", body: { package_id: packageId, use_allowance: useAllowance } },
  );
}

export function repostListing(id: string) {
  return apiFetch<{ status: string; posted_at: string; repost: RepostStatus }>(
    `/api/v1/listings/${encodeURIComponent(id)}/repost`,
    { method: "POST" },
  );
}

export function getFeedPosition(id: string) {
  return apiFetch<FeedPosition>(`/api/v1/listings/${encodeURIComponent(id)}/feed-position`);
}
