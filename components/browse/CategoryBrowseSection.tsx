"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
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
  const { tree } = useCategoryItems();

  const activeGroup = useMemo(
    () => (selection.parentLabel ? tree.find((g) => g.parent.label === selection.parentLabel) ?? null : null),
    [selection.parentLabel, tree],
  );

  function isParentActive(label: string | null) {
    return label === null
      ? !selection.parentLabel
      : selection.parentLabel === label && !selection.subcategoryLabel;
  }

  function isParentSelected(label: string | null) {
    return label === null ? !selection.parentLabel : selection.parentLabel === label;
  }

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm sm:mb-6 sm:rounded-2xl">
      {showHeader && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-primary px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <div className="min-w-0">
            <h2 className="font-display text-xs font-semibold tracking-tight text-white sm:text-sm">
              Shop by category
            </h2>
            <p className="hidden text-[10px] text-white/65 sm:mt-0.5 sm:block sm:text-[11px]">
              Pick a category, then refine with subcategories
            </p>
          </div>
          {browseAllHref && (
            <Link
              href={browseAllHref}
              className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-accent-hover sm:px-3 sm:py-1.5 sm:text-[11px]"
            >
              Browse all
            </Link>
          )}
        </div>
      )}

      {/* Parent category orbs */}
      <div className="relative bg-surface px-2 py-3 sm:px-4 sm:py-4">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-surface to-transparent sm:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-surface to-transparent sm:hidden"
          aria-hidden
        />
        <div className="flex items-start gap-2 overflow-x-auto pb-0.5 scrollbar-none snap-x snap-mandatory sm:gap-3 md:flex-wrap md:justify-center md:overflow-visible">
          <CategoryOrb
            label="All"
            icon={ALL_CATEGORIES_ICON}
            selected={isParentSelected(null)}
            active={isParentActive(null)}
            onClick={() => onSelectionChange(EMPTY_CATEGORY_FILTER)}
          />

          {tree.map(({ parent }) => (
            <CategoryOrb
              key={parent.slug}
              label={parent.label}
              icon={resolveCategoryIcon(parent.label)}
              selected={isParentSelected(parent.label)}
              active={isParentActive(parent.label)}
              onClick={() =>
                onSelectionChange({ parentLabel: parent.label, subcategoryLabel: null })
              }
            />
          ))}
        </div>
      </div>

      {/* Subcategory chips — animated expand */}
      <AnimatePresence initial={false}>
        {activeGroup && activeGroup.children.length > 0 && (
          <motion.div
            key={activeGroup.parent.slug}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden border-t border-border"
          >
            <div className="bg-surface-subtle px-3 py-2.5 sm:px-4 sm:py-3">
              {/* Subcategory section header */}
              <div className="mb-2 flex items-center gap-1.5 sm:mb-2.5 sm:gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-primary sm:size-7 sm:rounded-lg">
                  <MaterialSymbol
                    name={resolveCategoryIcon(activeGroup.parent.label)}
                    className="!text-[13px] text-accent sm:!text-[15px]"
                    filled
                  />
                </span>
                <p className="text-[11px] font-semibold text-primary sm:text-xs">
                  {activeGroup.parent.label}
                </p>
                <span className="ml-auto text-[10px] text-muted">
                  {activeGroup.children.length} subcategories
                </span>
              </div>

              {/* Subcategory chip list */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:gap-2 sm:overflow-visible">
                {/* "All [Parent]" chip */}
                <SubcategoryChip
                  label={`All ${activeGroup.parent.label}`}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter chips */}
      {isCategoryFilterActive(selection) && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border bg-surface-subtle/60 px-3 py-2 sm:gap-2 sm:px-4 sm:py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Filtering
          </span>

          {selection.parentLabel && (
            <FilterChip
              label={selection.parentLabel}
              onRemove={() => onSelectionChange(EMPTY_CATEGORY_FILTER)}
              variant="parent"
            />
          )}

          {selection.subcategoryLabel && (
            <FilterChip
              label={selection.subcategoryLabel}
              onRemove={() =>
                onSelectionChange({ parentLabel: selection.parentLabel, subcategoryLabel: null })
              }
              variant="sub"
            />
          )}

          <button
            type="button"
            onClick={() => onSelectionChange(EMPTY_CATEGORY_FILTER)}
            className="ml-auto text-[11px] font-semibold text-accent transition-colors hover:text-accent-hover sm:text-xs"
          >
            Clear all
          </button>
        </div>
      )}
    </section>
  );
}

// --- Sub-components ---

function CategoryOrb({
  label,
  icon,
  selected,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  selected: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-[60px] shrink-0 snap-start flex-col items-center gap-1 sm:w-[68px] sm:gap-1.5 md:w-[72px]"
    >
      <div
        className={`flex size-11 items-center justify-center rounded-xl transition-all duration-200 sm:size-12 sm:rounded-2xl ${
          active
            ? "bg-primary shadow-md shadow-primary/20 ring-2 ring-accent ring-offset-1 ring-offset-surface"
            : selected
              ? "bg-primary/5 ring-2 ring-accent/60 ring-offset-1 ring-offset-surface"
              : "border border-border bg-surface group-hover:border-border-strong group-hover:shadow-sm"
        }`}
      >
        <MaterialSymbol
          name={icon}
          className={`!text-[18px] transition-colors sm:!text-xl ${
            active
              ? "text-accent"
              : selected
                ? "text-accent/70"
                : "text-muted group-hover:text-foreground"
          }`}
          filled={active || selected}
        />
      </div>
      <span
        className={`max-w-[60px] line-clamp-2 text-center text-[9px] leading-tight sm:max-w-[68px] sm:text-[10px] md:max-w-[72px] ${
          active
            ? "font-bold text-primary"
            : selected
              ? "font-semibold text-accent"
              : "font-medium text-muted group-hover:text-foreground"
        }`}
      >
        {label}
      </span>
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
      className={`inline-flex h-8 shrink-0 snap-start items-center rounded-full border px-3 text-[11px] font-semibold transition-all sm:h-9 sm:px-3.5 sm:text-xs ${
        active
          ? "border-primary bg-primary text-white shadow-sm"
          : "border-border bg-surface text-foreground/75 hover:border-accent/40 hover:bg-accent/[0.06] hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function FilterChip({
  label,
  onRemove,
  variant,
}: {
  label: string;
  onRemove: () => void;
  variant: "parent" | "sub";
}) {
  const isSub = variant === "sub";
  return (
    <span
      className={`inline-flex max-w-[140px] items-center gap-0.5 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold sm:max-w-none sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[11px] ${
        isSub
          ? "bg-accent text-white"
          : "border border-border bg-surface text-primary"
      }`}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className={`shrink-0 rounded-full p-0.5 transition-colors ${
          isSub ? "hover:bg-white/20" : "hover:bg-surface-subtle"
        }`}
      >
        <MaterialSymbol name="close" className="!text-[12px] sm:!text-[14px]" />
      </button>
    </span>
  );
}
