import { apiFetch } from "./base";

export type Review = {
  id: string;
  seller_id: string;
  buyer_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  users?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export type ReviewStats = {
  total_reviews: number;
  average_rating: number;
  distribution: Record<number, number>;
};

export function listShopReviews(
  shopId: string,
  opts?: { page?: number; limit?: number },
) {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return apiFetch<{ items: Review[]; total: number; page: number; limit: number; total_pages: number }>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/reviews${qs ? `?${qs}` : ""}`,
  );
}

export function createShopReview(
  shopId: string,
  rating: number,
  comment?: string,
  token?: string | null,
) {
  const params = new URLSearchParams({ rating: String(rating) });
  if (comment) params.set("comment", comment);
  return apiFetch<Review | { error: string }>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/reviews?${params.toString()}`,
    { method: "POST", token, body: "{}" },
  );
}

export function getMyShopReview(shopId: string, token?: string | null) {
  return apiFetch<Review | null>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/reviews/mine`,
    { token },
  );
}

export function getShopReviewStats(shopId: string) {
  return apiFetch<ReviewStats>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/reviews/stats`,
  );
}
