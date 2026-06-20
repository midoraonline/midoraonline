"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/base";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  users?: { full_name?: string | null } | null;
};

type ReviewStats = {
  total_reviews: number;
  average_rating: number;
  distribution: Record<number, number>;
};

type Props = {
  productId: string;
};

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <span
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star;
        return (
          <button
            key={star}
            type="button"
            className={`dm-focus cursor-pointer transition-transform active:scale-90 ${
              filled
                ? "text-amber-400"
                : "text-foreground/20 hover:text-amber-300/60"
            }`}
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <MaterialSymbol
              name="star"
              className="!text-lg"
              filled={filled}
            />
          </button>
        );
      })}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialSymbol
          key={i}
          name="star"
          className={`!text-xs ${i <= rating ? "text-amber-400" : "text-foreground/15"}`}
          filled={i <= rating}
        />
      ))}
    </span>
  );
}

export default function ProductReviews({ productId }: Props) {
  const session = useAppSession();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<ProductReview | null>(null);

  const load = useCallback(async () => {
    try {
      const [statsRes, reviewsRes] = await Promise.all([
        apiFetch<ReviewStats>(
          `/api/v1/products/${encodeURIComponent(productId)}/reviews/stats`,
        ),
        apiFetch<{ items: ProductReview[] }>(
          `/api/v1/products/${encodeURIComponent(productId)}/reviews?limit=50`,
        ),
      ]);
      setStats(statsRes);
      setReviews(Array.isArray(reviewsRes.items) ? reviewsRes.items : []);
    } catch {
      setStats(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const loadMyReview = useCallback(async () => {
    if (!session.isAuthenticated) return;
    try {
      const res = await apiFetch<ProductReview | null>(
        `/api/v1/products/${encodeURIComponent(productId)}/reviews/mine`,
      );
      if (res && !("error" in res)) {
        setMyReview(res);
        setRating(res.rating);
        setComment(res.comment || "");
      }
    } catch {
      // not authenticated
    }
  }, [productId, session.isAuthenticated]);

  useEffect(() => {
    if (expanded) {
      load();
      loadMyReview();
    }
  }, [expanded, load, loadMyReview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || !session.isAuthenticated) return;
    setSubmitting(true);
    try {
      const params = new URLSearchParams({ rating: String(rating) });
      if (comment.trim()) params.set("comment", comment.trim());
      await apiFetch(
        `/api/v1/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`,
        { method: "POST", body: "{}" },
      );
      setMyReview({ rating, comment: comment.trim() } as ProductReview);
      load();
    } catch {
      // handled
    } finally {
      setSubmitting(false);
    }
  }

  const avg = stats?.average_rating ?? 0;
  const total = stats?.total_reviews ?? 0;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="dm-focus inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
      >
        <MaterialSymbol name="star" className="!text-sm" />
        Reviews{total > 0 ? ` (${total})` : ""}
      </button>

      {expanded && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-xs text-muted">Loading reviews…</p>
          ) : (
            <>
              {/* Summary */}
              {total > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-foreground/[0.03] px-3 py-2">
                  <span className="text-lg font-bold tabular-nums text-amber-400">
                    {avg.toFixed(1)}
                  </span>
                  <Stars rating={Math.round(avg)} />
                  <span className="text-[10px] text-muted">
                    ({total} {total === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}

              {/* Review list */}
              {reviews.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl bg-foreground/[0.03] px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-foreground/70">
                            {r.users?.full_name || "Anonymous"}
                          </span>
                          <Stars rating={r.rating} />
                        </div>
                        <span className="text-[10px] text-muted">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-0.5 text-xs text-foreground/80">
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {reviews.length === 0 && !loading && (
                <p className="text-xs text-muted">No reviews yet.</p>
              )}

              {/* Review form */}
              {session.isAuthenticated ? (
                myReview ? (
                  <p className="text-xs text-muted">
                    You rated this product {myReview.rating}/5
                    {myReview.comment ? ` — "${myReview.comment}"` : ""}.
                  </p>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-muted">
                        Your rating:
                      </span>
                      <StarInput value={rating} onChange={setRating} />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="dm-input dm-focus min-w-0 flex-1 text-xs"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write a review (optional)…"
                        maxLength={500}
                      />
                      <button
                        type="submit"
                        disabled={submitting || rating < 1}
                        className="dm-pill dm-focus shrink-0 bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <p className="text-xs text-muted">Log in to leave a review.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
