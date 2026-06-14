"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CategoryFilterBar from "@/components/browse/CategoryFilterBar";
import ProductSearchBar from "@/components/browse/ProductSearchBar";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";
import { browseProductGridClass, catEquals, collectCategoriesFromProducts } from "@/lib/browseCategories";
import { apiProducts } from "@/lib/api";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import { productPageSlug } from "@/lib/productUrl";
import type { HomeFeedProduct } from "@/lib/api/products";

export default function ProductsBrowsePage({
  items,
  initialQuery = "",
}: {
  items: ProductCardData[];
  initialQuery?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [searchOpen, setSearchOpen] = useState(initialQuery.length > 0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allItems, setAllItems] = useState(items);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(items.length >= 72);

  const q = query.trim();
  const categoryFilterActive = selectedCategory !== null;
  const isSearching = q.length > 0;

  const search = useProductSearch({
    query,
    category: selectedCategory,
    enabled: isSearching,
    limit: 20,
  });

  useEffect(() => {
    const urlQ = searchParams.get("q")?.trim() ?? "";
    setQuery((prev) => (urlQ !== prev ? urlQ : prev));
    if (urlQ) setSearchOpen(true);
  }, [searchParams]);

  function syncQueryToUrl(nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = nextQuery.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    syncQueryToUrl(next);
  }

  function handleSearchSubmit(next: string) {
    handleQueryChange(next);
  }

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await apiProducts.getHomeFeed(72, next);
      const existing = new Set(allItems.map((p) => p.id));
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
      handleQueryChange("");
    } else {
      setSearchOpen(true);
    }
  }

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

  const browseItems = useMemo(() => {
    if (isSearching) return [];
    let list = allItems;
    if (selectedCategory) {
      list = list.filter(
        (p) =>
          catEquals(p.category, selectedCategory) ||
          catEquals(p.shop.category, selectedCategory),
      );
    }
    return list;
  }, [allItems, selectedCategory, isSearching]);

  const displayItems = isSearching ? search.items : browseItems;
  const filterHint = categoryFilterActive ? ` · ${selectedCategory}` : "";

  return (
    <div className="w-full">
      <CategoryFilterBar
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        searchActive={searchOpen}
        onSearchToggle={handleSearchToggle}
      />

      <div className="space-y-4 sm:space-y-6">
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            searchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <ProductSearchBar
            value={query}
            onChange={handleQueryChange}
            onSubmit={handleSearchSubmit}
            placeholder="Search products…"
            ariaLabel="Search products"
          />
        </div>

        {(isSearching || categoryFilterActive) && (
          <p className="text-sm text-muted">
            {isSearching ? (
              <>
                Results for <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
                {categoryFilterActive ? (
                  <span>
                    {" "}
                    in <span className="font-semibold text-foreground">{selectedCategory}</span>
                  </span>
                ) : null}
                {search.mode ? (
                  <span className="text-muted/80"> · {search.mode} search</span>
                ) : null}
                {" · "}
                <button
                  type="button"
                  onClick={() => handleQueryChange("")}
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
