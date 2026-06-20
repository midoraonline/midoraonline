"use client";

import { useCallback, useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
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

export default function ShopHeaderRating({ shopId }: { shopId: string }) {
  const session = useAppSession();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [myReview, setMyReview] = useState<ShopReview | null>(null);
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [statsRes] = await Promise.all([
      apiFetch<ReviewStats>(
        `/api/v1/shops/${encodeURIComponent(shopId)}/reviews/stats`,
      ).catch(() => null),
    ]);
    setStats(statsRes);
  }, [shopId]);

  const loadMyReview = useCallback(async () => {
    if (!session.isAuthenticated) return;
    try {
      const res = await apiFetch<ShopReview | null>(
        `/api/v1/shops/${encodeURIComponent(shopId)}/reviews/mine`,
      );
      if (res && !("error" in res)) setMyReview(res);
    } catch {}
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
    } catch {}
    setSubmitting(false);
  }

  const avg = stats?.average_rating ?? 0;
  const total = stats?.total_reviews ?? 0;
  const userRating = myReview?.rating ?? 0;
  const displayRating = hovered || (userRating > 0 ? userRating : 0);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="inline-flex items-center gap-1">
        <span
          className="inline-flex items-center gap-0.5"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = displayRating >= star;
            return session.isAuthenticated ? (
              <button
                key={star}
                type="button"
                disabled={submitting}
                className={`dm-focus cursor-pointer transition-transform active:scale-90 ${
                  filled
                    ? "text-amber-400"
                    : "text-foreground/20 hover:text-amber-300/60"
                } ${submitting ? "opacity-50" : ""}`}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHovered(star)}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <MaterialSymbol
                  name="star"
                  className="!text-lg"
                  filled={filled}
                />
              </button>
            ) : (
              <MaterialSymbol
                key={star}
                name={filled ? "star" : "star"}
                className={`!text-lg ${filled ? "text-amber-400" : "text-foreground/25"}`}
                filled={filled}
              />
            );
          })}
        </span>
        {total > 0 && (
          <>
            <span className="text-sm font-semibold text-foreground/80">
              {avg.toFixed(1)}
            </span>
            <span className="text-xs text-muted">
              ({total})
            </span>
          </>
        )}
      </div>
      {total === 0 && (
        <span className="text-xs text-muted">No reviews yet</span>
      )}
      {userRating > 0 && (
        <span className="text-[10px] text-muted">
          Your rating: {userRating}/5
        </span>
      )}
    </div>
  );
}
