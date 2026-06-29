"use client";

import { useEffect } from "react";
import { apiProducts } from "@/lib/api";
import { recordListingEvent } from "@/lib/api/listingEvents";
import { useAppSession } from "@/lib/state";
import { notifyFeedEngagement } from "@/lib/engagementEvents";

export default function ProductPageEffects({ productId }: { productId: string }) {
  const session = useAppSession();

  useEffect(() => {
    if (typeof window === "undefined" || !productId) return;
    const key = `product_view:${productId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    
    // Increment global view counter
    void apiProducts.recordProductView(productId).catch(() => {});
    
    // Record listing event for personalization if authenticated
    if (session.isAuthenticated) {
      void recordListingEvent(productId, "viewed").then(() => {
        notifyFeedEngagement();
      }).catch(() => {});
    }
  }, [productId, session.isAuthenticated]);

  return null;
}
