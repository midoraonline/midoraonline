"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/state";
import { toggleShopAvailability } from "@/lib/api/shops";

type Props = {
  shopId: string;
  shopOwnerId: string | null | undefined;
  availableNow: boolean;
};

export default function ShopAvailabilityToggle({ shopId, shopOwnerId, availableNow }: Props) {
  const session = useAppSession();
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwner =
    session.hydrated &&
    session.isAuthenticated &&
    (session.user?.user_role === "admin" || (shopOwnerId != null && session.user?.id === shopOwnerId));

  const currentValue = optimistic !== null ? optimistic : availableNow;

  const handleToggle = useCallback(async () => {
    if (!isOwner || loading) return;
    const next = !currentValue;
    setOptimistic(next); // optimistic update
    setLoading(true);
    try {
      await toggleShopAvailability(shopId);
      router.refresh();
    } catch {
      setOptimistic(currentValue); // revert on error
    } finally {
      setLoading(false);
    }
  }, [shopId, isOwner, router, currentValue, loading]);

  if (!isOwner) return null;

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm">
      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={currentValue}
        onClick={() => void handleToggle()}
        disabled={loading}
        aria-label={currentValue ? "Mark as unavailable" : "Mark as available"}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out dm-focus",
          "disabled:cursor-not-allowed disabled:opacity-60",
          currentValue ? "bg-emerald-500" : "bg-foreground/20",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0",
            "transition-transform duration-200 ease-in-out",
            currentValue ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>

      {/* Label */}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground/90">
          {loading ? "Updating…" : currentValue ? "Available now" : "Marked unavailable"}
        </p>
        <p className="text-[11px] text-muted">
          {currentValue
            ? "Customers can see you're open"
            : "Tap to mark yourself as available"}
        </p>
      </div>
    </div>
  );
}
