"use client";

import { useState, useEffect, useRef, useId } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
};

export default function LocationInput({
  value,
  onChange,
  placeholder = "Search location (e.g. Kisasi)",
  className = "",
}: Props) {
  // Stable, unique name for the radio group — prevents hydration mismatch
  const uid = useId();
  const radioName = `location_type_${uid}`;

  const isOnline = value === "Online Shop";
  const [query, setQuery] = useState(isOnline ? "" : value);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync incoming value
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

  const searchLocation = async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          q
        )}&countrycodes=ug&format=json&limit=5&accept-language=en`
      );
      const data = await res.json();
      setResults(data.map((d: { display_name: string }) => d.display_name));
    } catch {
      // Ignore network errors gracefully
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchLocation(val);
    }, 400);
  };

  return (
    <div className={`space-y-3 ${className}`} ref={containerRef}>
      {/* Physical / Online toggle — same radio group guaranteed by stable name */}
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-xs cursor-pointer group">
          <input
            type="radio"
            name={radioName}
            checked={!isOnline}
            onChange={() => {
              onChange(query);
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
                    key={i}
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-foreground/[0.04] transition-colors border-b border-border/50 last:border-0 focus:outline-none focus:bg-foreground/[0.06]"
                    onClick={() => {
                      setQuery(res);
                      onChange(res);
                      setIsOpen(false);
                    }}
                  >
                    <MaterialSymbol name="location_on" className="!text-[14px] text-muted mr-1.5 align-middle" />
                    <span className="align-middle leading-relaxed">{res}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
