"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiPayments, apiShops } from "@/lib/api";
import type { Plan, PlanTier } from "@/lib/api/payments";
import type { Shop } from "@/lib/api/shops";
import { useAuth } from "@/lib/auth/AuthContext";
import { BTN_SECONDARY, EmptyState, PageHeader } from "@/components/dashboard/ui";

function formatPrice(plan: Plan) {
  if (plan.price_ugx <= 0) return "Free";
  return `UGX ${new Intl.NumberFormat().format(plan.price_ugx)} / ${plan.billing_period_days}d`;
}

function Notice({ type, message }: { type: "success" | "error" | "info"; message: string }) {
  const tone =
    type === "success"
      ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
      : type === "error"
        ? "border-rose-500/30 text-rose-700 dark:text-rose-300"
        : "border-border text-foreground";
  return <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${tone}`}>{message}</div>;
}

export default function BillingClient() {
  const { user, refresh } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [busyTier, setBusyTier] = useState<PlanTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      const [plansRes, shopsRes] = await Promise.all([
        apiPayments.getPlans(),
        apiShops.myShops(),
      ]);
      setPlans(plansRes);
      const items = shopsRes.items ?? [];
      setShops(items);
      setSelectedShopId((prev) => prev || items[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pollAttempts = useRef(0);
  useEffect(() => {
    const ref = searchParams.get("OrderMerchantReference");
    if (!ref) return;
    pollAttempts.current = 0;
    setConfirming(true);
    setNotice("Confirming your payment with Pesapal…");

    let cancelled = false;
    const poll = async () => {
      pollAttempts.current += 1;
      try {
        const subs = await apiPayments.listSubscriptions();
        const match = subs.find((s) => s.merchant_reference === ref);
        if (match?.payment_status === "COMPLETED") {
          if (cancelled) return;
          await refresh();
          setNotice(`Payment confirmed — you're now on the ${match.plan_tier ?? ""} plan.`);
          setConfirming(false);
          router.replace("/merchant/billing");
          return;
        }
        if (match?.payment_status === "FAILED") {
          if (cancelled) return;
          setError("The payment was not completed. You can try again below.");
          setConfirming(false);
          router.replace("/merchant/billing");
          return;
        }
      } catch {
        /* keep polling */
      }
      if (!cancelled && pollAttempts.current < 8) {
        setTimeout(poll, 2500);
      } else if (!cancelled) {
        setNotice("Still confirming your payment. This can take a minute — check back shortly.");
        setConfirming(false);
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const onChoose = useCallback(
    async (tier: PlanTier) => {
      if (!selectedShopId) return;
      setBusyTier(tier);
      setError(null);
      setNotice(null);
      try {
        const res = await apiPayments.subscribe({ shop_id: selectedShopId, plan_tier: tier });
        if (res.redirect_url) {
          window.location.href = res.redirect_url;
          return;
        }
        await refresh();
        setNotice(`You're now on the ${tier} plan.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start subscription");
      } finally {
        setBusyTier(null);
      }
    },
    [selectedShopId, refresh],
  );

  const currentTier = user?.plan_tier ?? "basic";

  return (
    <div>
      <PageHeader
        title="Billing and plans"
        description="Your plan sets how many shops and listings you can have, and whether shop analytics is on."
      />

      {confirming && <Notice type="info" message={notice ?? "Confirming…"} />}
      {!confirming && notice && <Notice type="success" message={notice} />}
      {error && <Notice type="error" message={error} />}

      {shops.length === 0 ? (
        <EmptyState
          message="Open a shop to subscribe to a plan."
          action={
            <Link href="/open-shop" className={BTN_SECONDARY}>
              Open a shop
            </Link>
          }
        />
      ) : (
        <>
          {shops.length > 1 && (
            <div className="mb-6 flex max-w-md flex-col gap-1.5">
              <label htmlFor="billing-shop" className="text-sm font-medium">
                Shop
              </label>
              <select
                id="billing-shop"
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface shadow-xs px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = currentTier === plan.key;
              return (
                <div
                  key={plan.key}
                  className={`flex flex-col gap-4 rounded-lg border p-5 ${isCurrent ? "border-foreground" : "border-border"}`}
                >
                  <div>
                    <h2 className="text-sm font-semibold">{plan.name}</h2>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{formatPrice(plan)}</p>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted">
                    <li className="tabular-nums">
                      Up to {plan.max_shops} shop{plan.max_shops === 1 ? "" : "s"}
                    </li>
                    <li className="tabular-nums">Up to {plan.max_products_per_shop} listings per shop</li>
                    <li>Shop analytics {plan.analytics_enabled ? "included" : "not included"}</li>
                  </ul>
                  {isCurrent ? (
                    <p className="mt-auto text-sm font-medium">Current plan</p>
                  ) : (
                    <button
                      type="button"
                      disabled={busyTier === plan.key || !selectedShopId}
                      onClick={() => onChoose(plan.key)}
                      className={`mt-auto ${BTN_SECONDARY}`}
                    >
                      {busyTier === plan.key ? "Redirecting…" : `Switch to ${plan.name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
