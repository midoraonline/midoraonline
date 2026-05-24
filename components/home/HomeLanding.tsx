"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import BrowseCategorySidebar from "@/components/browse/BrowseCategorySidebar";
import BrowseSearchBar from "@/components/browse/BrowseSearchBar";
import ShopCard from "@/components/shopcard";
import ProductCard from "@/components/productcard";
import type { Shop } from "@/lib/api/shops";
import type { ProductCardData } from "@/components/productcard";
import { useBrowseSidebarCollapse } from "@/hooks/useBrowseSidebarCollapse";
import { browseProductGridForSidebar, browseShopGridForSidebar, catEquals, collectCategoriesFromShopsAndProducts } from "@/lib/browseCategories";

function locationDisplay(loc: unknown): string {
  if (typeof loc === "string") return loc;
  if (loc && typeof loc === "object" && "display" in loc)
    return String((loc as { display?: string }).display ?? "Online");
  return "Online";
}

function matchesQuery(text: string, q: string): boolean {
  return text.toLowerCase().includes(q.toLowerCase());
}

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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="dm-pill dm-focus inline-flex shrink-0 items-center gap-1.5 bg-foreground/[0.07] px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
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
  initialShops: Shop[];
  initialProducts: ProductCardData[];
  mostViewed: ProductCardData[];
};

export default function HomeLanding({ initialShops, initialProducts, mostViewed }: Props) {
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
    () => collectCategoriesFromShopsAndProducts(initialShops, initialProducts),
    [initialShops, initialProducts],
  );

  const filteredShops = useMemo(() => {
    let list = initialShops.filter((s) => s.is_active !== false);

    if (selectedCategory) {
      list = list.filter((s) => catEquals(s.category, selectedCategory));
    }

    if (!isSearching) return list;
    return list.filter(
      (s) =>
        matchesQuery(s.name, q) ||
        matchesQuery(s.description ?? "", q) ||
        matchesQuery(s.category ?? "", q) ||
        matchesQuery(locationDisplay(s.location), q),
    );
  }, [initialShops, q, isSearching, selectedCategory]);

  const filteredProducts = useMemo(() => {
    let list = initialProducts;

    if (selectedCategory) {
      list = list.filter(
        (p) =>
          catEquals(p.category, selectedCategory) ||
          catEquals(p.shop.category, selectedCategory),
      );
    }

    if (!isSearching) return list.slice(0, 12);
    return list.filter(
      (p) =>
        matchesQuery(p.title, q) ||
        matchesQuery(p.shop.name, q) ||
        matchesQuery(p.category ?? "", q) ||
        matchesQuery(p.shop.category ?? "", q),
    );
  }, [initialProducts, q, isSearching, selectedCategory]);

  const filteredMostViewed = useMemo(() => {
    if (!selectedCategory) return mostViewed;
    return mostViewed.filter(
      (p) =>
        catEquals(p.category, selectedCategory) ||
        catEquals(p.shop.category, selectedCategory),
    );
  }, [mostViewed, selectedCategory]);

  const shopsToShow = isSearching ? filteredShops : filteredShops.slice(0, 9);

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
          {/* Collapsible full-width search bar */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              searchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <BrowseSearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search shops and products…"
              ariaLabel="Search shops and products"
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

          {!isSearching && filteredMostViewed.length > 0 && (
            <section className="space-y-5">
              <SectionHeader
                title={`Trending Products${filterHint}`}
                subtitle="The products getting the most attention right now."
                href="/products"
                linkLabel="See all products"
              />
              <div className={browseProductGridForSidebar(collapsed)}>
                {filteredMostViewed.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-5">
            <SectionHeader
              title={
                isSearching
                  ? `Shops matching "${q}"${filterHint}`
                  : `Featured Shops${filterHint}`
              }
              subtitle={isSearching ? undefined : "Verified storefronts from across Uganda."}
              href={isSearching ? undefined : "/shops"}
              linkLabel={isSearching ? undefined : "See all shops"}
            />
            {shopsToShow.length === 0 ? (
              <EmptyState
                message={
                  isSearching || categoryFilterActive
                    ? "No shops match your filters. Try another category or keyword."
                    : "No active shops yet — check back soon."
                }
              />
            ) : (
              <>
                <div className={browseShopGridForSidebar(collapsed)}>
                  {shopsToShow.map((shop) => (
                    <ShopCard
                      key={shop.id}
                      shop={{
                        id: shop.id,
                        slug: shop.slug,
                        name: shop.name,
                        category: shop.category ?? "Shop",
                        location: locationDisplay(shop.location),
                        tagline: shop.description ?? "",
                        verified: shop.is_active ?? true,
                        logoUrl: shop.logo_url ?? null,
                      }}
                    />
                  ))}
                </div>
                {!isSearching && filteredShops.length > 9 && (
                  <div className="pt-1 text-center">
                    <Link
                      href="/shops"
                      className="dm-pill dm-focus inline-flex items-center gap-1.5 bg-foreground/[0.07] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
                    >
                      View all {filteredShops.length} shops
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="space-y-5">
            <SectionHeader
              title={
                isSearching
                  ? `Products matching "${q}"${filterHint}`
                  : `Latest Products${filterHint}`
              }
              subtitle={
                isSearching
                  ? undefined
                  : "Browse listings from shops on Midora. Shop logos appear on each card."
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
                  {filteredProducts.slice(0, isSearching ? undefined : 12).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {!isSearching && initialProducts.length > 12 && (
                  <div className="pt-1 text-center">
                    <Link
                      href="/products"
                      className="dm-pill dm-focus inline-flex items-center gap-1.5 bg-foreground/[0.07] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
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
                className="dm-pill dm-focus inline-flex shrink-0 items-center gap-2 bg-foreground/[0.07] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
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
