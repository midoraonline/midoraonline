"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ShopCatalogEditor from "@/components/shop/ShopCatalogEditor";
import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";

export default function MerchantCatalogPage() {
  const params = useParams();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shopId) return;
    try {
      const s = await apiShops.getShop(shopId);
      setShop(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shop");
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const itemType =
    (shop?.shop_type === "service" ? "service" : "product") as "product" | "service";

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <ShopCatalogEditor
        shopId={shopId}
        itemType={itemType}
        heading={shop ? `${shop.name} catalog` : "Catalog"}
      />
    </div>
  );
}
