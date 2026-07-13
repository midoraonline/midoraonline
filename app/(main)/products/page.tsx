export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Image from "next/image";

import ProductsBrowsePage from "@/components/product/ProductsBrowsePage";
import ProductsBrowseSkeleton from "@/components/skeletons/ProductsBrowseSkeleton";
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
    <>
      {/* Hero banner — negative margins escape the (main) layout container */}
      <div className="relative -mx-4 -mt-6 mb-6 h-44 overflow-hidden sm:-mx-6 sm:-mt-8 sm:mb-8 sm:h-56 lg:-mx-8 lg:-mt-10 lg:mb-10 lg:h-64 xl:-mx-12">
        <Image src="/products_banner.png" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />
        <div className="relative z-10 flex h-full flex-col justify-center dm-container">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Shop</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Browse Products
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/75">
            Handcrafted goods, local fashion, and everyday essentials from verified Ugandan sellers.
          </p>
        </div>
      </div>
      <Suspense fallback={<ProductsBrowseSkeleton />}>
        <ProductsContent initialQuery={initialQuery} />
      </Suspense>
    </>
  );
}
