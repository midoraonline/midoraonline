import { notFound } from "next/navigation";
import { merchantApi } from "@/lib/api/server";
import ShopCatalogClient from "./ShopCatalogClient";

export const dynamic = "force-dynamic";

type Params = { shopId: string };

export default async function MerchantCatalogPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shopId } = await params;
  const shop = await merchantApi.shopById(shopId);
  if (!shop) return notFound();
  return <ShopCatalogClient initialShop={shop} />;
}
