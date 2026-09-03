"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CategoryBrowseSection from "@/components/browse/CategoryBrowseSection";
import ProductFilters, {
  applyFilters,
  DEFAULT_FILTERS,
  type FilterState,
} from "@/components/browse/ProductFilters";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";
import {
  categoryFilterDisplayLabel,
  EMPTY_CATEGORY_FILTER,
  isCategoryFilterActive,
  productMatchesCategoryFilter,
  type CategoryFilterSelection,
} from "@/lib/browseCategories";
import { buildNearMeDistanceMap } from "@/lib/geo";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { Package } from "lucide-react";
import HomeHero from "@/components/home/HomeHero";
import HomeOnboardingBanner from "@/components/home/HomeOnboardingBanner";
import HomeFeedbackWidget from "@/components/home/HomeFeedbackWidget";
import { useAppSession } from "@/lib/state";
import { apiProducts } from "@/lib/api";
import { FEED_ENGAGEMENT_EVENT } from "@/lib/engagementEvents";
import { homeFeedProductToCard } from "@/lib/homeFeedCards";
import { publicSiteOrigin } from "@/lib/publicSite";

const FEED_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const FEED_REFRESH_KEY_PREFIX = "midora:feed:last-refresh:";

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
};

export default function HomeLanding({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterSelection>(EMPTY_CATEGORY_FILTER);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [nearMeDistances, setNearMeDistances] = useState<Map<string, number> | null>(
    null,
  );
  const [nearMeRanking, setNearMeRanking] = useState(false);
  const router = useRouter();
  const { items: categoryItems } = useCategoryItems();
  const session = useAppSession();
  const [showPopup, setShowPopup] = useState<"signed-in" | "unsigned" | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const nextCursorRef = useRef<string | null>("p:2");
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const feedViewerKey = session.user?.id ?? "guest";

  const seenIdsRef = useRef<Set<string>>(new Set(initialProducts.map((p) => p.id)));

  useEffect(() => {
    setProducts(initialProducts);
    seenIdsRef.current = new Set(initialProducts.map((p) => p.id));
    setHasMore(true);
    nextCursorRef.current = "p:2";
  }, [initialProducts]);

  const buildExcludeParam = useCallback((): string | undefined => {
    const ids = [...seenIdsRef.current].slice(-500);
    return ids.length > 0 ? ids.join(",") : undefined;
  }, []);

  const getRefreshStorageKey = useCallback(
    () => `${FEED_REFRESH_KEY_PREFIX}${feedViewerKey}`,
    [feedViewerKey],
  );

  const shouldRefreshFeed = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(getRefreshStorageKey());
      if (!raw) return true;
      const last = Number(raw);
      if (!Number.isFinite(last)) return true;
      return Date.now() - last >= FEED_REFRESH_INTERVAL_MS;
    } catch {
      return true;
    }
  }, [getRefreshStorageKey]);

  const markFeedRefreshed = useCallback(() => {
    try {
      localStorage.setItem(getRefreshStorageKey(), String(Date.now()));
    } catch {
      /* ignore storage restrictions */
    }
  }, [getRefreshStorageKey]);

  const refreshFeed = useCallback(async () => {
    if (!shouldRefreshFeed()) return;
    try {
      const site = publicSiteOrigin();
      // Continuation only: ask for the next unseen batch after current cards.
      // Do not use page/cursor here — backend treats exclude_ids as "next head".
      const exclude = buildExcludeParam();
      const data = await apiProducts.getHomeFeed(
        36,
        1,
        undefined,
        exclude,
        undefined,
      );
      const cards = (data.algorithm ?? []).map((p) => homeFeedProductToCard(p, site));
      const filtered = cards.filter((c) => !seenIdsRef.current.has(c.id));
      if (filtered.length > 0) {
        filtered.forEach((c) => seenIdsRef.current.add(c.id));
        setProducts((prev) => [...prev, ...filtered]);
        setHasMore(true);
      }
      markFeedRefreshed();
    } catch {
      /* keep current feed */
    }
  }, [buildExcludeParam, markFeedRefreshed, shouldRefreshFeed]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const site = publicSiteOrigin();
      // Load-more: exclude already-shown IDs only. No cursor — combining
      // exclude + page/cursor double-skipped the next personalized page.
      const data = await apiProducts.getHomeFeed(
        36,
        1,
        undefined,
        buildExcludeParam(),
        undefined,
      );
      const cards = (data.algorithm ?? []).map((p) => homeFeedProductToCard(p, site));
      const fresh = cards.filter((c) => !seenIdsRef.current.has(c.id));
      if (fresh.length === 0) {
        setHasMore(false);
      } else {
        fresh.forEach((c) => seenIdsRef.current.add(c.id));
        setProducts((prev) => [...prev, ...fresh]);
        setHasMore(Boolean(data.has_more) || fresh.length >= 36);
      }
      nextCursorRef.current = data.next_cursor ?? null;
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [buildExcludeParam, hasMore, loadingMore]);

  useEffect(() => {
    if (!hasMore) return;
    const node = loadMoreSentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        void loadMore();
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    if (!session.hydrated) return;
    if (products.length > 0) return;
    void refreshFeed();
  }, [session.hydrated, products.length, refreshFeed]);

  useEffect(() => {
    function onEngagement() {
      void refreshFeed();
      router.refresh();
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") void refreshFeed();
    }
    window.addEventListener(FEED_ENGAGEMENT_EVENT, onEngagement);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener(FEED_ENGAGEMENT_EVENT, onEngagement);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshFeed, router]);

  useEffect(() => {
    if (!session.hydrated) return;
    if (!session.isAuthenticated) return;
    if (localStorage.getItem("midora_popup_dismissed") === "true") return;
    const timer = setTimeout(() => {
      setShowPopup("signed-in");
    }, 100);
    return () => clearTimeout(timer);
  }, [session.hydrated, session.isAuthenticated]);

  const dismissPopup = () => {
    localStorage.setItem("midora_popup_dismissed", "true");
    setShowPopup(null);
  };

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

  return (
    <div className="relative w-full">
      {showPopup ? (
        <HomeOnboardingBanner variant={showPopup} onDismiss={dismissPopup} />
      ) : null}

      <div className="mb-3 sm:mb-4">
        <HomeHero />
      </div>

      <div className="mb-4 space-y-3 sm:mb-5 sm:space-y-4">
        <CategoryBrowseSection
          selection={categoryFilter}
          onSelectionChange={setCategoryFilter}
          browseAllHref="/products"
        />
        <ProductFilters products={products} filters={filters} onChange={setFilters} />
      </div>

      <div id="products-feed" className="space-y-5 sm:space-y-6">
        <section className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {filters.nearMe
                ? nearMeRanking
                  ? "Sorting by distance…"
                  : "Closest to you"
                : `Products${filterHint}`}
            </h2>
            <div className="flex shrink-0 items-center gap-3">
              {anyFiltersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter(EMPTY_CATEGORY_FILTER);
                    setFilters(DEFAULT_FILTERS);
                  }}
                  className="text-[11px] font-medium text-muted transition-colors hover:text-foreground sm:text-xs"
                >
                  {browseProducts.length} result{browseProducts.length !== 1 ? "s" : ""} · Clear
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

          {browseProducts.length === 0 ? (
            <EmptyState
              message={
                anyFiltersActive
                  ? "No products match your filters. Try a different category or clear filters."
                  : "No products yet — check back soon."
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {browseProducts.map((p, idx) => (
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
              <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row sm:justify-center">
                {hasMore ? (
                  <div
                    ref={loadMoreSentinelRef}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs text-muted"
                  >
                    {loadingMore ? "Loading more…" : "Loading more as you scroll…"}
                  </div>
                ) : null}
                <Link
                  href="/products"
                  className="dm-btn dm-btn-primary inline-flex items-center gap-1.5 px-6"
                >
                  View all products
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary p-6 sm:flex sm:items-center sm:justify-between sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative min-w-0">
            <p className="text-sm font-semibold text-primary-foreground">New to Midora?</p>
            <p className="mt-1 text-sm text-primary-foreground/70">
              Learn how the platform works — for shoppers and merchants alike.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="relative mt-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover sm:mt-0"
          >
            How it works
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      </div>

      <HomeFeedbackWidget />
    </div>
  );
}
