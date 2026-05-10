/**
 * Centralised cache configuration for the Midora Next.js frontend.
 *
 * We use Next.js's `unstable_cache` (Vercel's Data Cache) instead of
 * Redis — it's built into every Vercel deployment and requires no extra
 * infrastructure. `unstable_cache` persists across serverless invocations,
 * while `React.cache` (used on top) deduplicates within a single request.
 *
 * Tag-based invalidation: when a merchant creates/updates/deletes a shop
 * or product, the FastAPI backend can POST to /api/revalidate?tag=<TAG>
 * to immediately bust the relevant cache entries without waiting for TTL.
 */

/** Cache tag names used with `revalidateTag` for on-demand invalidation. */
export const CACHE_TAGS = {
  /** All public shop listings. */
  SHOPS: "shops",
  /** All product feeds and per-shop product lists. */
  PRODUCTS: "products",
  /** Most-viewed products ranking. Shares the PRODUCTS tag too. */
  MOST_VIEWED: "most-viewed",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/**
 * Revalidation TTLs in seconds.
 *
 * - SHOP / PRODUCTS: 60 s — fresh enough for a marketplace listing.
 * - MOST_VIEWED: 300 s — view-count rankings only need minute-level
 *   precision; keeping this longer reduces unnecessary fan-out fetches.
 */
export const TTL = {
  SHOP: 60,
  PRODUCTS: 60,
  MOST_VIEWED: 300,
} as const;
