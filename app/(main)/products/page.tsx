export const dynamic = "force-dynamic";

import ProductsBrowsePage from "@/components/product/ProductsBrowsePage";
import { loadLatestFeed } from "@/lib/productFeed";

export default async function ProductListing() {
  const items = await loadLatestFeed();

  return <ProductsBrowsePage items={items} />;
}
