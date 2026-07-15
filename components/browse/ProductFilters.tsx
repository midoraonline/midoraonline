"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
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

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Relevance",
  price_asc: "Price: Low → High",
  price_desc: "Price: High → Low",
  newest: "Newest",
  most_viewed: "Most Viewed",
  best_rated: "Best Rated",
  trust_score: "Trust Score",
};

const PRICE_PRESETS = [
  { label: "Under 50k", min: null as number | null, max: 50_000 as number | null },
  { label: "50k – 200k", min: 50_000 as number | null, max: 200_000 as number | null },
  { label: "200k – 500k", min: 200_000 as number | null, max: 500_000 as number | null },
  { label: "500k+", min: 500_000 as number | null, max: null as number | null },
] as const;

function parsePriceInput(v: string): number | null {
  const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function formatPriceInput(n: number | null): string {
  return n === null ? "" : n.toLocaleString("en-UG");
}

type LocationEntry = { name: string; count: number };

function collectLocationEntries(products: ProductCardData[]): LocationEntry[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const loc = p.location_name?.trim() || p.shop.location?.trim();
    if (loc) counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function activeFilterCount(f: FilterState): number {
  let n = 0;
  if (f.sort !== "relevance") n++;
  if (f.minPrice !== null) n++;
  if (f.maxPrice !== null) n++;
  if (f.availableNow) n++;
  if (f.verifiedOnly) n++;
  if (f.minRating !== null) n++;
  if (f.location !== null) n++;
  return n;
}

export function applyFilters(
  products: ProductCardData[],
  filters: FilterState,
): ProductCardData[] {
  let list = [...products];

  if (filters.minPrice !== null) list = list.filter((p) => p.priceUGX >= filters.minPrice!);
  if (filters.maxPrice !== null) list = list.filter((p) => p.priceUGX <= filters.maxPrice!);
  if (filters.availableNow) list = list.filter((p) => p.shop.available_now !== false);
  if (filters.verifiedOnly) list = list.filter((p) => p.shop.verified === true);
  if (filters.minRating !== null) list = list.filter((p) => (p.rating ?? 0) >= filters.minRating!);
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
  }

  return list;
}

// --- Sub-components ---

function useClickOutside(ref: RefObject<HTMLElement | null>, onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onClose, enabled]);
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all dm-focus whitespace-nowrap ${
        active
          ? "bg-accent text-white shadow-sm ring-1 ring-accent/40"
          : "bg-surface text-muted hover:text-foreground ring-1 ring-border hover:ring-border-strong"
      }`}
    >
      {children}
    </button>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      <Pill active={value !== "relevance"} onClick={() => setOpen((v) => !v)}>
        <MaterialSymbol name="sort" className="!text-[13px]" />
        {SORT_LABELS[value]}
        <ChevronDown className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </Pill>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
          <div className="p-1">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => { onChange(key); setOpen(false); }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  value === key
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/80 hover:bg-surface-subtle"
                }`}
              >
                {value === key && <MaterialSymbol name="check" className="!text-[13px] shrink-0" />}
                <span className={value === key ? "" : "ml-[17px]"}>{SORT_LABELS[key]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceDropdown({
  minPrice,
  maxPrice,
  onChange,
}: {
  minPrice: number | null;
  maxPrice: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const isActive = minPrice !== null || maxPrice !== null;
  const activePreset = PRICE_PRESETS.find((p) => p.min === minPrice && p.max === maxPrice) ?? null;

  const priceLabel = !isActive
    ? "Price"
    : activePreset
      ? activePreset.label
      : minPrice !== null && maxPrice !== null
        ? `${(minPrice / 1000).toFixed(0)}k–${(maxPrice / 1000).toFixed(0)}k`
        : minPrice !== null
          ? `${(minPrice / 1000).toFixed(0)}k+`
          : `Under ${(maxPrice! / 1000).toFixed(0)}k`;

  return (
    <div ref={ref} className="relative">
      <Pill active={isActive} onClick={() => setOpen((v) => !v)}>
        <MaterialSymbol name="payments" className="!text-[13px]" />
        {priceLabel}
        <ChevronDown className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </Pill>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-58 rounded-xl border border-border bg-background p-3 shadow-xl" style={{ width: 232 }}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Quick ranges</p>
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {PRICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => { onChange(preset.min, preset.max); setOpen(false); }}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  activePreset?.label === preset.label
                    ? "bg-accent text-white"
                    : "bg-surface-subtle text-foreground/80 ring-1 ring-border hover:bg-surface"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="border-t border-border pt-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Custom (UGX)</p>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Min"
                value={formatPriceInput(minPrice)}
                onChange={(e) => onChange(parsePriceInput(e.target.value), maxPrice)}
                className="dm-input-xs w-full py-1.5 px-2 text-[11px]"
              />
              <span className="shrink-0 text-xs text-muted">–</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Max"
                value={formatPriceInput(maxPrice)}
                onChange={(e) => onChange(minPrice, parsePriceInput(e.target.value))}
                className="dm-input-xs w-full py-1.5 px-2 text-[11px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LocationDropdown({
  locations,
  value,
  onChange,
}: {
  locations: LocationEntry[];
  value: string | null;
  onChange: (loc: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    } else {
      setSearch("");
    }
  }, [open]);

  const total = useMemo(() => locations.reduce((s, l) => s + l.count, 0), [locations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? locations.filter((l) => l.name.toLowerCase().includes(q)) : locations;
  }, [locations, search]);

  const label = value ?? "Location";

  return (
    <div ref={ref} className="relative">
      <Pill active={value !== null} onClick={() => setOpen((v) => !v)}>
        <MapPin className="size-3 shrink-0" />
        <span className="max-w-[96px] truncate">{label}</span>
        <ChevronDown className={`size-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </Pill>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-background shadow-xl">
          {locations.length > 5 && (
            <div className="border-b border-border p-2">
              <div className="flex items-center gap-2 rounded-lg bg-surface-subtle px-2.5 py-1.5">
                <Search className="size-3 shrink-0 text-muted" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search locations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                value === null
                  ? "bg-accent/10 text-accent"
                  : "text-foreground/80 hover:bg-surface-subtle"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <MaterialSymbol name="location_on" className="!text-[13px]" />
                All locations
              </span>
              <span className={`text-[10px] tabular-nums ${value === null ? "text-accent/70" : "text-muted"}`}>{total}</span>
            </button>

            {filtered.map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => { onChange(loc.name); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  value === loc.name
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/80 hover:bg-surface-subtle"
                }`}
              >
                <span className="truncate">{loc.name}</span>
                <span className={`shrink-0 text-[10px] tabular-nums ${value === loc.name ? "text-accent/70" : "text-muted"}`}>
                  {loc.count}
                </span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-5 text-center text-[11px] text-muted">No locations found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main component ---

type Props = {
  products: ProductCardData[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

export default function ProductFilters({ products, filters, onChange }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const locations = useMemo(() => collectLocationEntries(products), [products]);
  const count = activeFilterCount(filters);
  const hasActiveFilters = count > 0;

  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  function clearAll() {
    onChange({ ...DEFAULT_FILTERS });
  }

  const activePreset =
    PRICE_PRESETS.find((p) => p.min === filters.minPrice && p.max === filters.maxPrice) ?? null;

  return (
    <>
      {/* ── Desktop filter bar ── */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap">
        <SortDropdown value={filters.sort} onChange={(v) => update({ sort: v })} />

        <div className="h-5 w-px shrink-0 bg-border" />

        <PriceDropdown
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={(min, max) => update({ minPrice: min, maxPrice: max })}
        />

        <Pill active={filters.availableNow} onClick={() => update({ availableNow: !filters.availableNow })}>
          <MaterialSymbol name="check_circle" className="!text-[13px]" />
          Available
        </Pill>

        <Pill active={filters.verifiedOnly} onClick={() => update({ verifiedOnly: !filters.verifiedOnly })}>
          <MaterialSymbol name="verified" className="!text-[13px]" />
          Verified
        </Pill>

        {/* Star rating */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              title={`${star}+ stars`}
              onClick={() => update({ minRating: filters.minRating === star ? null : star })}
              className={`grid size-6 place-items-center rounded-full text-[11px] transition-all dm-focus ${
                filters.minRating !== null && star <= filters.minRating
                  ? "bg-amber-400 text-white shadow-sm"
                  : "bg-surface-subtle text-muted hover:bg-amber-50 hover:text-amber-500"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        {locations.length > 0 && (
          <LocationDropdown
            locations={locations}
            value={filters.location}
            onChange={(loc) => update({ location: loc })}
          />
        )}

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

      {/* ── Mobile trigger ── */}
      <div className="sm:hidden flex items-center gap-2">
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

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-modal sm:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-surface shadow-2xl">
            {/* Drawer header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 pb-3 pt-4">
              <p className="text-sm font-semibold">Filters</p>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-semibold text-accent hover:text-accent-hover"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="grid size-8 place-items-center rounded-full bg-surface-subtle text-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              {/* Sort */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Sort by</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
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
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Price range (UGX)</p>
                <div className="mb-3 grid grid-cols-2 gap-1.5">
                  {PRICE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => update({ minPrice: preset.min, maxPrice: preset.max })}
                      className={`rounded-xl py-2 text-xs font-medium transition-colors ${
                        activePreset?.label === preset.label
                          ? "bg-accent text-white shadow-sm"
                          : "bg-surface-subtle text-muted ring-1 ring-border"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="mb-1.5 text-[10px] font-semibold text-muted">Custom</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Min"
                    value={formatPriceInput(filters.minPrice)}
                    onChange={(e) => update({ minPrice: parsePriceInput(e.target.value) })}
                    className="dm-input-xs flex-1 py-2 text-xs"
                  />
                  <span className="text-xs text-muted">to</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Max"
                    value={formatPriceInput(filters.maxPrice)}
                    onChange={(e) => update({ maxPrice: parsePriceInput(e.target.value) })}
                    className="dm-input-xs flex-1 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Options */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Options</p>
                <div className="space-y-2">
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
                    {filters.availableNow && <MaterialSymbol name="check" className="!text-base ml-auto" />}
                  </button>

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
                    {filters.verifiedOnly && <MaterialSymbol name="check" className="!text-base ml-auto" />}
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Minimum rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => update({ minRating: filters.minRating === star ? null : star })}
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
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Location</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => update({ location: null })}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        filters.location === null
                          ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                          : "bg-surface-subtle text-foreground/80"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MaterialSymbol name="location_on" className="!text-base" />
                        All locations
                      </span>
                      {filters.location === null && <MaterialSymbol name="check" className="!text-base" />}
                    </button>

                    {locations.map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => update({ location: loc.name })}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          filters.location === loc.name
                            ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                            : "bg-surface-subtle text-foreground/80"
                        }`}
                      >
                        <span className="truncate">{loc.name}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className={`text-xs tabular-nums ${filters.location === loc.name ? "text-accent/70" : "text-muted"}`}>
                            {loc.count}
                          </span>
                          {filters.location === loc.name && (
                            <MaterialSymbol name="check" className="!text-base" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="flex shrink-0 gap-2 border-t border-border px-4 pb-6 pt-3">
              <button
                type="button"
                onClick={() => { clearAll(); setDrawerOpen(false); }}
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
