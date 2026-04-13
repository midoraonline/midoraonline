"use client";

import { useEffect } from "react";
import { apiProducts } from "@/lib/api";

/** One product detail view per session (sessionStorage). */
export default function ProductPageEffects({ productId }: { productId: string }) {
  useEffect(() => {
    if (typeof window === "undefined" || !productId) return;
    const key = `product_view:${productId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void apiProducts.recordProductView(productId).catch(() => {});
  }, [productId]);

  return null;
}
