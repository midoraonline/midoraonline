"use client";

import { useMemo, useState } from "react";

import CategoryFilterBar from "@/components/browse/CategoryFilterBar";
import BrowseSearchBar from "@/components/browse/BrowseSearchBar";
import ShopListRealtime from "@/components/shop/ShopListRealtime";
import { browseShopGridClass, collectCategoriesFromShopProductMap } from "@/lib/browseCategories";
import type { Shop } from "@/lib/api/shops";

export default function ShopsBrowsePage({
  initialShops,
  shopProductCategories,
}: {
  initialShops: Shop[];
  shopProductCategories: Record<string, string[]>;
}) {
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

  const categories = useMemo(
    () => collectCategoriesFromShopProductMap(shopProductCategories),
    [shopProductCategories],
  );
  const categoryFilterActive = selectedCategory !== null;
  const q = query.trim();

  const totalShops = initialShops.filter((s) => (s as { is_active?: boolean }).is_active !== false).length;

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Browse Shops</h1>
          {totalShops > 0 && (
            <span className="text-sm text-muted">{totalShops} verified {totalShops === 1 ? "shop" : "shops"}</span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted">
          Discover verified sellers across Uganda — browse by category or search by name.
        </p>
      </div>

      {/* Category filter bar */}
      <CategoryFilterBar
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        searchActive={searchOpen}
        onSearchToggle={handleSearchToggle}
      />

      <div className="space-y-4">
        {/* Search bar */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            searchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <BrowseSearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search shops…"
            ariaLabel="Search shops"
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

        <ShopListRealtime
          initialShops={initialShops}
          shopProductCategories={shopProductCategories}
          productCategoryFilter={selectedCategory}
          searchQuery={query}
          gridClassName={browseShopGridClass}
        />
      </div>
    </div>
  );
}
