import HomeLanding from "@/components/home/HomeLanding";
import { listPublicShops } from "@/lib/api/server";
import { loadPublicProductFeed, loadMostViewedProducts } from "@/lib/productFeed";

export const revalidate = 60;

export default async function Home() {
  const [shops, products, mostViewed] = await Promise.all([
    listPublicShops({ limit: 12 }),
    loadPublicProductFeed(),
    loadMostViewedProducts(8),
  ]);

  return (
    <HomeLanding
      initialShops={shops}
      initialProducts={products}
      mostViewed={mostViewed}
    />
  );
}
