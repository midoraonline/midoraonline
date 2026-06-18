"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import type { ProductCardData } from "@/components/productcard";

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "most_viewed"
  | "best_rated"
  | "trust_score";

export type FilterState = {
  sort: SortOption;
  minPrice: number | null;
  maxPrice: number | null;
  availableNow: boolean;
  verifiedOnly: boolean;
  minRating: number | null;
  location: string | null;
};

export const DEFAULT_FILTERS: FilterState = {
  sort: "relevance",
  minPrice: null,
  maxPrice: null,
  availableNow: false,
  verifiedOnly: false,
  minRating: null,
  location: null,
};

function formatUGX(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

function parsePriceInput(v: string): number | null {
  const cleaned = v.replace(/[^0-9]/g, "");
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function formatPriceInput(n: number | null): string {
  if (n === null) return "";
  return n.toLocaleString("en-UG");
}

function collectLocations(products: ProductCardData[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const loc = p.location_name?.trim() || p.shop.location?.trim();
    if (loc) set.add(loc);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function activeFilterCount(f: FilterState): number {
  let count = 0;
  if (f.sort !== "relevance") count++;
  if (f.minPrice !== null) count++;
  if (f.maxPrice !== null) count++;
  if (f.availableNow) count++;
  if (f.verifiedOnly) count++;
  if (f.minRating !== null) count++;
  if (f.location !== null) count++;
  return count;
}

export function applyFilters(
  products: ProductCardData[],
  filters: FilterState,
): ProductCardData[] {
  let list = [...products];

  if (filters.minPrice !== null) {
    list = list.filter((p) => p.priceUGX >= filters.minPrice!);
  }
  if (filters.maxPrice !== null) {
    list = list.filter((p) => p.priceUGX <= filters.maxPrice!);
  }
  if (filters.availableNow) {
    list = list.filter((p) => p.shop.available_now !== false);
  }
  if (filters.verifiedOnly) {
    list = list.filter((p) => p.shop.verified === true);
  }
  if (filters.minRating !== null) {
    list = list.filter((p) => (p.rating ?? 0) >= filters.minRating!);
  }
  if (filters.location !== null) {
    list = list.filter(
      (p) =>
        p.location_name?.trim() === filters.location ||
        p.shop.location?.trim() === filters.location,
    );
  }

  switch (filters.sort) {
    case "price_asc":
      list.sort((a, b) => a.priceUGX - b.priceUGX);
      break;
    case "price_desc":
      list.sort((a, b) => b.priceUGX - a.priceUGX);
      break;
    case "newest":
      list.sort((a, b) => {
        const da = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const db = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return db - da;
      });
      break;
    case "most_viewed":
      list.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
      break;
    case "best_rated":
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "trust_score":
      list.sort((a, b) => (b.shop.trust_score ?? 0) - (a.shop.trust_score ?? 0));
      break;
    default:
      break;
  }

  return list;
}

type Props = {
  products: ProductCardData[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

export default function ProductFilters({ products, filters, onChange }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const locations = useMemo(() => collectLocations(products), [products]);
  const count = activeFilterCount(filters);

  const minPriceStr = formatPriceInput(filters.minPrice);
  const maxPriceStr = formatPriceInput(filters.maxPrice);

  useEffect(() => {
    if (!sortOpen) return;
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  function clearAll() {
    onChange({ ...DEFAULT_FILTERS });
  }

  const sortLabel: Record<SortOption, string> = {
    relevance: "Relevance",
    price_asc: "Price: Low to High",
    price_desc: "Price: High to Low",
    newest: "Newest First",
    most_viewed: "Most Viewed",
    best_rated: "Best Rated",
    trust_score: "Trust Score",
  };

  const hasActiveFilters = count > 0;

  return (
    <>
      {/* Desktop filter bar */}
      <div className="hidden sm:flex items-center gap-2 mb-5 flex-wrap">
        {/* Sort dropdown */}
        <div ref={sortRef} className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all dm-focus bg-surface text-muted hover:text-foreground ring-1 ring-border hover:ring-border-strong"
          >
            <MaterialSymbol name="sort" className="!text-[13px]" />
            {sortLabel[filters.sort]}
            <ChevronDown className={`size-3 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
          </button>

          {sortOpen && (
            <div className="absolute left-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
              <div className="p-1">
                {(Object.keys(sortLabel) as SortOption[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      update({ sort: key });
                      setSortOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      filters.sort === key
                        ? "bg-accent/10 text-accent"
                        : "text-foreground/80 hover:bg-surface-subtle"
                    }`}
                  >
                    {sortLabel[key]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px shrink-0 bg-border" />

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted">Price</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Min"
            value={minPriceStr}
            onChange={(e) => update({ minPrice: parsePriceInput(e.target.value) })}
            className="dm-input-xs w-20 py-1.5 px-2 text-[11px]"
          />
          <span className="text-xs text-muted">-</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Max"
            value={maxPriceStr}
            onChange={(e) => update({ maxPrice: parsePriceInput(e.target.value) })}
            className="dm-input-xs w-20 py-1.5 px-2 text-[11px]"
          />
        </div>

        {/* Availability toggle */}
        <button
          type="button"
          onClick={() => update({ availableNow: !filters.availableNow })}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all dm-focus whitespace-nowrap ${
            filters.availableNow
              ? "bg-accent text-white shadow-sm ring-1 ring-accent/50"
              : "bg-surface text-muted hover:text-foreground ring-1 ring-border hover:ring-border-strong"
          }`}
        >
          <MaterialSymbol name="check_circle" className="!text-[13px]" />
          Available now
        </button>

        {/* Verified toggle */}
        <button
          type="button"
          onClick={() => update({ verifiedOnly: !filters.verifiedOnly })}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all dm-focus whitespace-nowrap ${
            filters.verifiedOnly
              ? "bg-accent text-white shadow-sm ring-1 ring-accent/50"
              : "bg-surface text-muted hover:text-foreground ring-1 ring-border hover:ring-border-strong"
          }`}
        >
          <MaterialSymbol name="verified" className="!text-[13px]" />
          Verified shops
        </button>

        {/* Rating filter */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() =>
                update({ minRating: filters.minRating === star ? null : star })
              }
              className={`grid size-6 place-items-center rounded-full text-xs transition-all ${
                filters.minRating !== null && star <= filters.minRating
                  ? "bg-amber-400 text-white"
                  : "bg-surface-subtle text-muted hover:bg-amber-100 hover:text-amber-600"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Location filter */}
        {locations.length > 0 && (
          <select
            value={filters.location ?? ""}
            onChange={(e) =>
              update({ location: e.target.value || null })
            }
            className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-border hover:ring-border-strong transition-all dm-focus cursor-pointer"
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        )}

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/10 transition-colors dm-focus"
          >
            <X className="size-3" />
            Clear ({count})
          </button>
        )}
      </div>

      {/* Mobile filter bar */}
      <div className="sm:hidden mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-border dm-focus"
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
            {count > 0 && (
              <span className="grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/10 transition-colors dm-focus"
            >
              <X className="size-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface px-4 pb-6 pt-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Filters</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-surface-subtle text-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Sort */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">Sort by</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(sortLabel) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update({ sort: key })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        filters.sort === key
                          ? "bg-accent text-white shadow-sm"
                          : "bg-surface-subtle text-muted ring-1 ring-border"
                      }`}
                    >
                      {sortLabel[key]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">Price range (UGX)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Min"
                    value={minPriceStr}
                    onChange={(e) => update({ minPrice: parsePriceInput(e.target.value) })}
                    className="dm-input-xs flex-1 py-2 text-xs"
                  />
                  <span className="text-xs text-muted">to</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Max"
                    value={maxPriceStr}
                    onChange={(e) => update({ maxPrice: parsePriceInput(e.target.value) })}
                    className="dm-input-xs flex-1 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Availability */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">Availability</p>
                <button
                  type="button"
                  onClick={() => update({ availableNow: !filters.availableNow })}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    filters.availableNow
                      ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                      : "bg-surface-subtle text-foreground/80"
                  }`}
                >
                  <MaterialSymbol name="check_circle" className="!text-base" />
                  Available now
                  {filters.availableNow && (
                    <MaterialSymbol name="check" className="!text-base ml-auto" />
                  )}
                </button>
              </div>

              {/* Verified */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">Shop verification</p>
                <button
                  type="button"
                  onClick={() => update({ verifiedOnly: !filters.verifiedOnly })}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    filters.verifiedOnly
                      ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                      : "bg-surface-subtle text-foreground/80"
                  }`}
                >
                  <MaterialSymbol name="verified" className="!text-base" />
                  Verified shops only
                  {filters.verifiedOnly && (
                    <MaterialSymbol name="check" className="!text-base ml-auto" />
                  )}
                </button>
              </div>

              {/* Rating */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">Minimum rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        update({ minRating: filters.minRating === star ? null : star })
                      }
                      className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                        filters.minRating !== null && star <= filters.minRating
                          ? "bg-amber-400 text-white shadow-sm"
                          : "bg-surface-subtle text-muted"
                      }`}
                    >
                      {star}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              {locations.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted">Location</p>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => update({ location: null })}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        filters.location === null
                          ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                          : "bg-surface-subtle text-foreground/80 hover:bg-surface-subtle/80"
                      }`}
                    >
                      All locations
                      {filters.location === null && (
                        <MaterialSymbol name="check" className="!text-base ml-auto" />
                      )}
                    </button>
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => update({ location: loc })}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          filters.location === loc
                            ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                            : "bg-surface-subtle text-foreground/80 hover:bg-surface-subtle/80"
                        }`}
                      >
                        {loc}
                        {filters.location === loc && (
                          <MaterialSymbol name="check" className="!text-base ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setDrawerOpen(false);
                }}
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle"
              >
                Reset all
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
