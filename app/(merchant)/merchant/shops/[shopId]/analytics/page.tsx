"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ShopAnalyticsPage from "@/components/shop/ShopAnalyticsPage";
import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";

export default function MerchantAnalyticsPage() {
  const params = useParams();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const s = await apiShops.getShop(shopId);
      setShop(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shop");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="dm-card p-8 text-sm text-muted">Loading analytics…</div>;
  }
  if (error || !shop) {
    return (
      <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
        {error || "Shop not found"}
      </p>
    );
  }

  return <ShopAnalyticsPage shop={shop} />;
}
