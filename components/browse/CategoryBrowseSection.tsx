"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import {
  ALL_CATEGORIES_ICON,
  resolveCategoryIcon,
} from "@/lib/homeCategoryIcons";
import { groupCategoriesByParent } from "@/lib/categories";
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
  const { items } = useCategoryItems();
  const tree = useMemo(() => groupCategoriesByParent(items), [items]);

  const activeParentSlug = useMemo(() => {
    if (!selection.parentLabel) return null;
    return tree.find((g) => g.parent.label === selection.parentLabel)?.parent.slug ?? null;
  }, [selection.parentLabel, tree]);

  const activeGroup = useMemo(
    () => tree.find((g) => g.parent.slug === activeParentSlug) ?? null,
    [tree, activeParentSlug],
  );

  const parentActive = (label: string | null) =>
    label === null
      ? !selection.parentLabel
      : selection.parentLabel === label && !selection.subcategoryLabel;

  const parentSelected = (label: string | null) =>
    label === null ? !selection.parentLabel : selection.parentLabel === label;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:mb-8">
      {showHeader ? (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-primary px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold tracking-tight text-white sm:text-base">
              Shop by category
            </h2>
            <p className="mt-0.5 text-[11px] text-white/65 sm:text-xs">
              Choose a category, then refine with subcategories
            </p>
          </div>
          {browseAllHref ? (
            <Link
              href={browseAllHref}
              className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-accent-hover sm:text-xs"
            >
              Browse all
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Parent categories */}
      <div className="relative bg-surface px-3 py-5 sm:px-5">
        <div className="flex items-start gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory sm:gap-4 md:flex-wrap md:justify-center md:overflow-visible">
          <CategoryOrb
            label="All"
            icon={ALL_CATEGORIES_ICON}
            selected={parentSelected(null)}
            active={parentActive(null)}
            onClick={() => onSelectionChange(EMPTY_CATEGORY_FILTER)}
          />

          {tree.map(({ parent }) => (
            <CategoryOrb
              key={parent.slug}
              label={parent.label}
              icon={resolveCategoryIcon(parent.label)}
              selected={parentSelected(parent.label)}
              active={parentSelected(parent.label) && !selection.subcategoryLabel}
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

      {/* Subcategories */}
      <AnimatePresence initial={false}>
        {activeGroup && activeGroup.children.length > 0 ? (
          <motion.div
            key={activeGroup.parent.slug}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-border"
          >
            <div className="bg-surface-subtle px-4 py-4 sm:px-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-accent">
                  <MaterialSymbol
                    name={resolveCategoryIcon(activeGroup.parent.label)}
                    className="!text-[15px] text-accent"
                    filled
                  />
                </span>
                <p className="text-xs font-semibold text-primary sm:text-sm">
                  {activeGroup.parent.label}
                </p>
                <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none snap-x snap-mandatory">
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
        ) : null}
      </AnimatePresence>

      {/* Active filters */}
      {isCategoryFilterActive(selection) ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-subtle/60 px-4 py-3 sm:px-5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Filtering
          </span>
          {selection.parentLabel ? (
            <FilterChip
              label={selection.parentLabel}
              onRemove={() =>
                onSelectionChange({
                  parentLabel: null,
                  subcategoryLabel: null,
                })
              }
              variant="parent"
            />
          ) : null}
          {selection.subcategoryLabel ? (
            <FilterChip
              label={selection.subcategoryLabel}
              onRemove={() =>
                onSelectionChange({
                  parentLabel: selection.parentLabel,
                  subcategoryLabel: null,
                })
              }
              variant="sub"
            />
          ) : null}
          <button
            type="button"
            onClick={() => onSelectionChange(EMPTY_CATEGORY_FILTER)}
            className="ml-auto text-xs font-semibold text-accent transition-colors hover:text-accent-hover"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </section>
  );
}

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
      className="group flex w-[76px] shrink-0 snap-start flex-col items-center gap-2 sm:w-[84px]"
    >
      <div
        className={`flex size-[3.75rem] items-center justify-center rounded-2xl transition-all duration-200 sm:size-16 ${
          active
            ? "bg-primary shadow-md shadow-primary/20 ring-2 ring-accent ring-offset-2 ring-offset-surface"
            : selected
              ? "bg-primary/5 ring-2 ring-accent/70 ring-offset-2 ring-offset-surface"
              : "border border-border bg-surface group-hover:border-border-strong group-hover:shadow-sm"
        }`}
      >
        <MaterialSymbol
          name={icon}
          className={`!text-[22px] sm:!text-2xl transition-colors ${
            active
              ? "text-accent"
              : selected
                ? "text-primary"
                : "text-muted group-hover:text-foreground"
          }`}
          filled={active || selected}
        />
      </div>
      <span
        className={`max-w-[76px] line-clamp-2 text-center text-[10px] leading-tight sm:max-w-[84px] sm:text-[11px] ${
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
      className={`inline-flex h-10 shrink-0 snap-start items-center rounded-full border px-4 text-xs font-semibold transition-all sm:h-11 sm:text-sm ${
        active
          ? "border-primary bg-primary text-white shadow-sm"
          : "border-border bg-surface text-foreground/80 hover:border-accent/40 hover:bg-accent/[0.06] hover:text-primary"
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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        isSub
          ? "bg-accent text-white"
          : "border border-border bg-surface text-primary"
      }`}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className={`rounded-full p-0.5 transition-colors ${
          isSub ? "hover:bg-white/20" : "hover:bg-surface-subtle"
        }`}
        aria-label={`Remove ${label} filter`}
      >
        <MaterialSymbol name="close" className="!text-[14px]" />
      </button>
    </span>
  );
}
