import ProductsBrowsePage from "@/components/product/ProductsBrowsePage";
import { loadLatestFeed, loadMostViewedProducts } from "@/lib/productFeed";



export default async function ProductListing() {
  const [items, mostViewed] = await Promise.all([
    loadLatestFeed(),
    loadMostViewedProducts(8),
  ]);

  return <ProductsBrowsePage items={items} mostViewed={mostViewed} />;
}
