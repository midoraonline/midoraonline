"use client";

import { useEffect } from "react";
import { apiProducts } from "@/lib/api";
import { useAppSession } from "@/lib/state";
import { notifyFeedEngagement } from "@/lib/engagementEvents";

export default function ProductPageEffects({ productId }: { productId: string }) {
  const session = useAppSession();

  useEffect(() => {
    if (typeof window === "undefined" || !productId) return;
    const key = `product_view:${productId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    
    // Increment global view counter + record listing_event for personalization
    // (backend handles both: increments products.view_count AND inserts a
    // listing_events row with event_type='viewed' when buyer_id is present)
    void apiProducts.recordProductView(productId).then(() => {
      if (session.isAuthenticated) {
        notifyFeedEngagement();
      }
    }).catch(() => {});
  }, [productId, session.isAuthenticated]);

  return null;
}
