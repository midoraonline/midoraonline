"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import { apiSearch } from "@/lib/api";
import { catalogQueryKey, type CatalogQuery } from "@/lib/api/catalogFilters";
import type { SearchMode, SearchProductsResponse } from "@/lib/api/search";
import { searchItemToCard } from "@/lib/searchMap";
import type { ProductCardData } from "@/components/productcard";

type UseProductSearchOptions = {
  query: string;
  category?: string | null;
  catalog?: CatalogQuery | null;
  enabled?: boolean;
  debounceMs?: number;
  limit?: number;
};

export function useProductSearch({
  query,
  category,
  catalog,
  enabled = true,
  debounceMs = 350,
  limit = 20,
}: UseProductSearchOptions) {
  const q = query.trim();
  const active = enabled && q.length > 0;
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [extra, setExtra] = useState<ProductCardData[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const trackedQuery = useRef<string | null>(null);

  useEffect(() => {
    if (!active) {
      setDebouncedQ("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQ(q), debounceMs);
    return () => clearTimeout(timer);
  }, [q, active, debounceMs]);

  const filterKey = catalogQueryKey(catalog);
  const key =
    active && debouncedQ
      ? (["search:products", debouncedQ, filterKey, limit] as const)
      : null;

  const { data, error, isLoading } = useSWR(
    key,
    ([, searchQ, , lim]) =>
      apiSearch.searchProducts(searchQ, {
        page: 1,
        limit: lim,
        catalog,
      }),
    { revalidateOnFocus: false, dedupingInterval: 8_000 },
  );

  useEffect(() => {
    setExtra([]);
    setPage(1);
    trackedQuery.current = null;
  }, [debouncedQ, filterKey, limit]);

  useEffect(() => {
    if (!data || !debouncedQ) return;
    if (trackedQuery.current === debouncedQ) return;
    trackedQuery.current = debouncedQ;
    void import("@/lib/analytics")
      .then(({ track }) => {
        track("marketplace:search", {
          query: debouncedQ,
          category: category ?? undefined,
          resultCount: data.total,
          verifiedCount: data.total,
        });
      })
      .catch(() => {
        /* analytics never breaks search */
      });
  }, [data, debouncedQ, category]);

  const firstItems = useMemo(() => {
    const site = typeof window !== "undefined" ? window.location.origin : undefined;
    return (data?.items ?? []).map((item) => searchItemToCard(item, site));
  }, [data]);

  const items = extra.length ? [...firstItems, ...extra] : firstItems;
  const totalPages = data?.total_pages ?? 0;
  const hasMore = page < totalPages;

  const loadMore = useCallback(async () => {
    if (!active || !debouncedQ || isLoading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res: SearchProductsResponse = await apiSearch.searchProducts(debouncedQ, {
        page: nextPage,
        limit,
        catalog,
      });
      const site = typeof window !== "undefined" ? window.location.origin : undefined;
      const seen = new Set(items.map((p) => p.id));
      const nextItems = res.items
        .map((item) => searchItemToCard(item, site))
        .filter((p) => !seen.has(p.id));
      setExtra((prev) => [...prev, ...nextItems]);
      setPage(res.page);
    } catch {
      /* keep current results */
    } finally {
      setLoadingMore(false);
    }
  }, [
    active,
    debouncedQ,
    isLoading,
    loadingMore,
    hasMore,
    page,
    limit,
    catalog,
    items,
  ]);

  return {
    items: active ? items : [],
    loading: active && (debouncedQ !== q || isLoading),
    loadingMore,
    error: error instanceof Error ? error.message : error ? "Search failed" : null,
    mode: (data?.mode ?? null) as SearchMode | null,
    total: data?.total ?? 0,
    page,
    totalPages,
    hasMore: active && hasMore,
    active,
    loadMore,
  };
}
