import ProductsBrowsePage from "@/components/product/ProductsBrowsePage";
import { loadPublicProductFeed, loadMostViewedProducts } from "@/lib/productFeed";

/**
 * ISR: regenerate at most every 60 s from Vercel's cache.
 * On-demand: POST /api/revalidate?tag=products busts both the feed and the
 * most-viewed ranking immediately when a merchant publishes/updates a product.
 */
export const revalidate = 60;

export default async function ProductListing() {
  const [items, mostViewed] = await Promise.all([
    loadPublicProductFeed(),
    loadMostViewedProducts(8),
  ]);

  return <ProductsBrowsePage items={items} mostViewed={mostViewed} />;
}
