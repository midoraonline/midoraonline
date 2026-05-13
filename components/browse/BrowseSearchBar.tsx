"use client";

import { Search, X } from "lucide-react";

export default function BrowseSearchBar({
  value,
  onChange,
  placeholder = "Search…",
  ariaLabel = "Search",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Extra classes on outer wrapper */
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted sm:left-4" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="dm-input min-h-10 w-full py-2.5 pl-10 pr-10 text-sm sm:min-h-11 sm:py-3 sm:pl-11 sm:pr-11"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition-colors hover:text-foreground sm:right-3"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
