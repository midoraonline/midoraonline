"use client";

import { useCallback, useEffect, useState } from "react";

import ShopCatalogEditor from "@/components/shop/ShopCatalogEditor";
import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import { ErrorState } from "@/components/dashboard/ui";

type Props = { initialShop: Shop };

export default function ShopCatalogClient({ initialShop }: Props) {
  const [shop, setShop] = useState<Shop>(initialShop);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await apiShops.getShop(initialShop.id);
      setShop(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh shop");
    }
  }, [initialShop.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const itemType =
    (shop.shop_type === "service" ? "service" : "product") as "product" | "service";

  return (
    <div>
      {error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}
      <ShopCatalogEditor
        shopId={shop.id}
        itemType={itemType}
        heading={`${shop.name} catalog`}
        shopLogoUrl={shop.logo_url ?? null}
      />
    </div>
  );
}
