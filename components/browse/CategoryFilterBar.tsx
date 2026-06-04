"use client";

import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { categoryToneClass, resolveCategoryIconPath, ALL_CATEGORIES_ICON_PATH } from "@/lib/homeCategoryIcons";
import Image from "next/image";

type Props = {
  categories: string[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  searchActive?: boolean;
  onSearchToggle?: () => void;
};

export default function CategoryFilterBar({
  categories,
  selected,
  onSelect,
  searchActive,
  onSearchToggle,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.localeCompare(b));
    return [
      { key: null as string | null, label: "All" },
      ...sorted.map((c) => ({ key: c, label: c })),
    ];
  }, [categories]);

  return (
    <>
      {/* Desktop: horizontal pill strip */}
      <div className="hidden sm:flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {onSearchToggle && (
          <button
            type="button"
            onClick={onSearchToggle}
            aria-label="Toggle search"
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all dm-focus ${
              searchActive
                ? "bg-accent text-white shadow-sm"
                : "bg-surface-subtle text-muted hover:text-foreground ring-1 ring-border"
            }`}
          >
            <Search className="size-3.5" />
            Search
          </button>
        )}

        <div className="h-5 w-px shrink-0 bg-border" />

        {items.map(({ key, label }, i) => {
          const active = key === null ? selected === null : selected === key;
          const tone = categoryToneClass(Math.max(0, i - 1));
          return (
            <button
              key={key ?? "all"}
              type="button"
              onClick={() => onSelect(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all dm-focus whitespace-nowrap ${
                active
                  ? "bg-accent text-white shadow-sm ring-1 ring-accent/50"
                  : "bg-surface text-muted hover:text-foreground ring-1 ring-border hover:ring-border-strong"
              }`}
            >
              {key !== null && (
                <span className={`grid size-5 shrink-0 place-items-center rounded-md ${tone}`}>
                  <Image
                    src={resolveCategoryIconPath(label)}
                    alt=""
                    width={14}
                    height={14}
                    className="size-3.5 object-contain"
                    unoptimized
                  />
                </span>
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* Mobile: filter button + drawer */}
      <div className="sm:hidden mb-4">
        <div className="flex items-center gap-2">
          {onSearchToggle && (
            <button
              type="button"
              onClick={onSearchToggle}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all dm-focus ${
                searchActive
                  ? "bg-accent text-white"
                  : "bg-surface-subtle text-muted ring-1 ring-border"
              }`}
            >
              <Search className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-sm dm-focus"
          >
            <Filter className="size-3.5" />
            {selected ? selected : "Categories"}
          </button>

          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {items.slice(0, 4).map(({ key, label }) => {
              const active = key === null ? selected === null : selected === key;
              return (
                <button
                  key={key ?? "all"}
                  type="button"
                  onClick={() => onSelect(key)}
                  className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-medium transition-all whitespace-nowrap dm-focus ${
                    active
                      ? "bg-accent text-white"
                      : "bg-surface text-muted ring-1 ring-border"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-surface px-4 pb-6 pt-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Categories</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-surface-subtle text-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {items.map(({ key, label }, i) => {
                const active = key === null ? selected === null : selected === key;
                const tone = categoryToneClass(Math.max(0, i - 1));
                return (
                  <button
                    key={key ?? "all"}
                    type="button"
                    onClick={() => {
                      onSelect(key);
                      setDrawerOpen(false);
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors dm-focus ${
                      active
                        ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                        : "text-foreground/80 hover:bg-surface-subtle"
                    }`}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone}`}>
                      <Image
                        src={key === null ? ALL_CATEGORIES_ICON_PATH : resolveCategoryIconPath(label)}
                        alt=""
                        width={18}
                        height={18}
                        className="size-4.5 object-contain"
                        unoptimized
                      />
                    </span>
                    <span className="flex-1 text-left">{label}</span>
                    {active && <span className="size-1.5 rounded-full bg-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
