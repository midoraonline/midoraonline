"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAppSession } from "@/lib/state";
import { apiFetch } from "@/lib/api/base";

type ReviewStats = {
  total_reviews: number;
  average_rating: number;
  distribution: Record<number, number>;
};

type ShopReview = {
  id: string;
  seller_id: string;
  buyer_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
};

export default function ShopHeaderRating({
  shopId,
  immersive = false,
}: {
  shopId: string;
  immersive?: boolean;
}) {
  const session = useAppSession();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [myReview, setMyReview] = useState<ShopReview | null>(null);
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const statsRes = await apiFetch<ReviewStats>(
      `/api/v1/shops/${encodeURIComponent(shopId)}/reviews/stats`,
    ).catch(() => null);
    setStats(statsRes);
  }, [shopId]);

  const loadMyReview = useCallback(async () => {
    if (!session.isAuthenticated) return;
    try {
      const res = await apiFetch<ShopReview | null>(
        `/api/v1/shops/${encodeURIComponent(shopId)}/reviews/mine`,
      );
      if (res && !("error" in res)) setMyReview(res);
    } catch {
      /* ignore */
    }
  }, [shopId, session.isAuthenticated]);

  useEffect(() => {
    load();
    loadMyReview();
  }, [load, loadMyReview]);

  async function handleRate(rating: number) {
    if (!session.isAuthenticated || submitting) return;
    setSubmitting(true);
    try {
      const params = new URLSearchParams({ rating: String(rating) });
      await apiFetch(
        `/api/v1/shops/${encodeURIComponent(shopId)}/reviews?${params.toString()}`,
        { method: "POST", body: "{}" },
      );
      setMyReview({ rating } as ShopReview);
      load();
    } catch {
      /* ignore */
    }
    setSubmitting(false);
  }

  const avg = stats?.average_rating ?? 0;
  const total = stats?.total_reviews ?? 0;
  const userRating = myReview?.rating ?? 0;
  const displayRating = hovered || (userRating > 0 ? userRating : avg > 0 ? Math.round(avg) : 0);

  const emptyStar = immersive ? "text-white/35" : "text-foreground/20";
  const softText = immersive
    ? { color: "var(--hero-text-soft)" }
    : undefined;
  const mutedText = immersive
    ? { color: "var(--hero-text-quiet)" }
    : undefined;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="inline-flex items-center gap-1.5">
        <span
          className="inline-flex items-center gap-0.5"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = displayRating >= star;
            const starClass = filled
              ? "fill-amber-400 text-amber-400"
              : emptyStar;
            return session.isAuthenticated ? (
              <button
                key={star}
                type="button"
                disabled={submitting}
                className={`dm-focus cursor-pointer transition-transform active:scale-90 ${starClass} ${
                  submitting ? "opacity-50" : ""
                }`}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHovered(star)}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <Star className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            ) : (
              <Star
                key={star}
                className={`size-4 ${starClass}`}
                strokeWidth={1.75}
                aria-hidden
              />
            );
          })}
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${immersive ? "" : "text-foreground/85"}`}
          style={softText}
        >
          {avg.toFixed(1)}
        </span>
        {total > 0 ? (
          <span
            className={`text-xs ${immersive ? "" : "text-muted"}`}
            style={mutedText}
          >
            ({total})
          </span>
        ) : null}
      </div>
      {total === 0 ? (
        <span
          className={`text-[11px] ${immersive ? "" : "text-muted"}`}
          style={mutedText}
        >
          {session.isAuthenticated ? "Tap to rate" : "No reviews yet"}
        </span>
      ) : null}
      {userRating > 0 ? (
        <span
          className={`text-[10px] ${immersive ? "" : "text-muted"}`}
          style={mutedText}
        >
          Your rating: {userRating}/5
        </span>
      ) : null}
    </div>
  );
}
