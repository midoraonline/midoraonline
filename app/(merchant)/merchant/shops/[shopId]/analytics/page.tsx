import { notFound } from "next/navigation";
import { merchantApi } from "@/lib/api/server";
import ShopAnalyticsClient from "./ShopAnalyticsClient";

export const dynamic = "force-dynamic";

type Params = { shopId: string };

export default async function MerchantAnalyticsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shopId } = await params;
  const shop = await merchantApi.shopById(shopId);
  if (!shop) return notFound();
  return <ShopAnalyticsClient initialShop={shop} />;
}
