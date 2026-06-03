"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LegacyShopSettingsRedirect() {
  const params = useParams();
  const router = useRouter();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";

  useEffect(() => {
    if (!shopId) return;
    router.replace(`/merchant/shops/${shopId}/settings`);
  }, [shopId, router]);

  return (
    <div className="dm-card p-8 text-sm text-muted">
      Taking you to the new shop settings…
    </div>
  );
}
