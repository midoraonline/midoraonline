"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import HomeHero from "@/components/home/HomeHero";
import HomeQuickActions from "@/components/home/HomeQuickActions";
import HomeOnboardingBanner from "@/components/home/HomeOnboardingBanner";
import HomeFeedbackWidget from "@/components/home/HomeFeedbackWidget";
import { useAppSession } from "@/lib/state";
import { apiProducts } from "@/lib/api";
import { FEED_ENGAGEMENT_EVENT } from "@/lib/engagementEvents";
import { homeFeedProductToCard } from "@/lib/homeFeedCards";
import { publicSiteOrigin } from "@/lib/publicSite";

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold tracking-tight text-primary sm:text-xl lg:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p>
        ) : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="dm-btn dm-btn-sm inline-flex shrink-0 items-center gap-1.5 bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-subtle p-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary/5 text-primary">
        <MaterialSymbol name="inventory_2" className="!text-2xl text-muted" />
      </span>
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
  const router = useRouter();
  const { items: categoryItems } = useCategoryItems();
  const session = useAppSession();
  const [showPopup, setShowPopup] = useState<"signed-in" | "unsigned" | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const refreshFeed = useCallback(async () => {
    try {
      const site = publicSiteOrigin();
      const data = await apiProducts.getHomeFeed(72);
      setProducts((data.algorithm ?? []).map((p) => homeFeedProductToCard(p, site)));
    } catch {
      /* keep current feed */
    }
  }, []);

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
    if (localStorage.getItem("midora_popup_dismissed") === "true") return;
    const timer = setTimeout(() => {
      setShowPopup(session.isAuthenticated ? "signed-in" : "unsigned");
    }, 100);
    return () => clearTimeout(timer);
  }, [session.hydrated, session.isAuthenticated]);

  const dismissPopup = () => {
    localStorage.setItem("midora_popup_dismissed", "true");
    setShowPopup(null);
  };

  const browseProducts = useMemo(() => {
    let list = products;
    if (isCategoryFilterActive(categoryFilter)) {
      list = list.filter((p) => productMatchesCategoryFilter(p, categoryFilter, categoryItems));
    }
    return applyFilters(list, filters);
  }, [products, categoryFilter, categoryItems, filters]);

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
    filters.location !== null;

  const scrollToFeed = () => {
    document.getElementById("products-feed")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      {showPopup ? (
        <HomeOnboardingBanner variant={showPopup} onDismiss={dismissPopup} />
      ) : null}

      <div className="mb-5 sm:mb-6 lg:mb-8">
        <HomeHero />
      </div>

      <CategoryBrowseSection
        selection={categoryFilter}
        onSelectionChange={setCategoryFilter}
        browseAllHref="/products"
      />

      <div className="mb-5 rounded-2xl border border-border bg-surface p-3 sm:p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Refine results
        </p>
        <ProductFilters products={products} filters={filters} onChange={setFilters} />
      </div>

      {!categoryFilterActive ? (
        <HomeQuickActions
          onApplyFilter={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
          onScrollToFeed={scrollToFeed}
        />
      ) : null}

      <div id="products-feed" className="space-y-8 sm:space-y-10">
        {anyFiltersActive ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm">
            <MaterialSymbol name="filter_alt" className="!text-base text-accent" />
            <span className="text-muted">
              {categoryFilterActive ? (
                <>
                  Showing <span className="font-semibold text-primary">{categoryFilterLabel}</span>
                  {browseProducts.length > 0 ? (
                    <span className="text-muted/80">
                      {" "}
                      · {browseProducts.length} result{browseProducts.length !== 1 ? "s" : ""}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="font-semibold text-primary">{browseProducts.length} results</span>
                  <span className="text-muted/80"> with filters applied</span>
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter(EMPTY_CATEGORY_FILTER);
                setFilters(DEFAULT_FILTERS);
              }}
              className="ml-auto text-xs font-semibold text-accent hover:text-accent-hover"
            >
              Clear all
            </button>
          </div>
        ) : null}

        <section className="space-y-5">
          <SectionHeader
            title={`All Products${filterHint}`}
            subtitle="Browse listings from verified shops on Midora."
            href="/products"
            linkLabel="See all"
          />

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
                {browseProducts.slice(0, 24).map((p) => (
                  <div key={p.id} className="h-full">
                    <ProductCard product={p} layout="vertical" />
                  </div>
                ))}
              </div>
              {products.length > 0 ? (
                <div className="pt-2 text-center">
                  <Link
                    href="/products"
                    className="dm-btn dm-btn-primary inline-flex items-center gap-1.5 px-6"
                  >
                    View all products
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-border bg-primary p-6 sm:flex sm:items-center sm:justify-between sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative min-w-0">
            <p className="text-sm font-semibold text-white">New to Midora?</p>
            <p className="mt-1 text-sm text-white/70">
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
