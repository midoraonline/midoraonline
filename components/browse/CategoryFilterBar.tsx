"use client";

import { useMemo, useState } from "react";
import { Filter, X } from "lucide-react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { CATEGORY_ICON_CLASS, resolveCategoryIcon, ALL_CATEGORIES_ICON } from "@/lib/homeCategoryIcons";

type Props = {
  categories: string[];
  selected: string | null;
  onSelect: (key: string | null) => void;
};

export default function CategoryFilterBar({
  categories,
  selected,
  onSelect,
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
        {items.map(({ key, label }) => {
          const active = key === null ? selected === null : selected === key;
          const icon = key === null ? ALL_CATEGORIES_ICON : resolveCategoryIcon(label);
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
              <span className={`grid size-5 shrink-0 place-items-center rounded-md ${active ? "bg-white/20" : CATEGORY_ICON_CLASS}`}>
                <MaterialSymbol name={icon} className="!text-[13px]" />
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Mobile: filter button + drawer */}
      <div className="sm:hidden mb-4">
        <div className="flex items-center gap-2">
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
              {items.map(({ key, label }) => {
                const active = key === null ? selected === null : selected === key;
                const icon = key === null ? ALL_CATEGORIES_ICON : resolveCategoryIcon(label);
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
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${active ? "bg-accent/15 text-accent" : CATEGORY_ICON_CLASS}`}>
                      <MaterialSymbol name={icon} className="!text-base" />
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
