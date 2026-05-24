"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import BrowseCategorySidebar from "@/components/browse/BrowseCategorySidebar";
import BrowseSearchBar from "@/components/browse/BrowseSearchBar";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";
import { useBrowseSidebarCollapse } from "@/hooks/useBrowseSidebarCollapse";
import { browseProductGridForSidebar, catEquals, collectCategoriesFromProducts } from "@/lib/browseCategories";
import { apiProducts } from "@/lib/api";

function matchesProductSearch(p: ProductCardData, q: string): boolean {
  const qq = q.trim().toLowerCase();
  if (!qq) return true;
  return (
    p.title.toLowerCase().includes(qq) ||
    p.shop.name.toLowerCase().includes(qq) ||
    (p.category ?? "").toLowerCase().includes(qq) ||
    (p.shop.category ?? "").toLowerCase().includes(qq)
  );
}

export default function ProductsBrowsePage({
  items,
  mostViewed,
}: {
  items: ProductCardData[];
  mostViewed: ProductCardData[];
}) {
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

  useEffect(() => {
    const q = query.trim();
    if (q.length >= 2) {
      const timer = setTimeout(() => {
        apiProducts.logSearch(q).catch(() => {});
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [query]);

  const categories = useMemo(
    () => collectCategoriesFromProducts([...items, ...mostViewed]),
    [items, mostViewed],
  );

  const q = query.trim();
  const categoryFilterActive = selectedCategory !== null;

  const filteredMostViewed = useMemo(() => {
    let list = mostViewed;
    if (selectedCategory) {
      list = list.filter(
        (p) =>
          catEquals(p.category, selectedCategory) ||
          catEquals(p.shop.category, selectedCategory),
      );
    }
    list = list.filter((p) => matchesProductSearch(p, query));
    return list;
  }, [mostViewed, selectedCategory, query]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (selectedCategory) {
      list = list.filter(
        (p) =>
          catEquals(p.category, selectedCategory) ||
          catEquals(p.shop.category, selectedCategory),
      );
    }
    list = list.filter((p) => matchesProductSearch(p, query));
    return list;
  }, [items, selectedCategory, query]);

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
          listId="products-browse-categories"
          searchActive={searchOpen}
          onSearchToggle={handleSearchToggle}
        />

        <div className="min-w-0 flex-1 space-y-4 sm:space-y-6">
          {/* Collapsible full-width search bar */}
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

          {(q.length > 0 || categoryFilterActive) && (
            <p className="text-sm text-muted">
              {q.length > 0 ? (
                <>
                  Results for <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
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

          {mostViewed.length > 0 && (
            <section>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                    Most viewed{filterHint}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    The listings getting the most attention right now.
                  </p>
                </div>
              </div>
              {filteredMostViewed.length === 0 ? (
                <div className="dm-card p-6 text-sm text-muted">No results in this section for your filters.</div>
              ) : (
                <div className={browseProductGridForSidebar(collapsed)}>
                  {filteredMostViewed.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Products{filterHint}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Browse listings from shops on Midora Online.
                </p>
              </div>
              <Link
                href="/shops"
                className="dm-pill dm-focus shrink-0 bg-foreground/[0.07] px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
              >
                Browse shops
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="dm-card mt-6 p-8 sm:p-10">
                <p className="text-sm leading-relaxed text-muted">
                  No products are available yet. Open a{" "}
                  <Link href="/shops" className="font-semibold text-foreground underline-offset-2 hover:underline">
                    shop
                  </Link>{" "}
                  to explore storefronts, or check back soon.
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="dm-card mt-6 p-8 text-sm text-muted">
                No listings match your filters. Try clearing search or category.
              </div>
            ) : (
              <>
                <p className="mb-4 mt-6 text-sm text-muted">
                  {filteredItems.length} listing{filteredItems.length === 1 ? "" : "s"}
                  {q.length > 0 || categoryFilterActive ? " (filtered)" : ""}
                </p>
                <div className={browseProductGridForSidebar(collapsed)}>
                  {filteredItems.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
