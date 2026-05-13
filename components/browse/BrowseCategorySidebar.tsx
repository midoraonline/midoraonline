"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import {
  ALL_CATEGORIES_ICON,
  categoryToneClass,
  resolveCategoryIcon,
} from "@/lib/homeCategoryIcons";
import { browseCategoryStickyClass } from "@/components/browse/StickyBrowseToolbar";

export default function BrowseCategorySidebar({
  categories,
  selected,
  onSelect,
  collapsed,
  onToggleCollapsed,
  listId,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Unique id for the category `<ul>` (a11y). */
  listId: string;
}) {
  const items = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.localeCompare(b));
    return [{ key: null as string | null, label: "All" }, ...sorted.map((c) => ({ key: c, label: c }))];
  }, [categories]);

  return (
    <aside
      className={`${browseCategoryStickyClass} shrink-0 transition-[width] duration-300 ease-out ${
        collapsed ? "w-[3.25rem] sm:w-14" : "w-[11.5rem] sm:w-52"
      }`}
    >
      <nav
        className="dm-card flex max-h-[min(78vh,calc(100dvh-6.25rem))] flex-col overflow-hidden sm:max-h-[min(78vh,calc(100dvh-6.75rem))]"
        aria-label="Browse by category"
      >
        <div
          className={`flex items-center border-b border-foreground/[0.06] py-2 ${
            collapsed ? "justify-center px-0" : "justify-between px-2.5 pr-1"
          }`}
        >
          {!collapsed && (
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Categories
            </p>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="dm-focus flex size-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            title={collapsed ? "Expand categories" : "Collapse categories"}
            aria-expanded={!collapsed}
            aria-controls={listId}
          >
            {collapsed ? <ChevronRight className="size-4" aria-hidden /> : <ChevronLeft className="size-4" aria-hidden />}
          </button>
        </div>

        <ul
          id={listId}
          className="home-category-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-1.5 sm:p-2"
        >
          {items.map(({ key, label }, i) => {
            const isAll = key === null;
            const Icon = isAll ? ALL_CATEGORIES_ICON : resolveCategoryIcon(label);
            const active = key === null ? selected === null : selected === key;
            const badge = isAll ? categoryToneClass(2) : categoryToneClass(Math.max(0, i - 1));

            return (
              <li key={key ?? "all"}>
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  title={label}
                  className={`dm-focus flex w-full items-center gap-2.5 rounded-2xl px-2 py-2 text-left text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary/15 text-primary ring-2 ring-primary/25"
                      : "text-foreground/90 hover:bg-foreground/[0.06]"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${badge} ${
                      active ? "ring-2 ring-primary/30" : ""
                    }`}
                  >
                    <Icon className="size-[1.05rem] sm:size-[1.15rem]" aria-hidden />
                  </span>
                  {!collapsed && <span className="min-w-0 truncate">{label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
