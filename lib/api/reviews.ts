import { ApiError, apiFetch } from "./base";

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

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  users?: {
    full_name?: string | null;
  } | null;
};

export type ReviewStats = {
  total_reviews: number;
  average_rating: number;
  distribution: Record<number, number>;
};

/* ── Shop reviews ── */

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

/* ── Product reviews ── */

export function listProductReviews(
  productId: string,
  opts?: { page?: number; limit?: number },
) {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return apiFetch<{ items: ProductReview[]; total: number; page: number; limit: number; total_pages: number }>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews${qs ? `?${qs}` : ""}`,
  );
}

export function createProductReview(
  productId: string,
  rating: number,
  comment?: string,
  token?: string | null,
) {
  const score = Math.round(rating);
  const trimmed = comment?.trim() || "";
  const params = new URLSearchParams({ rating: String(score) });
  if (trimmed) params.set("comment", trimmed);
  return apiFetch<ProductReview | { error?: string }>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`,
    {
      method: "POST",
      token,
      body: trimmed ? { rating: score, comment: trimmed } : { rating: score },
    },
  ).then((res) => {
    if (res && typeof res === "object" && "error" in res && res.error && !("id" in res)) {
      throw new ApiError(String(res.error), 400, { detail: String(res.error), code: "review_rejected" });
    }
    return res as ProductReview;
  });
}

export function reviewFailureMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Sign in to leave a review.";
    if (err.code === "invalid_rating") return "Choose a rating from 1 to 5 stars.";
    if (err.code === "rating_required") return "Add a star rating before you submit.";
    if (err.code === "review_trigger") {
      return "We couldn't save your review because of a temporary problem. Please try again in a moment.";
    }
    if (err.code === "review_schema") {
      return "Reviews aren't available right now. Please try again later.";
    }
    if (err.status >= 500 || err.code === "internal_error") {
      return "We couldn't save your review. Please try again in a moment.";
    }
    const detail = err.message?.trim() ?? "";
    if (/internal server error/i.test(detail) || /^HTTP \d+/.test(detail) || /^Request failed/i.test(detail)) {
      return "We couldn't save your review. Please try again in a moment.";
    }
    if (detail) return detail;
  }
  if (err instanceof Error && err.message.trim() && !/internal server error/i.test(err.message)) {
    return err.message;
  }
  return "We couldn't save your review. Please try again in a moment.";
}

export function getMyProductReview(productId: string, token?: string | null) {
  return apiFetch<ProductReview | null>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews/mine`,
    { token },
  );
}

export function getProductReviewStats(productId: string) {
  return apiFetch<ReviewStats>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews/stats`,
  );
}
