"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import {
  ALL_CATEGORIES_ICON,
  resolveCategoryIcon,
} from "@/lib/homeCategoryIcons";
import {
  type CategoryFilterSelection,
  EMPTY_CATEGORY_FILTER,
  isCategoryFilterActive,
} from "@/lib/browseCategories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";

type Props = {
  selection: CategoryFilterSelection;
  onSelectionChange: (next: CategoryFilterSelection) => void;
  showHeader?: boolean;
  browseAllHref?: string;
};

export default function CategoryBrowseSection({
  selection,
  onSelectionChange,
  showHeader = true,
  browseAllHref,
}: Props) {
  const { tree, counts } = useCategoryItems();

  const activeGroup = useMemo(
    () =>
      selection.parentLabel
        ? (tree.find((g) => g.parent.label === selection.parentLabel) ?? null)
        : null,
    [selection.parentLabel, tree],
  );

  function isParentActive(label: string | null) {
    return label === null
      ? !selection.parentLabel
      : selection.parentLabel === label && !selection.subcategoryLabel;
  }

  function isParentSelected(label: string | null) {
    return label === null
      ? !selection.parentLabel
      : selection.parentLabel === label;
  }

  return (
    <section className="rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/[0.06] via-background to-background p-2.5 sm:p-3">
      {showHeader && (
        <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-accent uppercase sm:text-xs sm:normal-case sm:tracking-tight">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            Browse categories
          </h2>
          {browseAllHref && (
            <Link
              href={browseAllHref}
              className="text-[11px] font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Browse all
            </Link>
          )}
        </div>
      )}

      {/* Parent category strip — icon tiles, ranked by listing volume */}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-3 bg-gradient-to-r from-accent/[0.06] to-transparent sm:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-gradient-to-l from-background to-transparent sm:hidden"
          aria-hidden
        />
        <div className="flex gap-1.5 overflow-x-auto py-0.5 scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:gap-2 sm:overflow-visible">
          <CategoryChip
            label="All"
            icon={ALL_CATEGORIES_ICON}
            selected={isParentSelected(null)}
            active={isParentActive(null)}
            onClick={() => onSelectionChange(EMPTY_CATEGORY_FILTER)}
          />

          {tree.map(({ parent }) => (
            <CategoryChip
              key={parent.slug}
              label={parent.label}
              icon={resolveCategoryIcon(parent.label)}
              count={counts[parent.label]}
              selected={isParentSelected(parent.label)}
              active={isParentActive(parent.label)}
              onClick={() =>
                onSelectionChange({
                  parentLabel: parent.label,
                  subcategoryLabel: null,
                })
              }
            />
          ))}
        </div>
      </div>

      {/* Subcategory chips */}
      <AnimatePresence initial={false}>
        {activeGroup && activeGroup.children.length > 0 && (
          <motion.div
            key={activeGroup.parent.slug}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex gap-1 overflow-x-auto border-t border-accent/15 pt-2 scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:overflow-visible">
              <SubcategoryChip
                label="All"
                active={
                  selection.parentLabel === activeGroup.parent.label &&
                  !selection.subcategoryLabel
                }
                onClick={() =>
                  onSelectionChange({
                    parentLabel: activeGroup.parent.label,
                    subcategoryLabel: null,
                  })
                }
              />

              {activeGroup.children.map((child) => (
                <SubcategoryChip
                  key={child.slug}
                  label={child.label}
                  active={selection.subcategoryLabel === child.label}
                  onClick={() =>
                    onSelectionChange({
                      parentLabel: activeGroup.parent.label,
                      subcategoryLabel: child.label,
                    })
                  }
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter summary */}
      {isCategoryFilterActive(selection) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {selection.parentLabel && (
            <FilterChip
              label={selection.parentLabel}
              onRemove={() => onSelectionChange(EMPTY_CATEGORY_FILTER)}
            />
          )}
          {selection.subcategoryLabel && (
            <FilterChip
              label={selection.subcategoryLabel}
              onRemove={() =>
                onSelectionChange({
                  parentLabel: selection.parentLabel,
                  subcategoryLabel: null,
                })
              }
              accent
            />
          )}
          <button
            type="button"
            onClick={() => onSelectionChange(EMPTY_CATEGORY_FILTER)}
            className="text-[11px] font-medium text-muted transition-colors hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}
    </section>
  );
}

function CategoryChip({
  label,
  icon: Icon,
  selected,
  active,
  onClick,
  count,
}: {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  const emphasized = active || selected;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={emphasized}
      className={`inline-flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full px-2.5 text-[11px] transition-colors sm:h-10 sm:gap-2 sm:px-3 sm:text-xs ${
        active
          ? "bg-accent text-white shadow-md shadow-accent/30"
          : selected
            ? "bg-accent/15 text-accent ring-1 ring-accent/30"
            : "bg-white/80 text-foreground/75 ring-1 ring-accent/15 hover:bg-accent/10 hover:text-accent hover:ring-accent/25 dark:bg-surface"
      }`}
    >
      <Icon
        className={`size-3.5 shrink-0 sm:size-4 ${
          active ? "text-white" : selected ? "text-accent" : "text-accent/80"
        }`}
        strokeWidth={emphasized ? 2 : 1.75}
        aria-hidden
      />
      <span className={`whitespace-nowrap ${emphasized ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
      {typeof count === "number" && count > 0 ? (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums ${
            active ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
          }`}
        >
          {count > 999 ? "999+" : count}
        </span>
      ) : null}
    </button>
  );
}

function SubcategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-7 shrink-0 snap-start items-center rounded-full px-2.5 text-[10px] font-medium transition-colors sm:h-8 sm:px-3 sm:text-[11px] ${
        active
          ? "bg-accent text-white shadow-sm shadow-accent/20"
          : "bg-accent/[0.06] text-muted hover:bg-accent/10 hover:text-accent"
      }`}
    >
      {label}
    </button>
  );
}

function FilterChip({
  label,
  onRemove,
  accent = false,
}: {
  label: string;
  onRemove: () => void;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex max-w-[140px] items-center gap-0.5 truncate rounded-full px-2 py-0.5 text-[10px] font-medium sm:max-w-none ${
        accent
          ? "bg-accent text-white"
          : "bg-accent/10 text-accent ring-1 ring-accent/15"
      }`}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className={`shrink-0 rounded p-0.5 transition-colors ${
          accent ? "hover:bg-white/20" : "hover:bg-accent/15"
        }`}
      >
        <X className="size-2.5" strokeWidth={2.5} aria-hidden />
      </button>
    </span>
  );
}
