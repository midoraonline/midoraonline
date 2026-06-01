import { apiFetch } from "./base";

export type BoostPlan = {
  id: string;
  name: string;
  duration_hours: number;
  price_amount: number;
  score_bonus: number;
  is_active: boolean;
  created_at: string;
};

export function listBoostPlans() {
  return apiFetch<BoostPlan[]>("/api/v1/boost-plans");
}

export function getListingActiveBoost(listingId: string) {
  return apiFetch<Record<string, unknown> | null>(
    `/api/v1/boost-plans/listing/${encodeURIComponent(listingId)}/active`,
  );
}
