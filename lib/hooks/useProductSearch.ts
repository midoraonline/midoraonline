"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiSearch } from "@/lib/api";
import type { SearchMode } from "@/lib/api/search";
import { searchItemToCard } from "@/lib/searchMap";
import type { ProductCardData } from "@/components/productcard";

type UseProductSearchOptions = {
  query: string;
  category?: string | null;
  enabled?: boolean;
  debounceMs?: number;
  limit?: number;
};

type SearchState = {
  items: ProductCardData[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  mode: SearchMode | null;
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

const EMPTY: SearchState = {
  items: [],
  loading: false,
  loadingMore: false,
  error: null,
  mode: null,
  total: 0,
  page: 0,
  totalPages: 0,
  hasMore: false,
};

export function useProductSearch({
  query,
  category,
  enabled = true,
  debounceMs = 350,
  limit = 20,
}: UseProductSearchOptions) {
  const [state, setState] = useState<SearchState>(EMPTY);
  const requestId = useRef(0);

  const q = query.trim();
  const active = enabled && q.length > 0;

  useEffect(() => {
    if (!active) {
      setState(EMPTY);
      return;
    }

    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const res = await apiSearch.searchProducts(q, {
          page: 1,
          limit,
          category: category ?? undefined,
        });
        if (id !== requestId.current) return;

        const site = typeof window !== "undefined" ? window.location.origin : undefined;
        setState({
          items: res.items.map((item) => searchItemToCard(item, site)),
          loading: false,
          loadingMore: false,
          error: null,
          mode: res.mode,
          total: res.total,
          page: res.page,
          totalPages: res.total_pages,
          hasMore: res.page < res.total_pages,
        });
      } catch (e) {
        if (id !== requestId.current) return;
        setState({
          ...EMPTY,
          error: e instanceof Error ? e.message : "Search failed",
        });
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [q, category, active, debounceMs, limit]);

  const loadMore = useCallback(async () => {
    if (!active || state.loading || state.loadingMore || !state.hasMore) return;

    const id = ++requestId.current;
    const nextPage = state.page + 1;
    setState((s) => ({ ...s, loadingMore: true }));

    try {
      const res = await apiSearch.searchProducts(q, {
        page: nextPage,
        limit,
        category: category ?? undefined,
      });
      if (id !== requestId.current) return;

      const site = typeof window !== "undefined" ? window.location.origin : undefined;
      const existing = new Set(state.items.map((p) => p.id));
      const nextItems = res.items
        .map((item) => searchItemToCard(item, site))
        .filter((p) => !existing.has(p.id));

      setState((s) => ({
        ...s,
        items: [...s.items, ...nextItems],
        loadingMore: false,
        page: res.page,
        totalPages: res.total_pages,
        hasMore: res.page < res.total_pages,
      }));
    } catch {
      if (id !== requestId.current) return;
      setState((s) => ({ ...s, loadingMore: false }));
    }
  }, [active, q, category, limit, state.loading, state.loadingMore, state.hasMore, state.page, state.items]);

  return { ...state, active, loadMore };
}
