import { Suspense } from "react";
import { merchantApi } from "@/lib/api/server";
import MerchantShopsListClient from "./MerchantShopsListClient";

export const dynamic = "force-dynamic";

export default async function MerchantShopsPage() {
  const res = await merchantApi.myShops();
  return (
    <Suspense fallback={null}>
      <MerchantShopsListClient initialShops={res?.items ?? []} />
    </Suspense>
  );
}
