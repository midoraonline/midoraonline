"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

import CategoryBrowseSection from "@/components/browse/CategoryBrowseSection";
import ShopListRealtime from "@/components/shop/ShopListRealtime";
import {
  browseShopGridClass,
  categoryFilterDisplayLabel,
  EMPTY_CATEGORY_FILTER,
  isCategoryFilterActive,
  type CategoryFilterSelection,
} from "@/lib/browseCategories";
import type { Shop } from "@/lib/api/shops";

export default function ShopsBrowsePage({
  initialShops,
  shopProductCategories,
}: {
  initialShops: Shop[];
  shopProductCategories: Record<string, string[]>;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterSelection>(EMPTY_CATEGORY_FILTER);

  const categoryFilterActive = isCategoryFilterActive(categoryFilter);
  const categoryFilterLabel = categoryFilterDisplayLabel(categoryFilter);
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

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shops by name…"
            className="dm-input dm-focus w-full rounded-xl border-border bg-surface py-2.5 pl-10 pr-10 text-sm placeholder:text-muted/60"
          />
          {q.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category filter bar */}
      <CategoryBrowseSection
        selection={categoryFilter}
        onSelectionChange={setCategoryFilter}
        showHeader={false}
      />

      <div className="space-y-4">
        {(q.length > 0 || categoryFilterActive) && (
          <p className="text-sm text-muted">
            {q.length > 0 ? (
              <>
                Results for <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
                {categoryFilterActive ? (
                  <span>
                    {" "}
                    in <span className="font-semibold text-foreground">{categoryFilterLabel}</span>
                  </span>
                ) : null}
                {" · "}
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
                <span className="font-semibold text-foreground">{categoryFilterLabel}</span>
                {" · "}
                <button
                  type="button"
                  onClick={() => setCategoryFilter(EMPTY_CATEGORY_FILTER)}
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
          categoryFilter={categoryFilter}
          searchQuery={query}
          gridClassName={browseShopGridClass}
        />
      </div>
    </div>
  );
}
