"use client";

import { useCallback, useEffect, useState } from "react";

import ShopAnalyticsPage from "@/components/shop/ShopAnalyticsPage";
import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import { ErrorState } from "@/components/dashboard/ui";
import { platformActionMessage } from "@/lib/platformMessages";

type Props = { initialShop: Shop };

export default function ShopAnalyticsClient({ initialShop }: Props) {
  const [shop, setShop] = useState<Shop>(initialShop);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await apiShops.getShop(initialShop.id);
      setShop(s);
    } catch (err) {
      setError(platformActionMessage(err, "We couldn't refresh this shop. Try again."));
    }
  }, [initialShop.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (error) return <ErrorState message={error} onRetry={() => void refresh()} />;

  return <ShopAnalyticsPage shop={shop} />;
}
