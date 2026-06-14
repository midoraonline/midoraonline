export const dynamic = "force-dynamic";

import { Suspense } from "react";

import ProductsBrowsePage from "@/components/product/ProductsBrowsePage";
import { loadLatestFeed } from "@/lib/productFeed";

async function ProductsContent({ initialQuery }: { initialQuery: string }) {
  const items = await loadLatestFeed();
  return <ProductsBrowsePage items={items} initialQuery={initialQuery} />;
}

export default async function ProductListing({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const initialQuery = q?.trim() ?? "";

  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading products…</div>}>
      <ProductsContent initialQuery={initialQuery} />
    </Suspense>
  );
}
