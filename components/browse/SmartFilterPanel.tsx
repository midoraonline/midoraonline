"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, SlidersHorizontal, Star } from "lucide-react";

import type { ProductCardData } from "@/components/productcard";
import {
  DEFAULT_FILTERS,
  PRICE_PRESETS,
  SORT_LABELS,
  activeFilterCount,
  collectLocationEntries,
  formatPriceInput,
  parsePriceInput,
  type FilterState,
  type SortOption,
} from "@/components/browse/ProductFilters";
import {
  COMPENSATION_OPTIONS,
  OPPORTUNITY_KIND_OPTIONS,
  PRICING_MODEL_OPTIONS,
  normalizeListingKind,
  type ListingKind,
} from "@/lib/listingMeta";

const KIND_LABEL: Record<ListingKind, string> = {
  product: "Products",
  service: "Services",
  opportunity: "Opportunities",
};

type Option<T> = { value: T; label: string; count: number };

function countBy<T extends string>(items: ProductCardData[], pick: (p: ProductCardData) => T | null | undefined) {
  const out = new Map<T, number>();
  for (const p of items) {
    const v = pick(p);
    if (v) out.set(v, (out.get(v) ?? 0) + 1);
  }
  return out;
}

function metaValue(p: ProductCardData, key: string): string | null {
  const v = p.listing_meta?.[key];
  return typeof v === "string" && v ? v : null;
}

