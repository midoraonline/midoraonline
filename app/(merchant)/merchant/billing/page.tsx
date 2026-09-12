"use client";

import { Suspense } from "react";
import BillingClient from "./BillingClient";

export default function MerchantBillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingClient />
    </Suspense>
  );
}
