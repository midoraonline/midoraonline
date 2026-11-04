"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { PiCaretDownBold, PiMapPinFill, PiNavigationArrowFill } from "react-icons/pi";
import { getPopularLocations, type PopularLocation } from "@/lib/api/products";
import { GeoLocationError } from "@/lib/geo";
import { withNearMe, type FilterState } from "@/components/browse/ProductFilters";
import { ALL_UGANDA, BROWSE_AREAS, areaLabel } from "@/lib/browseArea";

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  /** Home browsing preference: nearby inventory first, wider Uganda after. */
  area?: string | null;
  onAreaChange?: (area: string) => void;
  signedIn?: boolean;
};

export default function LocationPill({ filters, onChange, area, onAreaChange, signedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<PopularLocation[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || places !== null) return;
    let cancelled = false;
    getPopularLocations(20)
      .then((r) => !cancelled && setPlaces(r.items ?? []))
      .catch(() => !cancelled && setPlaces([]));
    return () => {
      cancelled = true;
    };
  }, [open, places]);

  const active = filters.nearMe || filters.location !== null;
  const hasArea = Boolean(onAreaChange && area && area !== ALL_UGANDA);
  const label = filters.nearMe
    ? filters.userGeo?.label || "Near me"
    : filters.location ?? (hasArea ? `Near ${areaLabel(area)}` : "Uganda");

  function pickArea(next: string) {
    if (active) onChange({ ...filters, location: null, nearMe: false, userGeo: null });
    onAreaChange?.(next);
    setOpen(false);
  }

  function pick(location: string | null) {
    onChange({ ...filters, location, nearMe: false, userGeo: null });
    setOpen(false);
  }

  async function nearMe() {
    setLocating(true);
    setError(null);
    try {
      onChange(await withNearMe(filters));
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof GeoLocationError || err instanceof Error
          ? err.message
          : "Couldn’t use your location.",
      );
    } finally {
      setLocating(false);
    }
  }

  const row = (on: boolean) =>
    `flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      on ? "bg-accent/10 font-semibold text-accent" : "text-foreground/80 hover:bg-surface-subtle"
    }`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex h-10 max-w-[11rem] shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold shadow-sm transition-all active:scale-95 sm:text-sm ${
          active
            ? "bg-accent/10 text-accent ring-1 ring-accent/40"
            : "bg-surface text-foreground ring-1 ring-foreground/15 hover:ring-accent/40"
        }`}
      >
        {filters.nearMe ? (
          <PiNavigationArrowFill className="size-[18px] shrink-0 text-accent" aria-hidden />
        ) : (
          <PiMapPinFill className="size-[18px] shrink-0 text-accent" aria-hidden />
        )}
        <span className="truncate">{label}</span>
        <PiCaretDownBold className="size-3.5 shrink-0" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-modal" role="dialog" aria-modal="true" aria-label="Choose location">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[80vh] flex-col rounded-t-2xl bg-surface shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[22rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Location</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-subtle hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {onAreaChange ? (
                <>
                  <p className="px-3 pb-1 pt-1 text-xs text-muted">
                    Where would you like to browse? Listings there come first, then nearby and the rest of Uganda.
                    {signedIn ? " We'll remember this on your account." : " Sign in to keep it on every device."}
                  </p>
                  {BROWSE_AREAS.map((a) => {
                    const on = !active && area === a.value;
                    return (
                      <button key={a.value} type="button" onClick={() => pickArea(a.value)} className={row(on)}>
                        <span className="inline-flex items-center gap-2">
                          <PiMapPinFill className="size-[18px] text-accent" aria-hidden />
                          {a.label}
                        </span>
                        {on ? <Check className="size-4" aria-hidden /> : null}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => pickArea(ALL_UGANDA)} className={row(!active && !hasArea)}>
                    <span className="inline-flex items-center gap-2">
                      <PiMapPinFill className="size-[18px] text-accent" aria-hidden />
                      All of Uganda
                    </span>
                    {!active && !hasArea ? <Check className="size-4" aria-hidden /> : null}
                  </button>
                  <p className="px-3 pb-1 pt-3 text-xs font-semibold text-muted">Only show one place</p>
                </>
              ) : null}
              <button type="button" onClick={() => void nearMe()} disabled={locating} className={row(filters.nearMe)}>
                <span className="inline-flex items-center gap-2">
                  {locating ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <PiNavigationArrowFill className="size-[18px] text-accent" aria-hidden />
                  )}
                  {locating ? "Locating…" : "Near me"}
                </span>
                {filters.nearMe ? <Check className="size-4" aria-hidden /> : null}
              </button>
              {error ? <p className="px-3 text-[11px] font-medium text-rose-600">{error}</p> : null}
              {onAreaChange ? null : (
                <button type="button" onClick={() => pick(null)} className={row(!active)}>
                  <span className="inline-flex items-center gap-2">
                    <PiMapPinFill className="size-[18px] text-accent" aria-hidden />
                    All of Uganda
                  </span>
                  {!active ? <Check className="size-4" aria-hidden /> : null}
                </button>
              )}
              {places === null ? (
                <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Loading places…
                </p>
              ) : (
                places.map((p) => {
                  const on = !filters.nearMe && filters.location === p.name;
                  return (
                    <button key={p.name} type="button" onClick={() => pick(p.name)} className={row(on)}>
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted">{p.count}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
