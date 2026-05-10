import Link from "next/link";
import ProductCard from "@/components/productcard";
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 sm:space-y-14">

      {/* ── Most Viewed ─────────────────────────────────────────────────── */}
      {mostViewed.length > 0 && (
        <section>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                Most Viewed
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                The listings getting the most attention right now.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            {mostViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── All products ────────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Products
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
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
          <div className="dm-card mt-6 p-8 sm:p-10">
            <p className="text-sm leading-relaxed text-muted">
              No products are available yet. Open a{" "}
              <Link href="/shops" className="font-semibold text-foreground underline-offset-2 hover:underline">
                shop
              </Link>{" "}
              to explore storefronts, or check back soon.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 mt-6 text-sm text-muted">
              {items.length} listing{items.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
