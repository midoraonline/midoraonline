"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Search, TrendingUp, X } from "lucide-react";
import useSWR from "swr";

import { apiSearch } from "@/lib/api";
import { useAppSession } from "@/lib/state";

type Suggestion = {
  query: string;
  kind: "trending" | "recent";
};

export default function ProductSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search listings…",
  ariaLabel = "Search listings",
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
  const containerRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = value.trim();
  const hasValue = q.length > 0;

  const suggestKey =
    showSuggestions && focused ? (["search:suggest", session.isAuthenticated] as const) : null;
  const { data: suggestions = [] } = useSWR(
    suggestKey,
    async ([, authed]) => {
      const [trendingRes, recentRes] = await Promise.all([
        apiSearch.getTrendingSearches().catch(() => ({ items: [] })),
        authed
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
      return [...recent, ...trending];
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  );

  // Typing only narrows past/trending searches locally; results load on submit.
  const needle = q.toLowerCase();
  const visibleSuggestions = needle
    ? suggestions.filter((s) => s.query.toLowerCase().includes(needle) && s.query.toLowerCase() !== needle)
    : suggestions;

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

  function submit(term: string) {
    const next = term.trim();
    if (!next) {
      inputRef.current?.focus();
      return;
    }
    setFocused(false);
    inputRef.current?.blur();
    onSubmit?.(next);
  }

  function handleSuggestionTap(query: string) {
    onChange(query);
    submit(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setFocused(false);
      if (value) onChange("");
    }
  }

  const showPanel = showSuggestions && focused && visibleSuggestions.length > 0;
  const navbar = variant === "navbar";

  const shellClass = navbar
    ? "flex items-center rounded-full bg-surface-subtle p-1 shadow-[inset_0_0_0_1px_var(--border)] transition-shadow focus-within:bg-surface focus-within:shadow-[inset_0_0_0_2px_var(--accent),0_0_0_3px_rgba(212,101,60,0.1)]"
    : "flex items-center rounded-xl bg-surface-subtle p-1 shadow-[inset_0_0_0_1px_var(--border)] transition-shadow focus-within:bg-surface focus-within:shadow-[inset_0_0_0_2px_var(--accent),0_0_0_3px_rgba(212,101,60,0.1)]";

  return (
    <form
      ref={containerRef}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      className={`relative ${className}`}
    >
      <div className={shellClass}>
        <Search className="ml-2.5 size-4 shrink-0 text-muted sm:ml-3" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
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
          className="h-8 min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted/70 sm:h-9"
        />
        {hasValue ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="mr-1 grid size-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <X className="size-3.5" strokeWidth={2.25} />
          </button>
        ) : null}
        <button
          type="submit"
          aria-label="Search"
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60 sm:h-9 sm:px-4 sm:text-sm ${
            navbar ? "rounded-full" : "rounded-lg"
          }`}
        >
          <Search className="size-3.5 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {showPanel ? (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 max-h-80 overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-background py-1 shadow-xl"
        >
          {visibleSuggestions.map((s) => (
            <li key={`${s.kind}-${s.query}`} role="option" aria-selected={false}>
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
    </form>
  );
}
