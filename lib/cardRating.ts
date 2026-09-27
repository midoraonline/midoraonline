const RATING_KEYS = ["rating", "avg_rating", "average_rating"] as const;
const COUNT_KEYS = ["review_count", "reviews_count"] as const;

function firstNumber(source: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (value == null || value === "") continue;
    const n = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Stars and review count from whichever names the feed currently sends. */
export function readCardRating(source: object | null | undefined): {
  rating: number | null;
  reviewCount: number | null;
} {
  const raw = (source ?? {}) as Record<string, unknown>;
  const rating = firstNumber(raw, RATING_KEYS);
  const count = firstNumber(raw, COUNT_KEYS);
  const reviewCount = count == null ? null : Math.max(0, Math.round(count));
  const scored = rating != null && rating > 0 ? Math.min(5, rating) : null;
  if (scored == null && (reviewCount == null || reviewCount === 0)) {
    return { rating: null, reviewCount: 0 };
  }
  return { rating: scored, reviewCount };
}
