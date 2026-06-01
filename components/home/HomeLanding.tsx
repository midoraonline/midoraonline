"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import BrowseCategorySidebar from "@/components/browse/BrowseCategorySidebar";
import BrowseSearchBar from "@/components/browse/BrowseSearchBar";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";
import { useBrowseSidebarCollapse } from "@/hooks/useBrowseSidebarCollapse";
import { browseProductGridForSidebar, catEquals, collectCategoriesFromProducts } from "@/lib/browseCategories";
import { MaterialSymbol } from "@/components/MaterialSymbol";

function matchesQuery(text: string, q: string): boolean {
  return text.toLowerCase().includes(q.toLowerCase());
}

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
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
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
          className="dm-pill dm-focus inline-flex shrink-0 items-center gap-1.5 bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
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
    <div className="dm-card p-6 sm:p-8">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

type Props = {
  initialProducts: ProductCardData[];
  trendingProducts: ProductCardData[];
  premiumProducts: ProductCardData[];
  freshProducts: ProductCardData[];
};

export default function HomeLanding({
  initialProducts,
  trendingProducts,
  premiumProducts,
  freshProducts,
}: Props) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { collapsed, setCollapsed } = useBrowseSidebarCollapse();

  function handleSearchToggle() {
    if (searchOpen) {
      setSearchOpen(false);
      setQuery("");
    } else {
      setSearchOpen(true);
    }
  }

  const q = query.trim();
  const isSearching = q.length > 0;

  const categories = useMemo(
    () => collectCategoriesFromProducts(initialProducts),
    [initialProducts],
  );

  const filteredProducts = useMemo(() => {
    let list = initialProducts;
    if (selectedCategory) {
      list = list.filter(
        (p) =>
          catEquals(p.category, selectedCategory) ||
          catEquals(p.shop.category, selectedCategory),
      );
    }
    if (!isSearching) return list;
    return list.filter(
      (p) =>
        matchesQuery(p.title, q) ||
        matchesQuery(p.shop.name, q) ||
        matchesQuery(p.category ?? "", q) ||
        matchesQuery(p.shop.category ?? "", q) ||
        matchesQuery(p.location_name ?? "", q) ||
        matchesQuery(p.shop.location ?? "", q),
    );
  }, [initialProducts, q, isSearching, selectedCategory]);

  const filteredTrending = useMemo(() => {
    if (!selectedCategory) return trendingProducts;
    return trendingProducts.filter(
      (p) =>
        catEquals(p.category, selectedCategory) ||
        catEquals(p.shop.category, selectedCategory),
    );
  }, [trendingProducts, selectedCategory]);

  const filteredPremium = useMemo(() => {
    if (!selectedCategory) return premiumProducts;
    return premiumProducts.filter(
      (p) =>
        catEquals(p.category, selectedCategory) ||
        catEquals(p.shop.category, selectedCategory),
    );
  }, [premiumProducts, selectedCategory]);

  const categoryFilterActive = selectedCategory !== null;
  const filterHint = categoryFilterActive ? ` · ${selectedCategory}` : "";

  return (
    <div className="w-full">
      <div className="flex flex-row items-start gap-2 sm:gap-4 lg:gap-6">
        <BrowseCategorySidebar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          listId="home-browse-categories"
          searchActive={searchOpen}
          onSearchToggle={handleSearchToggle}
        />

        <div className="min-w-0 flex-1 space-y-8 sm:space-y-12 lg:space-y-14">
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              searchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <BrowseSearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search products…"
              ariaLabel="Search products"
            />
          </div>

          {(isSearching || categoryFilterActive) && (
            <p className="text-sm text-muted">
              {isSearching ? (
                <>
                  Showing results for{" "}
                  <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
                  {categoryFilterActive ? (
                    <span>
                      {" "}
                      in <span className="font-semibold text-foreground">{selectedCategory}</span>
                    </span>
                  ) : null}{" "}
                  —{" "}
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    clear search
                  </button>
                </>
              ) : (
                <>
                  Filtered by{" "}
                  <span className="font-semibold text-foreground">{selectedCategory}</span>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    clear category
                  </button>
                </>
              )}
            </p>
          )}

          {/* Premium Products */}
          {!isSearching && filteredPremium.length > 0 && (
            <section className="space-y-5">
              <SectionHeader
                title={`Premium Products${filterHint}`}
                subtitle="Top-performing and boosted listings on Midora."
                href="/products"
                linkLabel="See all products"
                icon={<Sparkles className="size-5 text-amber-500" aria-hidden />}
              />
              <div className={browseProductGridForSidebar(collapsed)}>
                {filteredPremium.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* Trending Products */}
          {!isSearching && filteredTrending.length > 0 && (
            <section className="space-y-5">
              <SectionHeader
                title={`Trending${filterHint}`}
                subtitle="The products getting the most attention right now."
                icon={<MaterialSymbol name="trending_up" className="!text-2xl text-rose-500" />}
              />
              <div className={browseProductGridForSidebar(collapsed)}>
                {filteredTrending.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* Fresh Listings */}
          {!isSearching && freshProducts.length > 0 && (
            <section className="space-y-5">
              <SectionHeader
                title={`Fresh Listings${filterHint}`}
                subtitle="Newly added and recently updated products."
                icon={<MaterialSymbol name="new_releases" className="!text-2xl text-emerald-500" />}
              />
              <div className={browseProductGridForSidebar(collapsed)}>
                {freshProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* All Products */}
          <section className="space-y-5">
            <SectionHeader
              title={
                isSearching
                  ? `Products matching "${q}"${filterHint}`
                  : `All Products${filterHint}`
              }
              subtitle={
                isSearching
                  ? undefined
                  : "Browse all listings from shops on Midora."
              }
              href={isSearching ? undefined : "/products"}
              linkLabel={isSearching ? undefined : "See all products"}
            />
            {filteredProducts.length === 0 ? (
              <EmptyState
                message={
                  isSearching || categoryFilterActive
                    ? "No products match your filters. Try another category or keyword."
                    : "No products yet — check back soon."
                }
              />
            ) : (
              <>
                <div className={browseProductGridForSidebar(collapsed)}>
                  {filteredProducts.slice(0, isSearching ? undefined : 24).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {!isSearching && initialProducts.length > 24 && (
                  <div className="pt-1 text-center">
                    <Link
                      href="/products"
                      className="dm-pill dm-focus inline-flex items-center gap-1.5 bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
                    >
                      View all {initialProducts.length} products
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>

          {!isSearching && (
            <section className="dm-card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">New to Midora?</p>
                <p className="mt-1 text-sm text-muted">
                  Learn how the platform works — for shoppers and merchants alike.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="dm-pill dm-focus inline-flex shrink-0 items-center gap-2 bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
              >
                How it works
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
