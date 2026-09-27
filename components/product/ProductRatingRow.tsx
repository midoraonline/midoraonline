"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

export const PRODUCT_RATING_EVENT = "midora:product-rating";

export type ProductRatingDetail = {
  productId: string;
  average: number;
  count: number;
};

export function publishProductRating(detail: ProductRatingDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ProductRatingDetail>(PRODUCT_RATING_EVENT, { detail }));
}

export function bumpReviewStats(
  prev: { total_reviews: number; average_rating: number } | null,
  rating: number,
  previousRating: number | null,
): { total_reviews: number; average_rating: number } {
  const count = prev?.total_reviews ?? 0;
  const avg = prev?.average_rating ?? 0;
  if (previousRating == null || previousRating < 1) {
    const nextCount = count + 1;
    return {
      total_reviews: nextCount,
      average_rating: (avg * count + rating) / nextCount,
    };
  }
  const nextAvg = count > 0 ? (avg * count - previousRating + rating) / count : rating;
  return { total_reviews: Math.max(count, 1), average_rating: nextAvg };
}

export default function ProductRatingRow({
  productId,
  rating,
  count,
}: {
  productId: string;
  rating: number;
  count: number;
}) {
  const [avg, setAvg] = useState(rating);
  const [total, setTotal] = useState(count);

  useEffect(() => {
    function onRating(event: Event) {
      const detail = (event as CustomEvent<ProductRatingDetail>).detail;
      if (!detail || detail.productId !== productId) return;
      setAvg(detail.average);
      setTotal(detail.count);
    }
    window.addEventListener(PRODUCT_RATING_EVENT, onRating);
    return () => window.removeEventListener(PRODUCT_RATING_EVENT, onRating);
  }, [productId]);

  if (!(avg > 0) || total <= 0) {
    return (
      <a href="#reviews" className="font-medium text-foreground transition-colors hover:text-accent">
        No reviews
      </a>
    );
  }

  const score = Math.min(5, avg).toFixed(1);
  return (
    <a
      href="#reviews"
      className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-accent"
      aria-label={`Rated ${score} out of 5, ${total} reviews`}
    >
      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
      <span className="tabular-nums">
        {score} ({total})
      </span>
    </a>
  );
}
