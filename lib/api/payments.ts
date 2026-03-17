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
  token: string,
  body: { shop_id: string; amount: number; currency: string }
) {
  return apiFetch<Record<string, unknown>>("/api/v1/payments/subscribe", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function listSubscriptions(token: string) {
  return apiFetch<Subscription[]>("/api/v1/payments/subscriptions", { token });
}

export function webhook(body: Record<string, unknown>) {
  return apiFetch<{ received: boolean }>("/api/v1/payments/webhook", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

