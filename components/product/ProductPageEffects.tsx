"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { useAppSession } from "@/lib/state";
import { notifyFeedEngagement } from "@/lib/engagementEvents";

export default function ProductPageEffects({
  productId,
  shopId,
  category,
  hasDiscount,
  discountPercentage,
  publishedAt,
}: {
  productId: string;
  shopId?: string;
  category?: string;
  hasDiscount?: boolean;
  discountPercentage?: number;
  publishedAt?: number;
}) {
  const session = useAppSession();

  useEffect(() => {
    if (typeof window === "undefined" || !productId || !shopId) return;
    const key = `product_view:${productId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    track("listing:viewed", {
      productId,
      shopId,
      category: category ?? "",
      hasDiscount: Boolean(hasDiscount),
      discountPercentage,
      publishedAt: publishedAt ?? Date.now(),
    });
    if (session.isAuthenticated) {
      notifyFeedEngagement();
    }
  }, [productId, shopId, category, hasDiscount, discountPercentage, publishedAt, session.isAuthenticated]);

  return null;
}
