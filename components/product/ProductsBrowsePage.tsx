"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import BrowseCategorySidebar from "@/components/browse/BrowseCategorySidebar";
import BrowseSearchBar from "@/components/browse/BrowseSearchBar";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";
import { useBrowseSidebarCollapse } from "@/hooks/useBrowseSidebarCollapse";
import { browseProductGridForSidebar, catEquals, collectCategoriesFromProducts } from "@/lib/browseCategories";
import { apiProducts } from "@/lib/api";
import { productPageSlug } from "@/lib/productUrl";
import type { HomeFeedProduct } from "@/lib/api/products";

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
}: {
  items: ProductCardData[];
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allItems, setAllItems] = useState(items);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(items.length >= 72);
  const { collapsed, setCollapsed } = useBrowseSidebarCollapse();

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await apiProducts.getHomeFeed(72, next);
      const existing = new Set(allItems.map((p) => p.id));
      const site = window.location.origin;
      const nextItems = (data.algorithm ?? [])
        .filter((fp) => !existing.has(fp.id))
        .map(toCardLocal);
      if (nextItems.length === 0) {
        setHasMore(false);
      } else {
        setAllItems((prev) => [...prev, ...nextItems]);
        setPage(next);
        setHasMore(data.total > next * 72);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, allItems]);

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
    () => collectCategoriesFromProducts(items),
    [items],
  );

  function toCardLocal(fp: HomeFeedProduct): ProductCardData {
    const slug = productPageSlug(fp);
    return {
      id: fp.id,
      slug,
      title: fp.title,
      priceUGX: fp.price_ugx,
      imageUrl: fp.primary_image,
      shopLogoUrl: fp.shop.logo_url ?? undefined,
      viewCount: fp.view_count,
      likeCount: fp.like_count,
      isLiked: fp.viewer_liked ?? undefined,
      shopWhatsApp: fp.shop.whatsapp_number ?? null,
      listingUrl: `/${slug}`,
      sellerId: fp.shop.owner_id ?? null,
      shop: {
        id: fp.shop.id,
        name: fp.shop.name,
        slug: fp.shop.slug,
        verified: fp.shop.is_active,
        category: fp.shop.category ?? null,
        trust_score: fp.shop.trust_score ?? null,
        available_now: fp.shop.available_now ?? null,
        location: fp.shop.location ?? null,
      },
      category: fp.category ?? null,
      boosted: fp.boosted,
      updated_at: fp.updated_at ?? fp.created_at ?? null,
      location_name: fp.location_name ?? null,
    };
  }

  const q = query.trim();
  const categoryFilterActive = selectedCategory !== null;

  const filteredItems = useMemo(() => {
    let list = allItems;
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

          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Latest Listings{filterHint}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Newest products from shops on Midora Online.
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
                {!q.length && !categoryFilterActive && hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="dm-pill dm-focus inline-flex items-center gap-1.5 bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                    >
                      {loadingMore ? "Loading..." : "Load more products"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
