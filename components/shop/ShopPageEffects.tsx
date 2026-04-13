"use client";

import { useEffect } from "react";
import { apiShops } from "@/lib/api";

const storageKey = (shopId: string) => `shop_view:${shopId}`;

/** Records one shop page view per browser session (sessionStorage). */
export default function ShopPageEffects({ shopId }: { shopId: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = storageKey(shopId);
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void apiShops.recordShopView(shopId).catch(() => {});
  }, [shopId]);

  return null;
}
