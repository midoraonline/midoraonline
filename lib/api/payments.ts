import { apiFetch } from "./base";

export type PlanTier = "basic" | "standard" | "premium";

export type Plan = {
  key: PlanTier;
  name: string;
  price_ugx: number;
  currency: string;
  billing_period_days: number;
  max_shops: number;
  max_products_per_shop: number;
  analytics_enabled: boolean;
};

export type Subscription = {
  id: string;
  shop_id?: string | null;
  merchant_reference?: string | null;
  amount?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  plan_tier?: PlanTier | null;
  created_at?: string;
};

export type SubscribeResponse = {
  redirect_url: string | null;
  merchant_reference: string;
  plan_tier: PlanTier;
};

export function getPlans() {
  return apiFetch<Plan[]>("/api/v1/payments/plans");
}

export function subscribe(
  body: { shop_id: string; plan_tier: PlanTier },
  token?: string | null,
) {
  return apiFetch<SubscribeResponse>("/api/v1/payments/subscribe", {
    method: "POST",
    token,
    body,
  });
}

export function listSubscriptions(token?: string | null) {
  return apiFetch<Subscription[]>("/api/v1/payments/subscriptions", { token });
}

export function webhook(body: Record<string, unknown>) {
  return apiFetch<{ received: boolean }>("/api/v1/payments/webhook", {
    method: "POST",
    body,
  });
}

