"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Search, TrendingUp, X } from "lucide-react";

import { apiSearch } from "@/lib/api";
import { notifyFeedEngagement } from "@/lib/engagementEvents";
import { useAppSession } from "@/lib/state";

type Suggestion = {
  query: string;
  kind: "trending" | "recent";
};

export default function ProductSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search products…",
  ariaLabel = "Search products",
  className = "",
  showSuggestions = true,
  variant = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (query: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  showSuggestions?: boolean;
  variant?: "default" | "navbar";
}) {
  const session = useAppSession();
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadSuggestions = useCallback(async () => {
    if (!showSuggestions) return;
    try {
      const [trendingRes, recentRes] = await Promise.all([
        apiSearch.getTrendingSearches().catch(() => ({ items: [] })),
        session.isAuthenticated
          ? apiSearch.getRecentSearches().catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ]);

      const recent: Suggestion[] = (recentRes.items ?? []).slice(0, 5).map((r) => ({
        query: r.query,
        kind: "recent" as const,
      }));
      const recentQueries = new Set(recent.map((r) => r.query.toLowerCase()));
      const trending: Suggestion[] = (trendingRes.items ?? [])
        .filter((t) => !recentQueries.has(t.query.toLowerCase()))
        .slice(0, 5)
        .map((t) => ({ query: t.query, kind: "trending" as const }));

      setSuggestions([...recent, ...trending]);
    } catch {
      setSuggestions([]);
    }
  }, [showSuggestions, session.isAuthenticated]);

  useEffect(() => {
    if (focused && !value.trim()) {
      void loadSuggestions();
    }
  }, [focused, value, loadSuggestions]);

  useEffect(() => {
    if (!focused) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [focused]);

  function handleSuggestionTap(query: string) {
    onChange(query);
    setFocused(false);
    apiSearch.logSearchQuery(query).catch(() => {});
    notifyFeedEngagement();
    onSubmit?.(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const q = value.trim();
      if (q) {
        setFocused(false);
        apiSearch.logSearchQuery(q).catch(() => {});
        notifyFeedEngagement();
        onSubmit?.(q);
      }
    }
    if (e.key === "Escape") {
      setFocused(false);
      if (value) onChange("");
    }
  }

  const showPanel = showSuggestions && focused && !value.trim() && suggestions.length > 0;
  const hasValue = value.trim().length > 0;

  const shellClass =
    variant === "navbar"
      ? "rounded-full bg-surface-subtle shadow-[inset_0_0_0_1px_var(--border)] transition-shadow focus-within:shadow-[inset_0_0_0_2px_var(--accent),0_0_0_3px_rgba(212,101,60,0.1)] focus-within:bg-surface"
      : "rounded-xl bg-surface-subtle shadow-[inset_0_0_0_1px_var(--border)] transition-shadow focus-within:shadow-[inset_0_0_0_2px_var(--accent),0_0_0_3px_rgba(212,101,60,0.1)] focus-within:bg-surface";

  const inputClass =
    variant === "navbar"
      ? "h-10 w-full bg-transparent pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted/70 sm:h-11 sm:pl-11 sm:pr-11"
      : "dm-input min-h-10 w-full border-0 bg-transparent py-2.5 pl-10 pr-10 text-sm shadow-none focus-visible:shadow-none sm:min-h-11 sm:py-3 sm:pl-11 sm:pr-11";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={shellClass}>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted sm:left-4"
          aria-hidden
        />
        <input
          type="text"
          role="searchbox"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-expanded={showPanel}
          aria-controls={showPanel ? "search-suggestions" : undefined}
          className={inputClass}
        />
        {hasValue ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground sm:right-2.5"
          >
            <X className="size-3.5" strokeWidth={2.25} />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
        >
          {suggestions.map((s) => (
            <li key={`${s.kind}-${s.query}`} role="option">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionTap(s.query)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-subtle"
              >
                {s.kind === "recent" ? (
                  <Clock className="size-3.5 shrink-0 text-muted" aria-hidden />
                ) : (
                  <TrendingUp className="size-3.5 shrink-0 text-accent" aria-hidden />
                )}
                <span className="truncate text-foreground">{s.query}</span>
                <span className="ml-auto shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted">
                  {s.kind === "recent" ? "Recent" : "Trending"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
