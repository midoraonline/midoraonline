"use client";

import {
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
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
  price_asc: "Price ↑",
  price_desc: "Price ↓",
  newest: "Newest",
  most_viewed: "Popular",
  best_rated: "Top rated",
  trust_score: "Trust",
};

const PRICE_PRESETS = [
  { label: "Deals", min: null as number | null, max: 100_000 as number | null },
  { label: "Under 50k", min: null as number | null, max: 50_000 as number | null },
  { label: "50–200k", min: 50_000 as number | null, max: 200_000 as number | null },
  { label: "200–500k", min: 200_000 as number | null, max: 500_000 as number | null },
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
  if (f.minPrice !== null || f.maxPrice !== null) n++;
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

function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onClose, enabled]);
}

function Chip({
  active,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={Boolean(active)}
      className={`inline-flex h-7 shrink-0 snap-start items-center gap-1 rounded-md px-2 text-[11px] transition-colors sm:h-8 sm:gap-1.5 sm:px-2.5 sm:text-xs ${
        active
          ? "bg-accent text-white shadow-sm shadow-accent/25"
          : "bg-accent/[0.06] text-foreground/70 ring-1 ring-accent/10 hover:bg-accent/10 hover:text-accent hover:ring-accent/20"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function MenuPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute left-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-border bg-background shadow-lg ${className}`}
    >
      {children}
    </div>
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
  const active = value !== "relevance";

  return (
    <div ref={ref} className="relative">
      <Chip active={active} onClick={() => setOpen((v) => !v)}>
        <span className={active ? "font-semibold" : "font-medium"}>
          {SORT_LABELS[value]}
        </span>
        <ChevronDown
          className={`size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </Chip>

      {open && (
        <MenuPanel className="w-44 p-1">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                value === key
                  ? "bg-accent/10 font-semibold text-accent"
                  : "font-medium text-foreground/80 hover:bg-surface-subtle"
              }`}
            >
              {value === key ? (
                <Check className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
              ) : (
                <span className="size-3 shrink-0" aria-hidden />
              )}
              {SORT_LABELS[key]}
            </button>
          ))}
        </MenuPanel>
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
  const activePreset =
    PRICE_PRESETS.find((p) => p.min === minPrice && p.max === maxPrice) ?? null;

  const priceLabel = !isActive
    ? "Price"
    : activePreset
      ? activePreset.label
      : minPrice !== null && maxPrice !== null
        ? `${(minPrice / 1000).toFixed(0)}–${(maxPrice / 1000).toFixed(0)}k`
        : minPrice !== null
          ? `${(minPrice / 1000).toFixed(0)}k+`
          : `≤${(maxPrice! / 1000).toFixed(0)}k`;

  return (
    <div ref={ref} className="relative">
      <Chip active={isActive} onClick={() => setOpen((v) => !v)}>
        <span className={isActive ? "font-semibold" : "font-medium"}>{priceLabel}</span>
        <ChevronDown
          className={`size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </Chip>

      {open && (
        <MenuPanel className="w-[13.5rem] p-2.5">
          <div className="mb-2 grid grid-cols-2 gap-1">
            {PRICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.min, preset.max);
                  setOpen(false);
                }}
                className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  activePreset?.label === preset.label
                    ? "bg-accent text-white shadow-sm shadow-accent/20"
                    : "bg-accent/[0.06] text-foreground/80 ring-1 ring-accent/10 hover:bg-accent/10 hover:text-accent"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="border-t border-border/70 pt-2">
            <p className="mb-1 text-[10px] font-medium text-muted">Custom (UGX)</p>
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Min"
                value={formatPriceInput(minPrice)}
                onChange={(e) => onChange(parsePriceInput(e.target.value), maxPrice)}
                className="dm-input-xs w-full px-2 py-1.5 text-[11px]"
              />
              <span className="shrink-0 text-[10px] text-muted">–</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Max"
                value={formatPriceInput(maxPrice)}
                onChange={(e) => onChange(minPrice, parsePriceInput(e.target.value))}
                className="dm-input-xs w-full px-2 py-1.5 text-[11px]"
              />
            </div>
          </div>
        </MenuPanel>
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
    }
    setSearch("");
  }, [open]);

  const total = useMemo(() => locations.reduce((s, l) => s + l.count, 0), [locations]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? locations.filter((l) => l.name.toLowerCase().includes(q)) : locations;
  }, [locations, search]);

  return (
    <div ref={ref} className="relative">
      <Chip active={value !== null} onClick={() => setOpen((v) => !v)}>
        <MapPin className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className={`max-w-[5.5rem] truncate ${value ? "font-semibold" : "font-medium"}`}>
          {value ?? "Location"}
        </span>
        <ChevronDown
          className={`size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </Chip>

      {open && (
        <MenuPanel className="w-60">
          {locations.length > 5 && (
            <div className="border-b border-border p-2">
              <div className="flex items-center gap-1.5 rounded-md bg-surface-subtle px-2 py-1.5">
                <Search className="size-3 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted focus:outline-none"
                />
              </div>
            </div>
          )}
          <div className="max-h-52 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                value === null
                  ? "bg-accent/10 text-accent"
                  : "text-foreground/80 hover:bg-surface-subtle"
              }`}
            >
              <span>All locations</span>
              <span className="text-[10px] tabular-nums text-muted">{total}</span>
            </button>
            {filtered.map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => {
                  onChange(loc.name);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                  value === loc.name
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/80 hover:bg-surface-subtle"
                }`}
              >
                <span className="truncate">{loc.name}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted">{loc.count}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-2.5 py-4 text-center text-[11px] text-muted">No locations found</p>
            )}
          </div>
        </MenuPanel>
      )}
    </div>
  );
}

function AppliedChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-[10rem] items-center gap-0.5 truncate rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent ring-1 ring-accent/15 sm:max-w-none">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="shrink-0 rounded p-0.5 hover:bg-accent/15"
      >
        <X className="size-2.5" strokeWidth={2.5} aria-hidden />
      </button>
    </span>
  );
}

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
    PRICE_PRESETS.find(
      (p) => p.min === filters.minPrice && p.max === filters.maxPrice,
    ) ?? null;

  const appliedChips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.sort !== "relevance") {
    appliedChips.push({
      key: "sort",
      label: SORT_LABELS[filters.sort],
      clear: () => update({ sort: "relevance" }),
    });
  }
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    appliedChips.push({
      key: "price",
      label: activePreset?.label
        ?? (filters.minPrice != null && filters.maxPrice != null
          ? `${(filters.minPrice / 1000).toFixed(0)}–${(filters.maxPrice / 1000).toFixed(0)}k`
          : filters.minPrice != null
            ? `${(filters.minPrice / 1000).toFixed(0)}k+`
            : `≤${(filters.maxPrice! / 1000).toFixed(0)}k`),
      clear: () => update({ minPrice: null, maxPrice: null }),
    });
  }
  if (filters.availableNow) {
    appliedChips.push({
      key: "available",
      label: "Available",
      clear: () => update({ availableNow: false }),
    });
  }
  if (filters.verifiedOnly) {
    appliedChips.push({
      key: "verified",
      label: "Verified",
      clear: () => update({ verifiedOnly: false }),
    });
  }
  if (filters.minRating !== null) {
    appliedChips.push({
      key: "rating",
      label: `${filters.minRating}+ ★`,
      clear: () => update({ minRating: null }),
    });
  }
  if (filters.location) {
    appliedChips.push({
      key: "location",
      label: filters.location,
      clear: () => update({ location: null }),
    });
  }

  const drawerExtrasActive =
    filters.minRating !== null ||
    (filters.location !== null && locations.length > 0);

  return (
    <div className="space-y-1.5">
      {/* Primary filter strip — same language as category chips */}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-3 bg-gradient-to-r from-background to-transparent sm:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-gradient-to-l from-background to-transparent sm:hidden"
          aria-hidden
        />
        <div className="flex gap-1 overflow-x-auto py-0.5 scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
          <SortDropdown value={filters.sort} onChange={(v) => update({ sort: v })} />

          <PriceDropdown
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onChange={(min, max) => update({ minPrice: min, maxPrice: max })}
          />

          <Chip
            active={filters.availableNow}
            onClick={() => update({ availableNow: !filters.availableNow })}
          >
            <span className={filters.availableNow ? "font-semibold" : "font-medium"}>
              Available
            </span>
          </Chip>

          <Chip
            active={filters.verifiedOnly}
            onClick={() => update({ verifiedOnly: !filters.verifiedOnly })}
          >
            <span className={filters.verifiedOnly ? "font-semibold" : "font-medium"}>
              Verified
            </span>
          </Chip>

          {locations.length > 0 && (
            <div className="hidden sm:block">
              <LocationDropdown
                locations={locations}
                value={filters.location}
                onChange={(loc) => update({ location: loc })}
              />
            </div>
          )}

          {/* Rating + location live in “More” on mobile; rating always in More on desktop to save space */}
          <Chip
            active={drawerExtrasActive}
            onClick={() => setDrawerOpen(true)}
            className="sm:hidden"
          >
            <SlidersHorizontal className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className={drawerExtrasActive ? "font-semibold" : "font-medium"}>More</span>
            {drawerExtrasActive ? (
              <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />
            ) : null}
          </Chip>

          <Chip
            active={filters.minRating !== null}
            onClick={() => setDrawerOpen(true)}
            className="hidden sm:inline-flex"
          >
            <Star className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className={filters.minRating !== null ? "font-semibold" : "font-medium"}>
              {filters.minRating !== null ? `${filters.minRating}+` : "Rating"}
            </span>
          </Chip>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-7 shrink-0 items-center px-1.5 text-[11px] font-medium text-accent transition-colors hover:text-accent-hover sm:h-8 sm:text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Applied filters overview (Baymard) */}
      {appliedChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {appliedChips.map((chip) => (
            <AppliedChip key={chip.key} label={chip.label} onRemove={chip.clear} />
          ))}
        </div>
      )}

      {/* Sheet for rating (all) + location (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[80vh] flex-col rounded-t-2xl bg-surface shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(80vh,28rem)] sm:w-[22rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">More filters</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-subtle hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Minimum rating
                </p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const on = filters.minRating !== null && star <= filters.minRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          update({ minRating: filters.minRating === star ? null : star })
                        }
                        className={`flex h-9 flex-1 items-center justify-center gap-0.5 rounded-md text-xs font-medium transition-colors ${
                          on
                            ? "bg-accent text-white shadow-sm shadow-accent/20"
                            : "bg-accent/[0.06] text-muted ring-1 ring-accent/10 hover:bg-accent/10 hover:text-accent"
                        }`}
                      >
                        {star}
                        <Star
                          className="size-3"
                          strokeWidth={2}
                          fill={on ? "currentColor" : "none"}
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {locations.length > 0 && (
                <div className="sm:hidden">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Location
                  </p>
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => update({ location: null })}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium ${
                        filters.location === null
                          ? "bg-accent/10 text-accent"
                          : "bg-surface-subtle text-foreground/80"
                      }`}
                    >
                      All locations
                      {filters.location === null && (
                        <Check className="size-4" strokeWidth={2.5} aria-hidden />
                      )}
                    </button>
                    {locations.map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => update({ location: loc.name })}
                        className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${
                          filters.location === loc.name
                            ? "bg-accent/10 text-accent"
                            : "bg-surface-subtle text-foreground/80"
                        }`}
                      >
                        <span className="truncate">{loc.name}</span>
                        <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-muted">
                          {loc.count}
                          {filters.location === loc.name && (
                            <Check className="size-4 text-accent" strokeWidth={2.5} aria-hidden />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 gap-2 border-t border-border px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                onClick={() => {
                  update({ minRating: null, location: null });
                }}
                className="flex-1 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-md bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
