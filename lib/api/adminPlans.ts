import { apiFetch } from "./base";
import type { BoostPlan } from "./boostPlans";

export type AdminPlan = {
  key: "basic" | "standard" | "premium";
  name: string;
  price_ugx: number;
  currency: string;
  billing_period_days: number;
  max_shops: number;
  max_products_per_shop: number;
  analytics_enabled: boolean;
  frequency_per_day: number;
  frequency_per_day_boosted: number;
  max_photos: number;
  max_videos: number;
  free_boosts_per_month: number;
  reposts_per_day: number;
  repost_cooldown_hours: number;
  features: string[];
  is_active: boolean;
  updated_at?: string | null;
};

export type AdminPlanPatch = Partial<Omit<AdminPlan, "key" | "updated_at">>;
export type BoostPackagePatch = Partial<Pick<BoostPlan, "name" | "duration_hours" | "price_amount" | "score_bonus" | "is_active">>;

export const ADMIN_PLANS_KEY = "admin-plans";
export const ADMIN_BOOST_PACKAGES_KEY = "admin-boost-packages";

export async function listAdminPlans(): Promise<AdminPlan[]> {
  const data = await apiFetch<{ items: AdminPlan[] }>("/api/v1/admin/plans");
  return data.items ?? [];
}

export function updateAdminPlan(key: string, patch: AdminPlanPatch) {
  return apiFetch<AdminPlan>(`/api/v1/admin/plans/${encodeURIComponent(key)}`, { method: "PATCH", body: patch });
}

export async function listBoostPackages(): Promise<BoostPlan[]> {
  const data = await apiFetch<{ items: BoostPlan[] }>("/api/v1/admin/boost-plans");
  return data.items ?? [];
}

export function createBoostPackage(body: BoostPackagePatch) {
  return apiFetch<BoostPlan>("/api/v1/admin/boost-plans", { method: "POST", body });
}

export function updateBoostPackage(id: string, patch: BoostPackagePatch) {
  return apiFetch<BoostPlan>(`/api/v1/admin/boost-plans/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
}