function withCounts<T extends string>(
  options: readonly { value: T; label: string }[],
  counts: Map<string, number>,
  active: string | null,
): Option<T>[] {
  return options
    .map((o) => ({ ...o, count: counts.get(o.value) ?? 0 }))
    .filter((o) => o.count > 0 || o.value === active);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border/70 py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Row({
  on,
  label,
  count,
  onClick,
}: {
  on: boolean;
  label: ReactNode;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
        on ? "bg-accent/10 font-semibold text-accent" : "text-foreground/80 hover:bg-foreground/[0.04]"
      }`}
    >
      <span
        className={`grid size-4 shrink-0 place-items-center rounded border ${
          on ? "border-accent bg-accent text-white" : "border-border-strong bg-surface"
        }`}
        aria-hidden
      >
        {on ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" ? (
        <span className="shrink-0 text-[11px] tabular-nums text-muted">{count}</span>
      ) : null}
    </button>
  );
}

/** Sidebar facets built from the current results; sections with nothing to narrow are omitted. */
export default function SmartFilterPanel({
  products,
  filters,
  onChange,
  className = "",
}: {
  products: ProductCardData[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}) {
  const [moreLocations, setMoreLocations] = useState(false);
  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });
  const active = activeFilterCount(filters);

  const facets = useMemo(() => {
    const kinds = countBy(products, (p) => normalizeListingKind(p.item_type));
    const prices = products.map((p) => p.priceUGX).filter((n) => n > 0);
    const distinctPrices = new Set(prices).size;
    const presets = PRICE_PRESETS.map((preset) => ({
      ...preset,
      count: prices.filter((n) => (preset.min == null || n >= preset.min) && (preset.max == null || n <= preset.max)).length,
    }));
    const locations = collectLocationEntries(products);
    const rated = products.filter((p) => (p.rating ?? 0) > 0);
    const verified = products.filter((p) => p.shop.verified).length;
    const available = products.filter((p) => p.shop.available_now).length;
    return {
      kinds,
      priced: prices.length,
      distinctPrices,
      presets,
      locations,
      rated4: rated.filter((p) => (p.rating ?? 0) >= 4).length,
      rated3: rated.filter((p) => (p.rating ?? 0) >= 3).length,
      ratedAny: rated.length,
      verified,
      available,
      pricing: countBy(products, (p) => metaValue(p, "pricing_model")),
      oppKind: countBy(products, (p) => metaValue(p, "opportunity_kind")),
      compensation: countBy(products, (p) => metaValue(p, "compensation")),
    };
  }, [products]);

  const total = products.length;
  const kindOptions = (["product", "service", "opportunity"] as ListingKind[])
    .map((k) => ({ value: k, label: KIND_LABEL[k], count: facets.kinds.get(k) ?? 0 }))
    .filter((o) => o.count > 0 || filters.listingKind === o.value);
  const showKinds = filters.listingKind !== null || kindOptions.length > 1;

  const priceActive = filters.minPrice !== null || filters.maxPrice !== null;
  const presetOptions = facets.presets.filter(
    (p) => p.count > 0 || (p.min === filters.minPrice && p.max === filters.maxPrice),
  );
  const showPrice = priceActive || (facets.priced >= 2 && facets.distinctPrices > 1);

  const showLocation = filters.location !== null || facets.locations.length > 1;
  const locationRows = moreLocations ? facets.locations.slice(0, 30) : facets.locations.slice(0, 6);

  const showRating = filters.minRating !== null || facets.ratedAny > 0;

  const showVerified = filters.verifiedOnly || (facets.verified > 0 && facets.verified < total);
  const showAvailable = filters.availableNow || (facets.available > 0 && facets.available < total);

  const pricingOptions = withCounts(PRICING_MODEL_OPTIONS, facets.pricing, filters.pricingModel);
  const oppKindOptions = withCounts(OPPORTUNITY_KIND_OPTIONS, facets.oppKind, filters.opportunityKind);
  const compensationOptions = withCounts(COMPENSATION_OPTIONS, facets.compensation, filters.compensation);
  const showPricing = filters.pricingModel !== null || pricingOptions.length > 1;
  const showOppKind = filters.opportunityKind !== null || oppKindOptions.length > 1;
  const showCompensation = filters.compensation !== null || compensationOptions.length > 1;

  const sortOptions = (Object.keys(SORT_LABELS) as SortOption[]).filter((key) => {
    if (key === filters.sort) return true;
    if (key === "price_asc" || key === "price_desc") return facets.distinctPrices > 1;
    if (key === "best_rated") return facets.ratedAny > 0;
    return true;
  });

  const nothingToFilter =
    !showKinds && !showPrice && !showLocation && !showRating && !showVerified && !showAvailable &&
    !showPricing && !showOppKind && !showCompensation;

  return (
    <aside className={`rounded-2xl border border-border bg-surface p-4 ${className}`} aria-label="Filter results">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="size-4 text-muted" aria-hidden />
          Filters
          {active > 0 ? (
            <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold leading-5 text-white">{active}</span>
          ) : null}
        </p>
        {active > 0 ? (
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {total > 1 || filters.sort !== "relevance" ? (
        <Section title="Sort by">
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortOption })}
            className="dm-input w-full px-2.5 py-2 text-sm"
            aria-label="Sort results"
          >
            {sortOptions.map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </Section>
      ) : null}

      {showKinds ? (
        <Section title="Type">
          <div className="space-y-0.5">
            {kindOptions.map((o) => (
              <Row
                key={o.value}
                on={filters.listingKind === o.value}
                label={o.label}
                count={o.count}
                onClick={() =>
                  update({
                    listingKind: filters.listingKind === o.value ? null : o.value,
                    opportunityKind: null,
                    compensation: null,
                    pricingModel: null,
                  })
                }
              />
            ))}
          </div>
        </Section>
      ) : null}

      {showPrice ? (
        <Section title="Price (UGX)">
          <div className="space-y-0.5">
            {presetOptions.map((p) => {
              const on = p.min === filters.minPrice && p.max === filters.maxPrice;
              return (
                <Row
                  key={p.label}
                  on={on}
                  label={p.label}
                  count={p.count}
                  onClick={() => update(on ? { minPrice: null, maxPrice: null } : { minPrice: p.min, maxPrice: p.max })}
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Min"
              value={formatPriceInput(filters.minPrice)}
              onChange={(e) => update({ minPrice: parsePriceInput(e.target.value) })}
              className="dm-input w-full px-2 py-1.5 text-xs"
              aria-label="Minimum price"
            />
            <span className="text-xs text-muted">–</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Max"
              value={formatPriceInput(filters.maxPrice)}
              onChange={(e) => update({ maxPrice: parsePriceInput(e.target.value) })}
              className="dm-input w-full px-2 py-1.5 text-xs"
              aria-label="Maximum price"
            />
          </div>
        </Section>
      ) : null}

      {showLocation ? (
        <Section title="Location">
          <div className="space-y-0.5">
            {filters.location && !facets.locations.some((l) => l.name === filters.location) ? (
              <Row on label={filters.location} onClick={() => update({ location: null })} />
            ) : null}
            {locationRows.map((l) => {
              const on = !filters.nearMe && filters.location === l.name;
              return (
                <Row
                  key={l.name}
                  on={on}
                  label={l.name}
                  count={l.count}
                  onClick={() => update({ location: on ? null : l.name, nearMe: false, userGeo: null })}
                />
              );
            })}
          </div>
          {facets.locations.length > 6 ? (
            <button
              type="button"
              onClick={() => setMoreLocations((v) => !v)}
              className="mt-1.5 px-2 text-xs font-semibold text-accent hover:underline"
            >
              {moreLocations ? "Show less" : `Show ${facets.locations.length - 6} more`}
            </button>
          ) : null}
        </Section>
      ) : null}

      {showPricing ? (
        <Section title="Service pricing">
          <div className="space-y-0.5">
            {pricingOptions.map((o) => (
              <Row
                key={o.value}
                on={filters.pricingModel === o.value}
                label={o.label}
                count={o.count}
                onClick={() => update({ pricingModel: filters.pricingModel === o.value ? null : o.value })}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {showOppKind ? (
        <Section title="Opportunity type">
          <div className="space-y-0.5">
            {oppKindOptions.map((o) => (
              <Row
                key={o.value}
                on={filters.opportunityKind === o.value}
                label={o.label}
                count={o.count}
                onClick={() => update({ opportunityKind: filters.opportunityKind === o.value ? null : o.value })}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {showCompensation ? (
        <Section title="Compensation">
          <div className="space-y-0.5">
            {compensationOptions.map((o) => (
              <Row
                key={o.value}
                on={filters.compensation === o.value}
                label={o.label}
                count={o.count}
                onClick={() => update({ compensation: filters.compensation === o.value ? null : o.value })}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {showRating ? (
        <Section title="Rating">
          <div className="space-y-0.5">
            {[
              { value: 4, count: facets.rated4 },
              { value: 3, count: facets.rated3 },
            ]
              .filter((r) => r.count > 0 || filters.minRating === r.value)
              .map((r) => (
                <Row
                  key={r.value}
                  on={filters.minRating === r.value}
                  label={
                    <span className="inline-flex items-center gap-1">
                      {r.value}
                      <Star className="size-3 fill-current text-amber-500" aria-hidden />& up
                    </span>
                  }
                  count={r.count}
                  onClick={() => update({ minRating: filters.minRating === r.value ? null : r.value })}
                />
              ))}
          </div>
        </Section>
      ) : null}

      {showVerified || showAvailable ? (
        <Section title="Seller">
          <div className="space-y-0.5">
            {showVerified ? (
              <Row
                on={filters.verifiedOnly}
                label="Verified sellers"
                count={facets.verified}
                onClick={() => update({ verifiedOnly: !filters.verifiedOnly })}
              />
            ) : null}
            {showAvailable ? (
              <Row
                on={filters.availableNow}
                label="Available now"
                count={facets.available}
                onClick={() => update({ availableNow: !filters.availableNow })}
              />
            ) : null}
          </div>
        </Section>
      ) : null}

      {nothingToFilter && active === 0 ? (
        <p className="text-xs leading-relaxed text-muted">These results are already narrow — nothing more to filter.</p>
      ) : null}
    </aside>
  );
}
