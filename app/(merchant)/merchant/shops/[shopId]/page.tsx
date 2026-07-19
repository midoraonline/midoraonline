import { notFound } from "next/navigation";
import { merchantApi } from "@/lib/api/server";
import ShopOverviewClient from "./ShopOverviewClient";

export const dynamic = "force-dynamic";

type Params = { shopId: string };

export default async function ShopOverviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shopId } = await params;

  const [shop, products, verification] = await Promise.all([
    merchantApi.shopById(shopId),
    merchantApi.shopProducts(shopId, { includeUnpublished: true }),
    merchantApi.shopVerification(shopId),
  ]);

  if (!shop) return notFound();

  return (
    <ShopOverviewClient
      shopId={shopId}
      initialShop={shop}
      initialProducts={products}
      initialVerification={verification}
    />
  );
}
