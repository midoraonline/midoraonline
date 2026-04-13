import Link from "next/link";
import ProductCard from "@/components/productcard";
import { loadPublicProductFeed } from "@/lib/productFeed";

/** Fresh listings per request (API-backed aggregation). */
export const dynamic = "force-dynamic";

export default async function ProductListing() {
  const items = await loadPublicProductFeed();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 sm:space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Products
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Browse listings from shops on Midora Online. Shop logos appear on each image.
          </p>
        </div>
        <Link
          href="/shops"
          className="dm-pill dm-focus shrink-0 bg-foreground/[0.07] px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
        >
          Browse shops
        </Link>
      </div>

      {items.length === 0 ? (
        <section className="dm-card p-8 sm:p-10">
          <p className="text-sm leading-relaxed text-muted">
            No products are available yet. Open a{" "}
            <Link href="/shops" className="font-semibold text-foreground underline-offset-2 hover:underline">
              shop
            </Link>{" "}
            to explore storefronts, or check back soon.
          </p>
        </section>
      ) : (
        <section>
          <p className="mb-4 text-sm text-muted">
            {items.length} listing{items.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
