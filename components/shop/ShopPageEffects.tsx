"use client";

import { useEffect } from "react";
import { apiShops } from "@/lib/api";
import { track } from "@/lib/analytics";

const storageKey = (shopId: string) => `shop_view:${shopId}`;

export default function ShopPageEffects({ shopId }: { shopId: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = storageKey(shopId);
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void apiShops.recordShopView(shopId).catch(() => {});
    track("shop:viewed", { shopId });
  }, [shopId]);

  return null;
}
