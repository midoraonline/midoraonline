"use client";

import { useState, useEffect, useRef, useId } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { geocodeSearch, type GeocodeHit } from "@/lib/geo";

export type ResolvedLocation = {
  display: string;
  lat: number;
  lng: number;
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  /** Fired when the user picks a Nominatim suggestion (with coords) or clears place. */
  onResolved?: (place: ResolvedLocation | null) => void;
  placeholder?: string;
  className?: string;
};

export default function LocationInput({
  value,
  onChange,
  onResolved,
  placeholder = "Search location (e.g. Kisasi)",
  className = "",
}: Props) {
  const uid = useId();
  const radioName = `location_type_${uid}`;

  const isOnline = value === "Online Shop";
  const [query, setQuery] = useState(isOnline ? "" : value);
  const [results, setResults] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value === "Online Shop") {
      setQuery("");
    } else if (value !== query && !isOpen) {
      setQuery(value);
    }
  }, [value, isOpen]); // eslint-disable-line

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const searchLocation = async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const hits = await geocodeSearch(q, { signal: ac.signal, limit: 5 });
      if (!ac.signal.aborted) setResults(hits);
    } catch {
      if (!ac.signal.aborted) setResults([]);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    onChange(val);
    // Free-typed text has no trusted coords until a suggestion is chosen.
    onResolved?.(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchLocation(val);
    }, 400);
  };

  return (
    <div className={`space-y-3 ${className}`} ref={containerRef}>
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-xs cursor-pointer group">
          <input
            type="radio"
            name={radioName}
            checked={!isOnline}
            onChange={() => {
              onChange(query);
              onResolved?.(null);
            }}
            className="accent-primary"
          />
          <span className="group-hover:text-foreground/90 text-foreground/80 transition-colors">
            Physical location
          </span>
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer group">
          <input
            type="radio"
            name={radioName}
            checked={isOnline}
            onChange={() => {
              setIsOpen(false);
              onChange("Online Shop");
              onResolved?.(null);
            }}
            className="accent-primary"
          />
          <span className="group-hover:text-foreground/90 text-foreground/80 transition-colors">
            Online shop
          </span>
        </label>
      </div>

      {!isOnline && (
        <div className="relative">
          <input
            className="dm-input-xs dm-focus"
            placeholder={placeholder}
            value={query}
            onChange={handleInput}
            onFocus={() => {
              if (query.trim().length >= 3) {
                setIsOpen(true);
                searchLocation(query);
              }
            }}
          />
          {isOpen && query.trim().length >= 3 && (
            <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-xl shadow-lg max-h-[240px] overflow-y-auto">
              {loading && (
                <div className="p-3 text-xs text-muted text-center animate-pulse">
                  Searching OpenStreetMap…
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="p-3 text-xs text-muted text-center">No locations found.</div>
              )}
              {!loading &&
                results.map((res, i) => (
                  <button
                    key={`${res.lat},${res.lng},${i}`}
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-foreground/[0.04] transition-colors border-b border-border/50 last:border-0 focus:outline-none focus:bg-foreground/[0.06]"
                    onClick={() => {
                      setQuery(res.displayName);
                      onChange(res.displayName);
                      onResolved?.({
                        display: res.displayName,
                        lat: res.lat,
                        lng: res.lng,
                      });
                      setIsOpen(false);
                    }}
                  >
                    <MaterialSymbol name="location_on" className="!text-[14px] text-muted mr-1.5 align-middle" />
                    <span className="align-middle leading-relaxed">{res.displayName}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
