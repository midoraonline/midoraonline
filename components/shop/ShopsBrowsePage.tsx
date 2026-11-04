"use client";

import { useState } from "react";
import { PiPackageFill, PiSquaresFourFill, PiWrenchFill } from "react-icons/pi";

import CategoryBrowseSection from "@/components/browse/CategoryBrowseSection";
import ProductSearchBar from "@/components/browse/ProductSearchBar";
import ShopListRealtime from "@/components/shop/ShopListRealtime";
import { DEFAULT_SHOP_FILTERS, type ShopFilterState } from "@/components/shop/ShopFilters";
import {
  browseShopGridClass,
  categoryFilterDisplayLabel,
  EMPTY_CATEGORY_FILTER,
  isCategoryFilterActive,
  type CategoryFilterSelection,
} from "@/lib/browseCategories";
import type { Shop, ShopType } from "@/lib/api/shops";

const TYPE_TABS = [
  { label: "All", type: null, icon: PiSquaresFourFill },
  { label: "Products", type: "product" as const, icon: PiPackageFill },
  { label: "Services", type: "service" as const, icon: PiWrenchFill },
];

function ShopTypeTabs({
  selected,
  allActive,
  onSelect,
}: {
  selected: ShopType | null;
  allActive: boolean;
  onSelect: (type: ShopType | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none" role="group" aria-label="Shop types">
      {TYPE_TABS.map(({ label, type, icon: Icon }) => {
        const active = type === null ? allActive : selected === type;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(type)}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold transition-all active:scale-95 sm:text-sm ${
              active
                ? "bg-accent text-white shadow-md shadow-accent/30"
                : "bg-surface text-foreground shadow-sm ring-1 ring-foreground/15 hover:ring-accent/40"
            }`}
          >
            <Icon className={`size-[18px] ${active ? "" : "text-accent"}`} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function ShopsBrowsePage({
  initialShops,
  initialHasMore = false,
  initialTotal = null,
  shopProductCategories,
}: {
  initialShops: Shop[];
  initialHasMore?: boolean;
  initialTotal?: number | null;
  shopProductCategories: Record<string, string[]>;
}) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterSelection>(EMPTY_CATEGORY_FILTER);
  const [filters, setFilters] = useState<ShopFilterState>(DEFAULT_SHOP_FILTERS);

  const categoryFilterActive = isCategoryFilterActive(categoryFilter);
  const categoryFilterLabel = categoryFilterDisplayLabel(categoryFilter);
  const q = query.trim();

  const totalShops =
    initialTotal != null && initialTotal > 0
      ? initialTotal
      : initialShops.filter((s) => (s as { is_active?: boolean }).is_active !== false).length;

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-5">
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

      <div className="mb-1.5 space-y-2 sm:mb-2">
        <ProductSearchBar
          value={draft}
          onChange={(value) => {
            setDraft(value);
            if (!value.trim()) setQuery("");
          }}
          onSubmit={setQuery}
          placeholder="Search shops by name, category or place…"
          ariaLabel="Search shops"
          showSuggestions={false}
        />
        <ShopTypeTabs
          selected={filters.type}
          allActive={filters.type === null && !categoryFilterActive}
          onSelect={(type) => {
            setCategoryFilter(EMPTY_CATEGORY_FILTER);
            setFilters((current) => ({ ...current, type }));
          }}
        />
        <CategoryBrowseSection
          selection={categoryFilter}
          onSelectionChange={(selection) => {
            setCategoryFilter(selection);
            setFilters((current) => ({ ...current, type: null }));
          }}
          showHeader={false}
          showListingShortcuts={false}
          showAllChip={false}
        />
      </div>

      <div className="space-y-2">
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
                  onClick={() => {
                    setDraft("");
                    setQuery("");
                  }}
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
          initialHasMore={initialHasMore}
          initialTotal={initialTotal}
          shopProductCategories={shopProductCategories}
          categoryFilter={categoryFilter}
          searchQuery={query}
          gridClassName={browseShopGridClass}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </div>
  );
}
