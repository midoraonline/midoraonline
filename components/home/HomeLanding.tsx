"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import CategoryFilterBar from "@/components/browse/CategoryFilterBar";
import BrowseSearchBar from "@/components/browse/BrowseSearchBar";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";
import MarqueeCarousel from "@/components/product/MarqueeCarousel";
import type { ShopCardData } from "@/components/shopcard";
import ShopMarqueeCarousel from "@/components/shop/ShopMarqueeCarousel";
import { browseProductGridClass, catEquals, collectCategoriesFromProducts } from "@/lib/browseCategories";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import HomeHeroSlider from "@/components/home/HomeHeroSlider";

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
  trendingProducts: ProductCardData[];
  premiumProducts: ProductCardData[];
  freshProducts: ProductCardData[];
  trendingShops: ShopCardData[];
};

export default function HomeLanding({
  initialProducts,
  trendingProducts,
  premiumProducts,
  freshProducts,
  trendingShops,
}: Props) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const heroImages = useMemo(() => {
    const seen = new Set<string>();
    const imgs: string[] = [];
    for (const p of [...premiumProducts, ...initialProducts]) {
      if (p.imageUrl && !seen.has(p.imageUrl)) {
        seen.add(p.imageUrl);
        imgs.push(p.imageUrl);
        if (imgs.length >= 4) break;
      }
    }
    return imgs;
  }, [premiumProducts, initialProducts]);

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
      {/* ── Hero Slider ────────────────────────────────────── */}
      {!isSearching && !categoryFilterActive && (
        <div className="mb-5 sm:mb-6 lg:mb-8">
          <HomeHeroSlider bgImages={heroImages} />
        </div>
      )}

      {/* ── Browse Content ─────────────────────────────────── */}
      <div className="w-full">
        {/* Mobile filter bar + Desktop category pills */}
        <CategoryFilterBar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          searchActive={searchOpen}
          onSearchToggle={handleSearchToggle}
        />

        <div className="space-y-8 sm:space-y-10 lg:space-y-12">
          {/* Search bar */}
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

          {/* Filter hint */}
          {(isSearching || categoryFilterActive) && (
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
                    Filtered by{" "}
                    <span className="font-semibold text-foreground">{selectedCategory}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          )}

          {/* Premium */}
          {!isSearching && filteredPremium.length > 0 && (
            <section className="space-y-4">
              <SectionHeader
                title={`Premium Products${filterHint}`}
                subtitle="Top-performing and boosted listings on Midora."
                href="/products"
                linkLabel="See all"
                icon={<Sparkles className="size-5 text-amber-500" aria-hidden />}
              />
              <MarqueeCarousel items={filteredPremium} speed={50} />
            </section>
          )}

          {/* Trending Products */}
          {!isSearching && filteredTrending.length > 0 && (
            <section className="space-y-4">
              <SectionHeader
                title={`Trending${filterHint}`}
                subtitle="The products getting the most attention right now."
                href="/products"
                linkLabel="See all"
                icon={<MaterialSymbol name="trending_up" className="!text-2xl text-rose-500" />}
              />
              <MarqueeCarousel items={filteredTrending} speed={50} />
            </section>
          )}

          {/* Trending Shops */}
          {!isSearching && !categoryFilterActive && trendingShops.length > 0 && (
            <section className="space-y-4">
              <SectionHeader
                title="Trending Shops"
                subtitle="The most-visited shops on Midora right now."
                href="/shops"
                linkLabel="See all"
                icon={<MaterialSymbol name="storefront" className="!text-2xl text-violet-500" />}
              />
              <ShopMarqueeCarousel items={trendingShops} speed={50} />
            </section>
          )}

          {/* Fresh Listings */}
          {!isSearching && freshProducts.length > 0 && (
            <section className="space-y-4">
              <SectionHeader
                title={`Fresh Listings${filterHint}`}
                subtitle="Newly added and recently updated products."
                href="/products"
                linkLabel="See all"
                icon={<MaterialSymbol name="new_releases" className="!text-2xl text-emerald-500" />}
              />
              <div className={browseProductGridClass}>
                {freshProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* All Products */}
          <section className="space-y-4">
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
              linkLabel={isSearching ? undefined : "See all"}
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
                <div className={browseProductGridClass}>
                  {filteredProducts.slice(0, isSearching ? undefined : 24).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {!isSearching && initialProducts.length > 0 && (
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

          {/* CTA */}
          {!isSearching && (
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
          )}
        </div>
      </div>
    </div>
  );
}
