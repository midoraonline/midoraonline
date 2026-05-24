"use client";

import Image from "next/image";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SearchIcon from "@mui/icons-material/Search";
import { categoryToneClass, resolveCategoryIconPath, ALL_CATEGORIES_ICON_PATH } from "@/lib/homeCategoryIcons";
import { browseCategoryStickyClass } from "@/components/browse/StickyBrowseToolbar";

export default function BrowseCategorySidebar({
  categories,
  selected,
  onSelect,
  collapsed,
  onToggleCollapsed,
  listId,
  searchActive = false,
  onSearchToggle,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  listId: string;
  /** Whether the full-width search bar above the grid is currently open. */
  searchActive?: boolean;
  /** Toggle the full-width search bar open/closed. */
  onSearchToggle?: () => void;
}) {
  const items = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.localeCompare(b));
    return [
      { key: null as string | null, label: "All" },
      ...sorted.map((c) => ({ key: c, label: c })),
    ];
  }, [categories]);

  return (
    <aside
      className={`${browseCategoryStickyClass} shrink-0 transition-[width] duration-300 ease-out ${
        collapsed ? "w-[3.25rem] sm:w-14" : "w-[11.5rem] sm:w-52"
      }`}
    >
      <nav
        className="dm-card flex max-h-[min(82vh,calc(100dvh-6.125rem))] flex-col overflow-hidden sm:max-h-[min(82vh,calc(100dvh-6.625rem))]"
        aria-label="Browse by category"
      >
        {/* ── Header row ── */}
        <div
          className={`flex shrink-0 items-center border-b border-foreground/[0.06] py-1 ${
            collapsed ? "flex-col gap-0.5 px-0 py-1.5" : "justify-between px-2 pr-1"
          }`}
        >
          {/* Search toggle icon */}
          <button
            type="button"
            onClick={onSearchToggle}
            title={searchActive ? "Close search" : "Search"}
            aria-label={searchActive ? "Close search" : "Open search"}
            aria-pressed={searchActive}
            className={`dm-focus flex size-9 items-center justify-center rounded-xl transition-colors ${
              searchActive
                ? "bg-primary/15 text-primary ring-2 ring-primary/25"
                : "text-muted hover:bg-foreground/[0.06] hover:text-foreground"
            }`}
          >
            <SearchIcon sx={{ fontSize: 18 }} aria-hidden />
          </button>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="dm-focus flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            title={collapsed ? "Expand categories" : "Collapse categories"}
            aria-expanded={!collapsed}
            aria-controls={listId}
          >
            {collapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <ChevronLeft className="size-4" aria-hidden />
            )}
          </button>
        </div>

        {/* ── Category list ── */}
        <ul
          id={listId}
          className="home-category-scroll flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 pt-1 pb-1.5 sm:px-2 sm:pb-2"
        >
          {items.map(({ key, label }, i) => {
            const iconSrc = key === null ? ALL_CATEGORIES_ICON_PATH : resolveCategoryIconPath(label);
            const active = key === null ? selected === null : selected === key;
            const badge = categoryToneClass(Math.max(0, i - 1));

            return (
              <li key={key ?? "all"}>
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  title={label}
                  className={`dm-focus flex w-full items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left text-xs font-semibold transition-colors ${
                    active
                      ? "bg-primary/15 text-primary ring-2 ring-primary/25"
                      : "text-foreground/90 hover:bg-foreground/[0.06]"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${badge} ${
                      active ? "ring-2 ring-primary/30" : ""
                    }`}
                  >
                    <Image
                      src={iconSrc}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 object-contain"
                      unoptimized
                    />
                  </span>
                  {!collapsed && (
                    <span className="min-w-0 truncate">{label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
