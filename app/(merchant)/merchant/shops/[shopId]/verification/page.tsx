"use client";

import { useParams } from "next/navigation";

import ShopVerificationCard from "@/components/shop/ShopVerificationCard";

export default function MerchantVerificationPage() {
  const params = useParams();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Shop Verification</h2>
        <p className="mt-1 text-xs text-muted">
          Complete the 3-stage verification journey to unlock trust badges for your public shop page.
        </p>
      </div>

      <ShopVerificationCard shopId={shopId} />
    </div>
  );
}
