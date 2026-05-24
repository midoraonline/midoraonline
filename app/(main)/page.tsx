import HomeLanding from "@/components/home/HomeLanding";
import { listPublicShops } from "@/lib/api/server";
import { loadAlgorithmFeed, loadMostViewedProducts } from "@/lib/productFeed";


export default async function Home() {
  const [shops, products, mostViewed] = await Promise.all([
    listPublicShops({ limit: 12 }),
    loadAlgorithmFeed(),
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
