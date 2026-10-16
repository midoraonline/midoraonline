import { apiFetch } from "./base";

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
  active_boost: { id: string; ends_at: string; source?: string } | null;
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
};

export const promoteKey = (id: string) => `listing-promote:${id}`;

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
