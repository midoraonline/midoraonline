"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CategoryBrowseSection from "@/components/browse/CategoryBrowseSection";
import ProductFilters, {
  applyFilters,
  DEFAULT_FILTERS,
  type FilterState,
} from "@/components/browse/ProductFilters";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";
import {
  browseProductGridClass,
  categoryFilterDisplayLabel,
  EMPTY_CATEGORY_FILTER,
  isCategoryFilterActive,
  productMatchesCategoryFilter,
  type CategoryFilterSelection,
} from "@/lib/browseCategories";
import { buildNearMeDistanceMap } from "@/lib/geo";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import HomeFeedbackWidget from "@/components/home/HomeFeedbackWidget";
import { useAppSession } from "@/lib/state";
import { apiProducts } from "@/lib/api";
import { HOME_FEED_PAGE_SIZE } from "@/lib/api/products";
import { FEED_ENGAGEMENT_EVENT } from "@/lib/engagementEvents";
import { homeFeedProductToCard } from "@/lib/homeFeedCards";
import { publicSiteOrigin } from "@/lib/publicSite";

const FEED_PAGE_SIZE = HOME_FEED_PAGE_SIZE;

function continuationFrom(
  count: number,
  hasMore?: boolean,
  cursor?: string | null,
): { hasMore: boolean; cursor: string | null } {
  const more = hasMore ?? count >= FEED_PAGE_SIZE;
  return {
    hasMore: more,
    cursor: cursor ?? (more ? "p:2" : null),
  };
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <Package className="size-8 text-muted/50" strokeWidth={1.5} aria-hidden />
      <p className="max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}

type Props = {
  initialProducts: ProductCardData[];
  initialHasMore?: boolean;
  initialCursor?: string | null;
};

export default function HomeLanding({
  initialProducts,
  initialHasMore,
  initialCursor = null,
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterSelection>(EMPTY_CATEGORY_FILTER);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [nearMeDistances, setNearMeDistances] = useState<Map<string, number> | null>(
    null,
  );
  const [nearMeRanking, setNearMeRanking] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: categoryItems } = useCategoryItems();
  const session = useAppSession();
  const [query, setQuery] = useState(() => searchParams.get("q")?.trim() ?? "");
  const [loadingMore, setLoadingMore] = useState(false);
  const initialContinuation = continuationFrom(
    initialProducts.length,
    initialHasMore,
    initialCursor,
  );
  const [hasMore, setHasMore] = useState(initialContinuation.hasMore);
  const nextCursorRef = useRef<string | null>(initialContinuation.cursor);
  const loadMoreSentinelRef = useRef<HTMLButtonElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(initialContinuation.hasMore);
  const seenIdsRef = useRef<Set<string>>(new Set(initialProducts.map((p) => p.id)));
  const isSearching = query.trim().length >= 2;
  hasMoreRef.current = hasMore;
  const search = useProductSearch({
    query,
    category: categoryFilter.subcategoryLabel ?? categoryFilter.parentLabel,
    enabled: isSearching,
    limit: 24,
  });

  useEffect(() => {
    const urlQ = searchParams.get("q")?.trim() ?? "";
    setQuery((prev) => (urlQ !== prev ? urlQ : prev));
  }, [searchParams]);

  const feedCategory = useMemo(() => {
    if (!isCategoryFilterActive(categoryFilter)) return null;
    return (categoryFilter.subcategoryLabel ?? categoryFilter.parentLabel)?.trim() || null;
  }, [categoryFilter]);
  const feedCategoryRef = useRef(feedCategory);
  feedCategoryRef.current = feedCategory;

  useEffect(() => {
    const next = continuationFrom(initialProducts.length, initialHasMore, initialCursor);
    setProducts(initialProducts);
    seenIdsRef.current = new Set(initialProducts.map((p) => p.id));
    setHasMore(next.hasMore);
    nextCursorRef.current = next.cursor;
  }, [initialProducts, initialHasMore, initialCursor]);

  // When the browse category changes, reload from the server so infinite scroll
  // stays in-category. "All" restores the unfiltered home feed.
  const categoryBootRef = useRef(true);
  useEffect(() => {
    if (categoryBootRef.current) {
      categoryBootRef.current = false;
      // If landing with a preselected category (unusual), still fetch.
      if (!feedCategory) return;
    }
    let cancelled = false;
    async function reloadForCategory() {
      loadingMoreRef.current = true;
      setLoadingMore(true);
      try {
        const site = publicSiteOrigin();
        const data = await apiProducts.getHomeFeed({
          limit: FEED_PAGE_SIZE,
          category: feedCategory,
        });
        if (cancelled) return;
        const cards = (data.algorithm ?? []).map((p) => homeFeedProductToCard(p, site));
        seenIdsRef.current = new Set(cards.map((c) => c.id));
        setProducts(cards);
        const more = Boolean(data.has_more && data.next_cursor);
        setHasMore(more);
        nextCursorRef.current = data.next_cursor ?? null;
        hasMoreRef.current = more;
      } catch {
        if (!cancelled) {
          setProducts([]);
          setHasMore(false);
          nextCursorRef.current = null;
          hasMoreRef.current = false;
        }
      } finally {
        if (!cancelled) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      }
    }
    void reloadForCategory();
    return () => {
      cancelled = true;
    };
  }, [feedCategory]);

  const fillEmptyFeed = useCallback(async () => {
    try {
      const site = publicSiteOrigin();
      const data = await apiProducts.getHomeFeed({
        limit: FEED_PAGE_SIZE,
        category: feedCategoryRef.current,
      });
      const cards = (data.algorithm ?? []).map((p) => homeFeedProductToCard(p, site));
      if (cards.length === 0) return;
      seenIdsRef.current = new Set(cards.map((c) => c.id));
      setProducts(cards);
      const more = Boolean(data.has_more && data.next_cursor);
      setHasMore(more);
      nextCursorRef.current = data.next_cursor ?? null;
    } catch {
      /* keep empty SSR feed */
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    const cursor = nextCursorRef.current;
    if (!cursor) {
      setHasMore(false);
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const site = publicSiteOrigin();
      const data = await apiProducts.getHomeFeed({
        limit: FEED_PAGE_SIZE,
        cursor,
        category: feedCategoryRef.current,
      });
      const cards = (data.algorithm ?? []).map((p) => homeFeedProductToCard(p, site));
      const fresh = cards.filter((c) => !seenIdsRef.current.has(c.id));
      if (fresh.length === 0) {
        setHasMore(false);
        nextCursorRef.current = null;
        return;
      }
      fresh.forEach((c) => seenIdsRef.current.add(c.id));
      setProducts((prev) => [...prev, ...fresh]);
      const more = Boolean(data.has_more && data.next_cursor);
      nextCursorRef.current = data.next_cursor ?? null;
      setHasMore(more);
    } catch {
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    if (!hasMore || isSearching) return;
    const node = loadMoreSentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        void loadMoreRef.current();
      },
      {
        root: null,
        rootMargin: "400px 0px",
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isSearching, products.length]);

  useEffect(() => {
    if (!session.hydrated) return;
    if (products.length > 0) return;
    void fillEmptyFeed();
  }, [session.hydrated, products.length, fillEmptyFeed]);

  useEffect(() => {
    function onEngagement() {
      router.refresh();
    }
    window.addEventListener(FEED_ENGAGEMENT_EVENT, onEngagement);
    return () => window.removeEventListener(FEED_ENGAGEMENT_EVENT, onEngagement);
  }, [router]);

  const commitSearch = useCallback(
    (term: string) => {
      const next = term.trim();
      setQuery(next);
      const path = next ? `/?q=${encodeURIComponent(next)}` : "/";
      router.replace(path, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    if (!filters.nearMe || !filters.userGeo) {
      setNearMeDistances(null);
      setNearMeRanking(false);
      return;
    }

    const userGeo = filters.userGeo;
    const ac = new AbortController();
    let cancelled = false;

    async function run() {
      setNearMeRanking(true);
      try {
        // Fast pass: Uganda seed + localStorage cache (no network).
        const quick = await buildNearMeDistanceMap(products, userGeo, {
          allowNetwork: false,
          signal: ac.signal,
        });
        if (cancelled) return;
        setNearMeDistances(new Map(quick.distances));

        // Slow pass: geocode remaining unique places via Nominatim proxy.
        if (quick.pendingNetwork > 0) {
          const full = await buildNearMeDistanceMap(products, userGeo, {
            allowNetwork: true,
            signal: ac.signal,
          });
          if (cancelled) return;
          setNearMeDistances(new Map(full.distances));
        }
      } catch {
        if (!cancelled) setNearMeDistances((prev) => prev ?? new Map());
      } finally {
        if (!cancelled) setNearMeRanking(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [filters.nearMe, filters.userGeo, products]);

  const browseProducts = useMemo(() => {
    let list = products;
    if (isCategoryFilterActive(categoryFilter)) {
      list = list.filter((p) => productMatchesCategoryFilter(p, categoryFilter, categoryItems));
    }
    return applyFilters(list, filters, { distances: nearMeDistances });
  }, [products, categoryFilter, categoryItems, filters, nearMeDistances]);

  const localSearchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return browseProducts.filter((p) => {
      const hay = `${p.title} ${p.category ?? ""} ${p.shop.name}`.toLowerCase();
      return hay.includes(q);
    });
  }, [browseProducts, query]);

  const categoryFilterActive = isCategoryFilterActive(categoryFilter);
  const categoryFilterLabel = categoryFilterDisplayLabel(categoryFilter);
  const filterHint = categoryFilterLabel ? ` · ${categoryFilterLabel}` : "";
  const anyFiltersActive =
    categoryFilterActive ||
    filters.sort !== DEFAULT_FILTERS.sort ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.availableNow ||
    filters.verifiedOnly ||
    filters.minRating !== null ||
    filters.location !== null ||
    filters.nearMe;

  const displayProducts = isSearching
    ? (() => {
        const remote = applyFilters(search.items, filters, { distances: nearMeDistances });
        const seen = new Set(localSearchMatches.map((p) => p.id));
        return [...localSearchMatches, ...remote.filter((p) => !seen.has(p.id))];
      })()
    : browseProducts;
  const feedEmpty = isSearching
    ? !search.loading && displayProducts.length === 0
    : displayProducts.length === 0;

  return (
    <div className="relative w-full">
      <div className="mb-3 space-y-2 sm:mb-4">
        <CategoryBrowseSection
          selection={categoryFilter}
          onSelectionChange={setCategoryFilter}
          showHeader={false}
          browseAllHref="/products"
        />
        <ProductFilters products={products} filters={filters} onChange={setFilters} />
      </div>

      <div id="products-feed" className="space-y-4 sm:space-y-5">
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {isSearching
                ? search.loading
                  ? `Searching “${query.trim()}”…`
                  : `Results for “${query.trim()}”`
                : filters.nearMe
                  ? nearMeRanking
                    ? "Sorting by distance…"
                    : "Closest to you"
                  : `Products${filterHint}`}
            </h2>
            <div className="flex shrink-0 items-center gap-3">
              {isSearching ? (
                <button
                  type="button"
                  onClick={() => commitSearch("")}
                  className="text-[11px] font-medium text-muted transition-colors hover:text-foreground sm:text-xs"
                >
                  Clear search
                </button>
              ) : anyFiltersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter(EMPTY_CATEGORY_FILTER);
                    setFilters(DEFAULT_FILTERS);
                  }}
                  className="text-[11px] font-medium text-muted transition-colors hover:text-foreground sm:text-xs"
                >
                  {displayProducts.length} result{displayProducts.length !== 1 ? "s" : ""} · Clear
                </button>
              ) : null}
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-accent-hover sm:text-xs"
              >
                See all
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>
          </div>

          {search.error ? (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
              {search.error}
            </p>
          ) : null}

          {feedEmpty ? (
            <EmptyState
              message={
                isSearching
                  ? `No products match “${query.trim()}”. Try another search.`
                  : anyFiltersActive
                    ? "No products match your filters. Try a different category or clear filters."
                    : "No products yet — check back soon."
              }
            />
          ) : (
            <>
              <div className={browseProductGridClass}>
                {displayProducts.map((p, idx) => (
                  <div key={p.id} className="h-full">
                    <ProductCard
                      product={p}
                      layout="vertical"
                      impressionPool={p.boosted ? "boosted" : "organic"}
                      impressionPosition={idx + 1}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-3 pt-2">
                {!isSearching && hasMore ? (
                  <button
                    ref={loadMoreSentinelRef}
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/40 disabled:opacity-60"
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                ) : null}
                {isSearching && search.hasMore ? (
                  <button
                    type="button"
                    onClick={() => void search.loadMore()}
                    disabled={search.loadingMore}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/40 disabled:opacity-60"
                  >
                    {search.loadingMore ? "Loading…" : "Load more results"}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>

      <HomeFeedbackWidget />
    </div>
  );
}
