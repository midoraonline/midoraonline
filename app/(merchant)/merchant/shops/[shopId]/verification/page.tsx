"use client";

import { useParams } from "next/navigation";

import ShopVerificationCard from "@/components/shop/ShopVerificationCard";

export default function MerchantVerificationPage() {
  const params = useParams();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Shop · Verification
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
          Trust & safety
        </h2>
        <p className="mt-1 text-sm text-muted">
          Submit your shop for review. Approved shops get an active badge and appear in
          public listings.
        </p>
      </header>
      <ShopVerificationCard shopId={shopId} />
    </div>
  );
}
