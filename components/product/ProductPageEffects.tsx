"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

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
  }, [productId, shopId, category, hasDiscount, discountPercentage, publishedAt]);

  return null;
}
