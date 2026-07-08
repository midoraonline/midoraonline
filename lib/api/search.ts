import { apiFetch } from "./base";

export type SearchMode = "vector" | "keyword" | "hybrid";

export type SearchProductShop = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  owner_id?: string | null;
  whatsapp_number?: string | null;
  is_active?: boolean;
  category?: string | null;
  trust_score?: number | null;
  available_now?: boolean | null;
  location?: string | null;
};

export type SearchProductItem = {
  id: string;
  shop_id: string;
  title: string;
  price_ugx: number;
  discount_price?: number | null;
  discount_expires_at?: string | null;
  image_urls?: string[] | null;
  primary_image?: string | null;
  category?: string | null;
  item_type?: string | null;
  view_count?: number;
  like_count?: number;
  viewer_liked?: boolean | null;
  listing_score?: number | null;
  location_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  boosted?: boolean;
  average_rating?: number | null;
  review_count?: number | null;
  is_negotiable?: boolean | null;
  similarity_score?: number | null;
  shop: SearchProductShop;
};

export type SearchProductsResponse = {
  items: SearchProductItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  query: string;
  mode: SearchMode;
};

export type TrendingSearchTerm = {
  query: string;
  count: number;
};

export type TrendingSearchesResponse = {
  items: TrendingSearchTerm[];
};

export type RecentSearchEntry = {
  query: string;
  searched_at: string;
  result_count?: number | null;
  search_mode?: SearchMode | null;
};

export type RecentSearchesResponse = {
  items: RecentSearchEntry[];
};

export type SearchProductsOptions = {
  page?: number;
  limit?: number;
  category?: string | null;
  log?: boolean;
  token?: string | null;
};

export function searchProducts(q: string, opts?: SearchProductsOptions) {
  const params = new URLSearchParams({ q: q.trim() });
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.category) params.set("category", opts.category);
  if (opts?.log === false) params.set("log", "false");

  return apiFetch<SearchProductsResponse>(`/api/v1/search/products?${params}`, {
    ...(opts?.token ? { token: opts.token } : {}),
  });
}

export function getTrendingSearches() {
  return apiFetch<TrendingSearchesResponse>("/api/v1/search/trending");
}

export function getRecentSearches(token?: string | null) {
  return apiFetch<RecentSearchesResponse>("/api/v1/search/recent", {
    token,
  });
}

export function logSearchQuery(query: string, token?: string | null) {
  return apiFetch<{ status: string }>("/api/v1/search/log", {
    method: "POST",
    token,
    body: { query: query.trim() },
  });
}
