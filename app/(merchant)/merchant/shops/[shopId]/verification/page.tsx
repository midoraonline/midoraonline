"use client";

import { useParams } from "next/navigation";

import ShopVerificationCard from "@/components/shop/ShopVerificationCard";

export default function MerchantVerificationPage() {
  const params = useParams();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Request a review when you want an identity, business or professional badge, or higher limits.
      </p>

      <ShopVerificationCard shopId={shopId} />
    </div>
  );
}
