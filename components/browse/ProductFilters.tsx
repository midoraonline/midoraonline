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
  ChevronDown,
  Loader2,
  MapPin,
  Navigation,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import type { ProductCardData } from "@/components/productcard";
import {
  GeoLocationError,
  getBrowserLocation,
  labelFromReverse,
  reverseGeocode,
  type UserGeo,
} from "@/lib/geo";
import { ThemedSelect } from "@/components/browse/ThemedSelect";
import type {
  GroupBase,
  OptionProps,
  SingleValueProps,
} from "react-select";
import { components as RSComponents } from "react-select";

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
  /** Exact place-name match (mutually exclusive with nearMe). */
  location: string | null;
  /** Sort listings by GPS proximity when userGeo is set. */
  nearMe: boolean;
  userGeo: UserGeo | null;
};

export const DEFAULT_FILTERS: FilterState = {
  sort: "relevance",
  minPrice: null,
  maxPrice: null,
  availableNow: false,
  verifiedOnly: false,
  minRating: null,
  location: null,
  nearMe: false,
  userGeo: null,
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
  if (f.location !== null || f.nearMe) n++;
  return n;
}

export function applyFilters(
  products: ProductCardData[],
  filters: FilterState,
  opts?: { distances?: Map<string, number> | null },
): ProductCardData[] {
  let list = [...products];

  if (filters.minPrice !== null) list = list.filter((p) => p.priceUGX >= filters.minPrice!);
  if (filters.maxPrice !== null) list = list.filter((p) => p.priceUGX <= filters.maxPrice!);
  if (filters.availableNow) list = list.filter((p) => p.shop.available_now !== false);
  if (filters.verifiedOnly) list = list.filter((p) => p.shop.verified === true);
  if (filters.minRating !== null) list = list.filter((p) => (p.rating ?? 0) >= filters.minRating!);
  if (filters.location !== null && !filters.nearMe) {
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
    case "relevance":
    default:
      if (filters.nearMe && opts?.distances && opts.distances.size > 0) {
        list.sort((a, b) => {
          const da = opts.distances!.get(a.id) ?? Number.POSITIVE_INFINITY;
          const db = opts.distances!.get(b.id) ?? Number.POSITIVE_INFINITY;
          if (da !== db) return da - db;
          return 0;
        });
      }
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
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "bg-background text-foreground/70 ring-1 ring-border hover:bg-surface-subtle hover:text-foreground"
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
  const active = value !== "relevance";
  const options = useMemo(
    () =>
      (Object.keys(SORT_LABELS) as SortOption[]).map((key) => ({
        value: key,
        label: SORT_LABELS[key],
      })),
    [],
  );
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <ThemedSelect<{ value: SortOption; label: string }>
      instanceId="filter-sort"
      aria-label="Sort products"
      active={active}
      minControlWidth="min-w-[6.25rem] sm:min-w-[7rem]"
      value={selected}
      options={options}
      onChange={(opt) => opt && onChange(opt.value)}
    />
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

type LocationOptionValue = "__all__" | "__near_me__" | string;

type LocationOption = {
  value: LocationOptionValue;
  label: string;
  count?: number;
  kind: "all" | "near_me" | "location";
  loading?: boolean;
};

function LocationOptionRow(
  props: OptionProps<LocationOption, false, GroupBase<LocationOption>>,
) {
  const { data } = props;
  return (
    <RSComponents.Option {...props}>
      <span className="inline-flex min-w-0 items-center gap-1.5">
        {data.kind === "near_me" ? (
          data.loading ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Navigation className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          )
        ) : data.kind === "all" ? (
          <MapPin className="size-3.5 shrink-0 opacity-60" strokeWidth={1.75} aria-hidden />
        ) : null}
        <span className="truncate">{data.label}</span>
      </span>
      {typeof data.count === "number" ? (
        <span className="shrink-0 text-[10px] tabular-nums text-muted">
          {data.count}
        </span>
      ) : null}
    </RSComponents.Option>
  );
}

function LocationSingleValue(
  props: SingleValueProps<LocationOption, false, GroupBase<LocationOption>>,
) {
  const { data } = props;
  return (
    <RSComponents.SingleValue {...props}>
      <span className="inline-flex min-w-0 items-center gap-1">
        {data.kind === "near_me" ? (
          <Navigation className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
        ) : (
          <MapPin className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
        )}
        <span className="max-w-[7.5rem] truncate">{data.label}</span>
      </span>
    </RSComponents.SingleValue>
  );
}

function LocationDropdown({
  locations,
  nearMe,
  userGeo,
  value,
  onChangeLocation,
  onSelectNearMe,
}: {
  locations: LocationEntry[];
  nearMe: boolean;
  userGeo: UserGeo | null;
  value: string | null;
  onChangeLocation: (loc: string | null) => void;
  onSelectNearMe: () => Promise<void>;
}) {
  const [locating, setLocating] = useState(false);
  const [nearMeError, setNearMeError] = useState<string | null>(null);
  const totalCount = useMemo(
    () => locations.reduce((s, l) => s + l.count, 0),
    [locations],
  );

  const nearMeLabel = userGeo?.label ? `Near · ${userGeo.label}` : "Near me";

  const options: LocationOption[] = useMemo(() => {
    const base: LocationOption[] = [
      { value: "__all__", label: "All locations", kind: "all", count: totalCount },
      { value: "__near_me__", label: nearMeLabel, kind: "near_me", loading: locating },
      ...locations.map<LocationOption>((l) => ({
        value: l.name,
        label: l.name,
        count: l.count,
        kind: "location",
      })),
    ];
    return base;
  }, [locations, totalCount, nearMeLabel, locating]);

  const selected: LocationOption =
    nearMe
      ? { value: "__near_me__", label: nearMeLabel, kind: "near_me" }
      : value !== null
        ? { value, label: value, kind: "location" }
        : { value: "__all__", label: "Location", kind: "all" };

  const active = nearMe || value !== null;

  async function handleChange(opt: LocationOption | null) {
    if (!opt) return;
    if (opt.value === "__all__") {
      onChangeLocation(null);
      return;
    }
    if (opt.value === "__near_me__") {
      setLocating(true);
      setNearMeError(null);
      try {
        await onSelectNearMe();
      } catch (err) {
        setNearMeError(
          err instanceof GeoLocationError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Couldn’t use your location.",
        );
      } finally {
        setLocating(false);
      }
      return;
    }
    onChangeLocation(opt.value);
  }

  return (
    <div className="relative">
      <ThemedSelect<LocationOption>
        instanceId="filter-location"
        aria-label="Filter by location"
        active={active}
        isSearchable
        minControlWidth="min-w-[7rem] sm:min-w-[8.5rem]"
        placeholder="Location"
        value={selected}
        options={options}
        onChange={(opt) => void handleChange(opt)}
        isOptionDisabled={(opt) => opt.kind === "near_me" && locating}
        components={{
          Option: LocationOptionRow,
          SingleValue: LocationSingleValue,
        }}
        noOptionsMessage={() => "No locations found"}
      />
      {nearMeError ? (
        <p className="absolute left-0 top-full z-10 mt-1 max-w-[14rem] truncate text-[10px] font-medium text-rose-600">
          {nearMeError}
        </p>
      ) : null}
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
  const [drawerLocating, setDrawerLocating] = useState(false);
  const [drawerNearMeError, setDrawerNearMeError] = useState<string | null>(null);

  const locations = useMemo(() => collectLocationEntries(products), [products]);
  const count = activeFilterCount(filters);
  const hasActiveFilters = count > 0;

  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  function clearAll() {
    onChange({ ...DEFAULT_FILTERS });
  }

  function clearLocationFilter() {
    update({ location: null, nearMe: false, userGeo: null });
  }

  function selectNamedLocation(loc: string | null) {
    if (loc === null) {
      clearLocationFilter();
      return;
    }
    update({ location: loc, nearMe: false, userGeo: null });
  }

  async function activateNearMe() {
    const coords = await getBrowserLocation();
    let label = "Near me";
    try {
      const rev = await reverseGeocode(coords);
      label = labelFromReverse(rev, "Near me");
    } catch {
      /* GPS alone is enough to rank */
    }
    onChange({
      ...filters,
      location: null,
      nearMe: true,
      userGeo: { lat: coords.lat, lng: coords.lng, label },
      sort: "relevance",
    });
  }

  async function activateNearMeFromDrawer() {
    setDrawerLocating(true);
    setDrawerNearMeError(null);
    try {
      await activateNearMe();
    } catch (err) {
      setDrawerNearMeError(
        err instanceof GeoLocationError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Couldn’t use your location.",
      );
    } finally {
      setDrawerLocating(false);
    }
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
  if (filters.nearMe) {
    appliedChips.push({
      key: "nearMe",
      label: filters.userGeo?.label
        ? `Near me · ${filters.userGeo.label}`
        : "Near me",
      clear: clearLocationFilter,
    });
  } else if (filters.location) {
    appliedChips.push({
      key: "location",
      label: filters.location,
      clear: clearLocationFilter,
    });
  }

  // Always show location control so Near me works even before listings load places.
  const showLocationControl = true;

  return (
    <div className="space-y-1.5 rounded-xl border border-border bg-surface-subtle/70 p-2 sm:p-2.5">
      <div className="mb-0.5 flex items-center gap-1.5 px-0.5">
        <SlidersHorizontal className="size-3 text-muted" strokeWidth={2} aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted sm:text-xs sm:normal-case sm:tracking-tight">
          Filters
        </p>
        {hasActiveFilters ? (
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
            {activeFilterCount(filters)}
          </span>
        ) : null}
      </div>
      {/* Primary filter strip — neutral chips (distinct from category browse) */}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-3 bg-gradient-to-r from-surface-subtle to-transparent sm:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-gradient-to-l from-surface-subtle to-transparent sm:hidden"
          aria-hidden
        />
        <div className="flex gap-1 overflow-x-auto py-0.5 scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
          {/* Mobile: single "Sort & filter" entry — inline dropdowns get
              clipped by the horizontal scroll strip's overflow. Desktop
              keeps the individual dropdown chips. */}
          <Chip
            active={hasActiveFilters}
            onClick={() => setDrawerOpen(true)}
            className="sm:hidden"
          >
            <SlidersHorizontal className="size-3 shrink-0" strokeWidth={2} aria-hidden />
            <span className={hasActiveFilters ? "font-semibold" : "font-medium"}>
              Sort &amp; filter
            </span>
            {hasActiveFilters ? (
              <span className="ml-0.5 rounded-full bg-white/25 px-1 text-[10px] font-semibold tabular-nums">
                {count}
              </span>
            ) : null}
          </Chip>

          <div className="hidden sm:contents">
            <SortDropdown value={filters.sort} onChange={(v) => update({ sort: v })} />

            <PriceDropdown
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              onChange={(min, max) => update({ minPrice: min, maxPrice: max })}
            />
          </div>

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

          <div className="hidden sm:contents">
            {showLocationControl && (
              <LocationDropdown
                locations={locations}
                nearMe={filters.nearMe}
                userGeo={filters.userGeo}
                value={filters.location}
                onChangeLocation={selectNamedLocation}
                onSelectNearMe={activateNearMe}
              />
            )}

            {/* Rating opens the drawer on desktop too */}
            <Chip
              active={filters.minRating !== null}
              onClick={() => setDrawerOpen(true)}
            >
              <Star className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className={filters.minRating !== null ? "font-semibold" : "font-medium"}>
                {filters.minRating !== null ? `${filters.minRating}+ ★` : "Rating"}
              </span>
            </Chip>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-7 shrink-0 items-center px-1.5 text-[11px] font-medium text-primary transition-colors hover:text-foreground sm:h-8 sm:text-xs"
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

      {/* Full filter sheet — sort, price, location, rating in one place.
          Primary UX on mobile (chip strip dropdowns are clipped by the
          horizontal scroller); also opens on desktop from the Rating chip. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-surface shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(88vh,36rem)] sm:w-[24rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/15 sm:hidden" aria-hidden />
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-foreground/70" strokeWidth={2} aria-hidden />
                <p className="text-sm font-semibold text-foreground">Sort &amp; filter</p>
                {hasActiveFilters ? (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                    {count}
                  </span>
                ) : null}
              </div>
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
              <FilterSection title="Sort by">
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => {
                    const on = filters.sort === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => update({ sort: key })}
                        className={`rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                          on
                            ? "bg-accent text-white shadow-sm shadow-accent/20"
                            : "bg-accent/[0.06] text-foreground/80 ring-1 ring-accent/10 hover:bg-accent/10 hover:text-accent"
                        }`}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>

              <FilterSection title="Price (UGX)">
                <div className="grid grid-cols-2 gap-1.5">
                  {PRICE_PRESETS.map((preset) => {
                    const on = preset.min === filters.minPrice && preset.max === filters.maxPrice;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => update({ minPrice: preset.min, maxPrice: preset.max })}
                        className={`rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                          on
                            ? "bg-accent text-white shadow-sm shadow-accent/20"
                            : "bg-accent/[0.06] text-foreground/80 ring-1 ring-accent/10 hover:bg-accent/10 hover:text-accent"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Min"
                    value={formatPriceInput(filters.minPrice)}
                    onChange={(e) =>
                      update({ minPrice: parsePriceInput(e.target.value) })
                    }
                    className="dm-input w-full px-2 py-2 text-sm"
                    aria-label="Minimum price"
                  />
                  <span className="shrink-0 text-xs text-muted">–</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Max"
                    value={formatPriceInput(filters.maxPrice)}
                    onChange={(e) =>
                      update({ maxPrice: parsePriceInput(e.target.value) })
                    }
                    className="dm-input w-full px-2 py-2 text-sm"
                    aria-label="Maximum price"
                  />
                </div>
              </FilterSection>

              <FilterSection title="Location">
                <button
                  type="button"
                  onClick={() => void activateNearMeFromDrawer()}
                  disabled={drawerLocating}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    filters.nearMe
                      ? "bg-accent text-white shadow-sm shadow-accent/20"
                      : "bg-accent/[0.06] text-foreground/80 ring-1 ring-accent/10 hover:bg-accent/10 hover:text-accent"
                  } ${drawerLocating ? "opacity-70" : ""}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {drawerLocating ? (
                      <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <Navigation className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                    )}
                    <span className="truncate">
                      {filters.nearMe && filters.userGeo?.label
                        ? `Near · ${filters.userGeo.label}`
                        : drawerLocating
                          ? "Locating…"
                          : "Near me"}
                    </span>
                  </span>
                  {filters.nearMe ? (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Turn off Near me"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearLocationFilter();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          clearLocationFilter();
                        }
                      }}
                      className="rounded p-0.5 hover:bg-white/20"
                    >
                      <X className="size-3.5" strokeWidth={2.5} aria-hidden />
                    </span>
                  ) : null}
                </button>
                {drawerNearMeError ? (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {drawerNearMeError}
                  </p>
                ) : null}

                {locations.length > 0 ? (
                  <div className="mt-2 max-h-40 space-y-0.5 overflow-y-auto rounded-md ring-1 ring-border/60">
                    <button
                      type="button"
                      onClick={() => selectNamedLocation(null)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors ${
                        !filters.nearMe && filters.location === null
                          ? "bg-accent/10 font-semibold text-accent"
                          : "text-foreground/75 hover:bg-surface-subtle"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 opacity-60" strokeWidth={1.75} aria-hidden />
                        <span>All locations</span>
                      </span>
                    </button>
                    {locations.slice(0, 24).map((loc) => {
                      const on = !filters.nearMe && filters.location === loc.name;
                      return (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => selectNamedLocation(loc.name)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors ${
                            on
                              ? "bg-accent/10 font-semibold text-accent"
                              : "text-foreground/75 hover:bg-surface-subtle"
                          }`}
                        >
                          <span className="truncate">{loc.name}</span>
                          <span className="ml-2 shrink-0 text-[10px] tabular-nums text-muted">
                            {loc.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </FilterSection>

              <FilterSection title="Minimum rating">
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
              </FilterSection>

              <FilterSection title="Shop">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => update({ availableNow: !filters.availableNow })}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      filters.availableNow
                        ? "bg-accent text-white shadow-sm shadow-accent/20"
                        : "bg-accent/[0.06] text-foreground/80 ring-1 ring-accent/10 hover:bg-accent/10 hover:text-accent"
                    }`}
                  >
                    Available now
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ verifiedOnly: !filters.verifiedOnly })}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      filters.verifiedOnly
                        ? "bg-accent text-white shadow-sm shadow-accent/20"
                        : "bg-accent/[0.06] text-foreground/80 ring-1 ring-accent/10 hover:bg-accent/10 hover:text-accent"
                    }`}
                  >
                    Verified only
                  </button>
                </div>
              </FilterSection>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-border px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                onClick={clearAll}
                className="flex-1 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground disabled:opacity-50"
                disabled={!hasActiveFilters}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-[1.4] rounded-md bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Show {count > 0 ? `results (${count})` : "results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}
