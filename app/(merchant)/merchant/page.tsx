import { merchantApi } from "@/lib/api/server";
import MerchantDashboardClient from "./MerchantDashboardClient";

export const dynamic = "force-dynamic";

export default async function MerchantOverviewPage() {
  const [shopsRes, statsRes] = await Promise.all([
    merchantApi.myShops(),
    merchantApi.myStats(),
  ]);

  return (
    <MerchantDashboardClient
      initialShops={shopsRes?.items ?? []}
      initialStats={statsRes ?? null}
    />
  );
}
