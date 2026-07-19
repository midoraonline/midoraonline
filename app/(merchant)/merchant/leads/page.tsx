import { merchantApi } from "@/lib/api/server";
import MerchantLeadsClient from "./MerchantLeadsClient";

export const dynamic = "force-dynamic";

export default async function MerchantLeadsPage() {
  const shopsRes = await merchantApi.myShops();
  const shops = (shopsRes?.items ?? []).map((s) => ({ id: s.id, name: s.name }));
  const firstShopId = shops[0]?.id ?? null;

  const [stats, leadsRes] = firstShopId
    ? await Promise.all([
        merchantApi.shopLeadStats(firstShopId),
        merchantApi.shopLeads(firstShopId, { limit: 20 }),
      ])
    : [null, null];

  return (
    <MerchantLeadsClient
      initialShops={shops}
      initialShopId={firstShopId}
      initialStats={stats ?? null}
      initialLeads={leadsRes?.items ?? []}
    />
  );
}
