"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { apiFetch } from "@/lib/api/base";
import { useAppSession } from "@/lib/state";

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
            className={`dm-focus rounded p-0.5 transition-transform active:scale-90 ${
              filled
                ? "text-amber-400"
                : "text-foreground/20 hover:text-amber-300/60"
            }`}
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className="size-5"
              fill={filled ? "currentColor" : "none"}
              strokeWidth={1.75}
            />
          </button>
        );
      })}
    </span>
  );
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "size-4" : "size-3";
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= rating ? "text-amber-400" : "text-foreground/15"}`}
          fill={i <= rating ? "currentColor" : "none"}
          strokeWidth={1.75}
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
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<ProductReview | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      /* not authenticated / none yet */
    }
  }, [productId, session.isAuthenticated]);

  useEffect(() => {
    void load();
    void loadMyReview();
  }, [load, loadMyReview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || !session.isAuthenticated) return;
    setSubmitting(true);
    setError(null);
    try {
      const params = new URLSearchParams({ rating: String(rating) });
      if (comment.trim()) params.set("comment", comment.trim());
      await apiFetch(
        `/api/v1/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`,
        { method: "POST", body: "{}" },
      );
      setMyReview({
        id: myReview?.id ?? "mine",
        product_id: productId,
        user_id: "",
        rating,
        comment: comment.trim() || null,
        created_at: new Date().toISOString(),
      });
      setEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your review.");
    } finally {
      setSubmitting(false);
    }
  }

  const avg = stats?.average_rating ?? 0;
  const total = stats?.total_reviews ?? 0;
  const showForm = session.isAuthenticated && (!myReview || editing);

  return (
    <section className="space-y-4" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="reviews-heading"
            className="text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Ratings &amp; reviews
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Rate this listing and share what buyers should know.
          </p>
        </div>
        {total > 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-surface-subtle px-3 py-1.5">
            <span className="text-base font-bold tabular-nums text-foreground">
              {avg.toFixed(1)}
            </span>
            <Stars rating={Math.round(avg)} size="md" />
            <span className="text-[11px] text-muted">
              {total} {total === 1 ? "review" : "reviews"}
            </span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="text-xs text-muted">Loading reviews…</p>
      ) : (
        <>
          {reviews.length > 0 ? (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-border/80 bg-surface-subtle/60 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-xs font-semibold text-foreground/80">
                        {r.users?.full_name || "Anonymous"}
                      </span>
                      <Stars rating={r.rating} />
                    </div>
                    <time className="shrink-0 text-[10px] text-muted">
                      {new Date(r.created_at).toLocaleDateString()}
                    </time>
                  </div>
                  {r.comment?.trim() ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
                      {r.comment}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted">Rated without a written review.</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
              <Star className="mx-auto size-6 text-muted/40" strokeWidth={1.5} aria-hidden />
              <p className="mt-2 text-sm font-medium text-foreground/80">No reviews yet</p>
              <p className="mt-0.5 text-xs text-muted">
                Be the first to rate this listing.
              </p>
            </div>
          )}

          {session.isAuthenticated ? (
            <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
              {myReview && !editing ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Your review</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars rating={myReview.rating} size="md" />
                      <span className="text-xs text-muted">{myReview.rating}/5</span>
                    </div>
                    {myReview.comment?.trim() ? (
                      <p className="mt-1.5 text-sm text-foreground/85">{myReview.comment}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-xs font-semibold text-accent hover:text-accent-hover"
                  >
                    Edit
                  </button>
                </div>
              ) : showForm ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {myReview ? "Update your review" : "Write a review"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] text-muted">Your rating</span>
                      <StarInput value={rating} onChange={setRating} />
                    </div>
                  </div>
                  <textarea
                    className="dm-textarea min-h-[72px] text-sm"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What was quality, delivery, or value like? (optional but helpful)"
                    maxLength={500}
                  />
                  {error ? (
                    <p className="text-xs text-[color:var(--error)]">{error}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={submitting || rating < 1}
                      className="dm-btn dm-btn-primary dm-btn-sm disabled:opacity-50"
                    >
                      {submitting
                        ? "Saving…"
                        : myReview
                          ? "Save review"
                          : "Submit review"}
                    </button>
                    {editing ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setRating(myReview?.rating ?? 0);
                          setComment(myReview?.comment || "");
                          setError(null);
                        }}
                        className="dm-btn dm-btn-ghost dm-btn-sm"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted">
              <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
                Log in
              </Link>{" "}
              to leave a rating and review.
            </p>
          )}
        </>
      )}
    </section>
  );
}
