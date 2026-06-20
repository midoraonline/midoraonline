"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import CategoryFilterBar from "@/components/browse/CategoryFilterBar";
import ProductFilters, {
  applyFilters,
  DEFAULT_FILTERS,
  type FilterState,
} from "@/components/browse/ProductFilters";
import ProductSearchBar from "@/components/browse/ProductSearchBar";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";
import { browseProductGridClass, catEquals, collectCategoriesFromProducts } from "@/lib/browseCategories";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import HomeHeroSlider from "@/components/home/HomeHeroSlider";

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
  icon,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl">
          {icon}
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="dm-btn dm-btn-sm shrink-0 bg-accent px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-accent-hover"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="dm-card flex flex-col items-center justify-center gap-3 p-8 text-center sm:p-12">
      <MaterialSymbol name="inventory_2" className="!text-4xl text-muted/30" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

type Props = {
  initialProducts: ProductCardData[];
};

export default function HomeLanding({
  initialProducts,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const categories = useMemo(
    () => collectCategoriesFromProducts(initialProducts),
    [initialProducts],
  );

  const heroImages = useMemo(() => {
    const seen = new Set<string>();
    const imgs: string[] = [];
    for (const p of initialProducts) {
      if (p.imageUrl && !seen.has(p.imageUrl)) {
        seen.add(p.imageUrl);
        imgs.push(p.imageUrl);
        if (imgs.length >= 4) break;
      }
    }
    return imgs;
  }, [initialProducts]);

  const browseProducts = useMemo(() => {
    let list = initialProducts;
    if (selectedCategory) {
      list = list.filter(
        (p) =>
          catEquals(p.category, selectedCategory) ||
          catEquals(p.shop.category, selectedCategory),
      );
    }
    list = applyFilters(list, filters);
    return list;
  }, [initialProducts, isSearching, selectedCategory, filters]);



            const displayProducts = isSearching ? search.items : browseProducts;
  const categoryFilterActive = selectedCategory !== null;
  const filterHint = categoryFilterActive ? ` · ${selectedCategory}` : "";
  const anyFiltersActive =
    categoryFilterActive ||
    filters.sort !== DEFAULT_FILTERS.sort ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.availableNow ||
    filters.verifiedOnly ||
    filters.minRating !== null ||
    filters.location !== null;

  return (
    <div className="w-full">
      {!categoryFilterActive && (
        <div className="mb-5 sm:mb-6 lg:mb-8">
          <HomeHeroSlider bgImages={heroImages} />
        </div>
      )}

      <div className="w-full">
        <CategoryFilterBar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <ProductFilters
          products={initialProducts}
          filters={filters}
          onChange={setFilters}
        />

        <div className="space-y-8 sm:space-y-10 lg:space-y-12">
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              searchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <ProductSearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search products…"
              ariaLabel="Search products"
            />
          </div>

          {(isSearching || anyFiltersActive) && (
            <div className="flex items-center gap-2 rounded-xl bg-surface-subtle px-4 py-2.5 text-sm">
              {isSearching ? (
                <>
                  <span className="text-muted">
                    Showing results for{" "}
                    <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
                    {categoryFilterActive ? (
                      <span>
                        {" "}
                        in <span className="font-semibold text-foreground">{selectedCategory}</span>
                      </span>
                    ) : null}
                    {search.mode ? (
                      <span className="text-muted/80"> · {search.mode} search</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <>
                  <span className="text-muted">
                    {categoryFilterActive ? (
                      <>
                        Filtered by{" "}
                        <span className="font-semibold text-foreground">{selectedCategory}</span>
                        {browseProducts.length > 0 && (
                          <span className="text-muted/80"> · {browseProducts.length} result{browseProducts.length !== 1 ? "s" : ""}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">{browseProducts.length} result{browseProducts.length !== 1 ? "s" : ""}</span>
                        <span className="text-muted/80"> with filters applied</span>
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null);
                      setFilters(DEFAULT_FILTERS);
                    }}
                    className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          )}


          <section className="space-y-4">
            <SectionHeader
              title={`All Products${filterHint}`}
              subtitle="Browse all listings from shops on Midora."
              href="/products"
              linkLabel="See all"
            />
            {displayProducts.length === 0 ? (
              <EmptyState
                message={
                  anyFiltersActive || isSearching
                    ? "No products match your filters. Try adjusting your filters or keyword."
                    : "No products yet — check back soon."
                }
              />
            ) : (
              <>
                <div className={browseProductGridClass}>
                  {displayProducts.slice(0, 24).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {initialProducts.length > 0 && (
                  <div className="pt-2 text-center">
                    <Link
                      href="/products"
                      className="dm-btn dm-btn-primary inline-flex items-center gap-1.5 px-6"
                    >
                      View all products
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                )}
              </>
            )}
            </section>

            <section className="dm-card relative overflow-hidden p-6 sm:flex sm:items-center sm:justify-between sm:p-8">
              <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent blur-2xl" />
              </div>
              <div className="relative min-w-0">
                <p className="text-sm font-semibold text-foreground">New to Midora?</p>
                <p className="mt-1 text-sm text-muted">
                  Learn how the platform works — for shoppers and merchants alike.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="dm-btn dm-btn-primary relative mt-4 inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-xs sm:mt-0"
              >
                How it works
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </section>
        </div>
      </div>
    </div>
  );
}
