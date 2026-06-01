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
 * - HOME_FEED: 900 s (15 min) — public homepage, stale data is acceptable
 * - SHOP / PRODUCTS: 300 s — reduced from 60s to cut redundant fan-out
 * - MOST_VIEWED: 600 s (10 min) — rankings don't need sub-minute precision
 * - DASHBOARD: 120 s — dashboards get fresh data but not on every keystroke
 */
export const TTL = {
  HOME_FEED: 900,
  SHOP: 300,
  PRODUCTS: 300,
  MOST_VIEWED: 600,
  DASHBOARD: 120,
} as const;
