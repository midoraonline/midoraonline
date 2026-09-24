"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

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
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { apiProducts } from "@/lib/api";
import type { HomeFeedProduct } from "@/lib/api/products";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import { homeFeedProductToCard } from "@/lib/productCardMap";

export default function ProductsBrowsePage({
  items,
  initialQuery = "",
}: {
  items: ProductCardData[];
  initialQuery?: string;
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterSelection>(EMPTY_CATEGORY_FILTER);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [allItems, setAllItems] = useState(items);
  const { items: categoryItems } = useCategoryItems();
  const [nextCursor, setNextCursor] = useState<string | null>(
    items.length >= 36 ? "p:2" : null,
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(items.length >= 36);

  useEffect(() => {
    setAllItems(items);
    setNextCursor(items.length >= 36 ? "p:2" : null);
    setHasMore(items.length >= 36);
  }, [items]);

  useEffect(() => {
    const urlQ = searchParams.get("q")?.trim() ?? "";
    setQuery((prev) => (urlQ !== prev ? urlQ : prev));
  }, [searchParams]);

  const q = query.trim();
  const categoryFilterActive = isCategoryFilterActive(categoryFilter);
  const categoryFilterLabel = categoryFilterDisplayLabel(categoryFilter);
  const isSearching = q.length > 0;

  const search = useProductSearch({
    query,
    category: categoryFilter.subcategoryLabel ?? categoryFilter.parentLabel,
    enabled: isSearching,
    limit: 20,
  });

  const feedCategory = useMemo(() => {
    if (!categoryFilterActive) return null;
    return (categoryFilter.subcategoryLabel ?? categoryFilter.parentLabel)?.trim() || null;
  }, [categoryFilter, categoryFilterActive]);

  const categoryBootRef = useRef(true);
  useEffect(() => {
    if (categoryBootRef.current) {
      categoryBootRef.current = false;
      if (!feedCategory) return;
    }
    let cancelled = false;
    async function reloadForCategory() {
      setLoadingMore(true);
      try {
        const data = await apiProducts.getHomeFeed({
          limit: 36,
          category: feedCategory,
        });
        if (cancelled) return;
        const nextItems = (data.algorithm ?? []).map(toCardLocal);
        setAllItems(nextItems);
        setNextCursor(data.next_cursor ?? null);
        setHasMore(Boolean(data.has_more && data.next_cursor));
      } catch {
        if (!cancelled) {
          setAllItems([]);
          setNextCursor(null);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoadingMore(false);
      }
    }
    void reloadForCategory();
    return () => {
      cancelled = true;
    };
    // toCardLocal is stable enough for this page; avoid dep churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedCategory]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const data = await apiProducts.getHomeFeed({
        limit: 36,
        cursor: nextCursor,
        category: feedCategory,
      });
      const existing = new Set(allItems.map((p) => p.id));
      const nextItems = (data.algorithm ?? [])
        .filter((fp) => !existing.has(fp.id))
        .map(toCardLocal);
      if (nextItems.length === 0) {
        setHasMore(false);
        setNextCursor(null);
      } else {
        setAllItems((prev) => [...prev, ...nextItems]);
        setNextCursor(data.next_cursor ?? null);
        setHasMore(Boolean(data.has_more && data.next_cursor));
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextCursor, allItems, feedCategory]);

  function toCardLocal(fp: HomeFeedProduct): ProductCardData {
    return homeFeedProductToCard(fp, typeof window !== "undefined" ? window.location.origin : "");
  }

  const browseItems = useMemo(() => {
    if (isSearching) return [];
    let list = allItems;
    if (categoryFilterActive) {
      list = list.filter((p) => productMatchesCategoryFilter(p, categoryFilter, categoryItems));
    }
    return applyFilters(list, filters);
  }, [allItems, categoryFilter, categoryFilterActive, categoryItems, filters, isSearching]);

  const displayItems = isSearching ? applyFilters(search.items, filters) : browseItems;
  const filterHint = categoryFilterLabel ? ` · ${categoryFilterLabel}` : "";

  return (
    <div className="w-full">
      <div className="mb-3 space-y-2 sm:mb-4">
        <CategoryBrowseSection
          selection={categoryFilter}
          onSelectionChange={setCategoryFilter}
          showHeader={false}
        />
        <ProductFilters
          products={allItems}
          filters={filters}
          onChange={setFilters}
          contextParentLabel={categoryFilter.parentLabel}
        />
      </div>

      <div className="space-y-4 sm:space-y-6">
        {(isSearching || categoryFilterActive) && (
          <p className="text-sm text-muted">
            {isSearching ? (
              <>
                Results for <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
                {categoryFilterActive ? (
                  <span>
                    {" "}
                    in <span className="font-semibold text-foreground">{categoryFilterLabel}</span>
                  </span>
                ) : null}
                {search.mode ? (
                  <span className="text-muted/80"> · {search.mode} search</span>
                ) : null}
                {" · "}
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="font-semibold text-foreground underline-offset-2 hover:underline"
                >
                  clear
                </button>
              </>
            ) : (
              <>
                Filtered by{" "}
                <span className="font-semibold text-foreground">{categoryFilterLabel}</span>
                {" · "}
                <button
                  type="button"
                  onClick={() => setCategoryFilter(EMPTY_CATEGORY_FILTER)}
                  className="font-semibold text-foreground underline-offset-2 hover:underline"
                >
                  clear category
                </button>
              </>
            )}
          </p>
        )}

        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {isSearching ? "Search results" : `Latest Listings${filterHint}`}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {isSearching
                  ? "Semantic matches from shops on Midora Online."
                  : "Newest products from shops on Midora Online."}
              </p>
            </div>
            <Link
              href="/shops"
              className="dm-btn dm-btn-secondary inline-flex text-xs"
            >
              Browse shops
            </Link>
          </div>

          {items.length === 0 && !isSearching ? (
            <div className="dm-card mt-6 p-8 sm:p-10">
              <p className="text-sm leading-relaxed text-muted">
                No products are available yet. Open a{" "}
                <Link href="/shops" className="font-semibold text-foreground underline-offset-2 hover:underline">
                  shop
                </Link>{" "}
                to explore storefronts, or check back soon.
              </p>
            </div>
          ) : search.loading && isSearching ? (
            <div className="dm-card mt-6 p-8 text-sm text-muted">Searching…</div>
          ) : search.error && isSearching ? (
            <div className="dm-card mt-6 p-8 text-sm text-muted">{search.error}</div>
          ) : displayItems.length === 0 ? (
            <div className="dm-card mt-6 p-8 text-sm text-muted">
              No listings match your filters. Try clearing search or category.
            </div>
          ) : (
            <>
              <p className="mb-4 mt-6 text-sm text-muted">
                {isSearching ? search.total : displayItems.length} listing
                {(isSearching ? search.total : displayItems.length) === 1 ? "" : "s"}
                {!isSearching && categoryFilterActive ? " (filtered)" : ""}
              </p>
              <div className={browseProductGridClass}>
                {displayItems.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {isSearching && search.hasMore ? (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => void search.loadMore()}
                    disabled={search.loadingMore}
                    className="dm-btn dm-btn-primary inline-flex text-xs"
                  >
                    {search.loadingMore ? "Loading..." : "Load more results"}
                  </button>
                </div>
              ) : !isSearching && !categoryFilterActive && hasMore ? (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="dm-btn dm-btn-primary inline-flex text-xs"
                  >
                    {loadingMore ? "Loading..." : "Load more products"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
