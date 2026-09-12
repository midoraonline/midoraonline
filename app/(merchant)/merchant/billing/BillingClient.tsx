"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiPayments, apiShops } from "@/lib/api";
import type { Plan, PlanTier } from "@/lib/api/payments";
import type { Shop } from "@/lib/api/shops";
import { useAuth } from "@/lib/auth/AuthContext";
import { MaterialSymbol } from "@/components/MaterialSymbol";

function formatPrice(plan: Plan) {
  if (plan.price_ugx <= 0) return "Free";
  return `UGX ${new Intl.NumberFormat().format(plan.price_ugx)} / ${plan.billing_period_days}d`;
}

function Banner({ type, message }: { type: "success" | "error" | "info"; message: string }) {
  const tone =
    type === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : type === "error"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : "border-accent/30 bg-accent/10 text-accent";
  return (
    <div className={`dm-alert flex items-center gap-2.5 px-4 py-3 text-sm ${tone}`}>
      <MaterialSymbol name={type === "success" ? "check_circle" : type === "error" ? "error" : "info"} />
      <span>{message}</span>
    </div>
  );
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
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Billing & plans</h2>
        <p className="mt-1 text-sm text-muted">
          Choose a plan to control how many shops you can open, how many items each shop can list, and whether you get access to shop analytics.
        </p>
      </div>

      {confirming && <Banner type="info" message={notice ?? "Confirming…"} />}
      {!confirming && notice && <Banner type="success" message={notice} />}
      {error && <Banner type="error" message={error} />}

      {shops.length === 0 ? (
        <div className="dm-card p-6 text-sm text-muted">
          You don&apos;t have a shop yet.{" "}
          <Link href="/open-shop" className="font-semibold text-accent">
            Open a shop
          </Link>{" "}
          to subscribe to a plan.
        </div>
      ) : (
        <>
          {shops.length > 1 && (
            <div className="dm-card flex flex-wrap items-center gap-3 p-4">
              <label htmlFor="billing-shop" className="text-xs font-semibold uppercase tracking-wide text-muted">
                Shop
              </label>
              <select
                id="billing-shop"
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="min-h-9 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus-visible:border-accent/50"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = currentTier === plan.key;
              return (
                <div
                  key={plan.key}
                  className={`dm-card flex flex-col gap-4 p-6 ${isCurrent ? "ring-2 ring-accent" : ""}`}
                >
                  <div>
                    <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-2xl font-semibold">{formatPrice(plan)}</p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted">
                    <li className="flex items-center gap-2">
                      <MaterialSymbol name="storefront" className="text-base" />
                      Up to {plan.max_shops} shop{plan.max_shops === 1 ? "" : "s"}
                    </li>
                    <li className="flex items-center gap-2">
                      <MaterialSymbol name="inventory_2" className="text-base" />
                      Up to {plan.max_products_per_shop} items per shop
                    </li>
                    <li className="flex items-center gap-2">
                      <MaterialSymbol name={plan.analytics_enabled ? "check_circle" : "cancel"} className="text-base" />
                      Shop analytics {plan.analytics_enabled ? "included" : "not included"}
                    </li>
                  </ul>
                  <button
                    type="button"
                    disabled={isCurrent || busyTier === plan.key || !selectedShopId}
                    onClick={() => onChoose(plan.key)}
                    className="mt-auto rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCurrent ? "Current plan" : busyTier === plan.key ? "Redirecting…" : "Choose plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
