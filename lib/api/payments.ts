import { apiFetch } from "./base";

export type Subscription = {
  id: string;
  shop_id?: string | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  created_at?: string;
};

export function subscribe(
  body: { shop_id: string; amount: number; currency: string },
  token?: string | null,
) {
  return apiFetch<Record<string, unknown>>("/api/v1/payments/subscribe", {
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
