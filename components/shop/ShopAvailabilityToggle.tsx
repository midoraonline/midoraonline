"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/state";
import { toggleShopAvailability } from "@/lib/api/shops";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  shopId: string;
  shopOwnerId: string | null | undefined;
  availableNow: boolean;
};

export default function ShopAvailabilityToggle({ shopId, shopOwnerId, availableNow }: Props) {
  const session = useAppSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isOwner =
    session.hydrated &&
    session.isAuthenticated &&
    (session.user?.user_role === "admin" || (shopOwnerId != null && session.user?.id === shopOwnerId));

  const handleToggle = useCallback(async () => {
    if (!isOwner) return;
    setLoading(true);
    try {
      await toggleShopAvailability(shopId);
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [shopId, isOwner, router]);

  if (!isOwner) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="dm-focus inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 px-3 py-2 text-[11px] font-semibold text-orange-700 hover:bg-orange-500/20 hover:border-orange-500/50 disabled:opacity-50"
    >
      <MaterialSymbol
        name={availableNow ? "cancel" : "check_circle"}
        className={`!text-sm ${availableNow ? "text-orange-600" : "text-emerald-500"}`}
      />
      {loading ? "…" : availableNow ? "Mark unavailable" : "Mark available"}
    </button>
  );
}
