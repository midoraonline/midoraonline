"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";

import { Chip, MenuPanel, useClickOutside } from "@/components/browse/ProductFilters";
import type { Shop, ShopType } from "@/lib/api/shops";

export type ShopSort = "relevance" | "followers" | "views" | "name";

export type ShopFilterState = {
  type: ShopType | null;
  location: string | null;
  sort: ShopSort;
};

export const DEFAULT_SHOP_FILTERS: ShopFilterState = {
  type: null,
  location: null,
  sort: "relevance",
};

export const SHOP_SORT_LABELS: Record<ShopSort, string> = {
  relevance: "Newest",
  followers: "Most followed",
  views: "Most viewed",
  name: "A to Z",
};

export type ShopLocationEntry = { name: string; count: number };

export function shopFiltersActive(f: ShopFilterState): boolean {
  return f.type !== null || f.location !== null || f.sort !== "relevance";
}

export function applyShopFilters(
  shops: Shop[],
  filters: ShopFilterState,
  locationOf: (shop: Shop) => string,
): Shop[] {
  let list = shops;
  if (filters.type) {
    const wanted = filters.type;
    list = list.filter((s) => {
      const t = s.shop_type ?? "product";
      return t === wanted || t === "both";
    });
  }
  if (filters.location) {
    const wanted = filters.location;
    list = list.filter((s) => locationOf(s) === wanted);
  }
  if (filters.sort === "relevance") return list;
  const sorted = list.slice();
  if (filters.sort === "followers") sorted.sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0));
  else if (filters.sort === "views") sorted.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
  else sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

export function collectShopLocations(shops: Shop[], locationOf: (shop: Shop) => string): ShopLocationEntry[] {
  const counts = new Map<string, number>();
  for (const s of shops) {
    const loc = locationOf(s).trim();
    if (loc) counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

function Option({ on, label, count, onClick }: { on: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
        on ? "bg-accent/10 font-semibold text-accent" : "text-foreground/80 hover:bg-surface-subtle"
      }`}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" ? <span className="shrink-0 text-[10px] tabular-nums text-muted">{count}</span> : null}
      {on ? <Check className="size-3.5 shrink-0" aria-hidden /> : null}
    </button>
  );
}

function LocationMenu({
  locations,
  value,
  onChange,
}: {
  locations: ShopLocationEntry[];
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const active = value !== null;

  return (
    <div ref={ref} className="relative">
      <Chip active={active} onClick={() => setOpen((v) => !v)}>
        <MapPin className="size-4 shrink-0" aria-hidden />
        <span className="max-w-[8rem] truncate">{value ?? "Location"}</span>
        <ChevronDown className={`size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </Chip>
      {open ? (
        <MenuPanel className="max-h-64 w-56 overflow-y-auto">
          <Option on={!active} label="All locations" onClick={() => { onChange(null); setOpen(false); }} />
          {locations.map((l) => (
            <Option
              key={l.name}
              on={value === l.name}
              label={l.name}
              count={l.count}
              onClick={() => { onChange(l.name); setOpen(false); }}
            />
          ))}
        </MenuPanel>
      ) : null}
    </div>
  );
}

function SortMenu({ value, onChange }: { value: ShopSort; onChange: (next: ShopSort) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const active = value !== "relevance";

  return (
    <div ref={ref} className="relative">
      <Chip active={active} onClick={() => setOpen((v) => !v)}>
        <span>{active ? SHOP_SORT_LABELS[value] : "Sort"}</span>
        <ChevronDown className={`size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </Chip>
      {open ? (
        <MenuPanel className="w-44">
          {(Object.keys(SHOP_SORT_LABELS) as ShopSort[]).map((key) => (
            <Option
              key={key}
              on={value === key}
              label={SHOP_SORT_LABELS[key]}
              onClick={() => { onChange(key); setOpen(false); }}
            />
          ))}
        </MenuPanel>
      ) : null}
    </div>
  );
}

/** Location and sort controls; location is omitted when there is nothing to choose between. */
export default function ShopFilterBar({
  filters,
  onChange,
  locations,
}: {
  filters: ShopFilterState;
  onChange: (next: ShopFilterState) => void;
  locations: ShopLocationEntry[];
}) {
  const showLocation = filters.location !== null || locations.length > 1;
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      {showLocation ? (
        <LocationMenu
          locations={locations}
          value={filters.location}
          onChange={(location) => onChange({ ...filters, location })}
        />
      ) : null}
      <SortMenu value={filters.sort} onChange={(sort) => onChange({ ...filters, sort })} />
      {shopFiltersActive(filters) ? (
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_SHOP_FILTERS })}
          className="px-1.5 text-xs font-bold text-accent underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
