"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import {
  ALL_CATEGORIES_ICON,
  resolveCategoryIcon,
} from "@/lib/homeCategoryIcons";
import {
  type CategoryFilterSelection,
  EMPTY_CATEGORY_FILTER,
} from "@/lib/browseCategories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";

type Props = {
  selection: CategoryFilterSelection;
  onSelectionChange: (next: CategoryFilterSelection) => void;
  className?: string;
};

export default function CategoryBrowseSection({
  selection,
  onSelectionChange,
  className = "",
}: Props) {
  const { tree } = useCategoryItems();

  function isParentSelected(label: string | null) {
    return label === null ? !selection.parentLabel : selection.parentLabel === label;
  }

  // Order categories so the selected category is always first
  const sortedCategories = useMemo(() => {
    const allItem = {
      label: "All",
      slug: "all",
      icon: ALL_CATEGORIES_ICON,
      isAll: true,
    };

    const regularItems = tree.map(({ parent }) => ({
      label: parent.label,
      slug: parent.slug,
      icon: resolveCategoryIcon(parent.label),
      isAll: false,
    }));

    const items = [allItem, ...regularItems];

    if (!selection.parentLabel) {
      return items;
    }

    const selectedIndex = items.findIndex((i) => i.label === selection.parentLabel);
    if (selectedIndex <= 0) return items;

    const selectedItem = items[selectedIndex];
    const remaining = items.filter((_, idx) => idx !== selectedIndex);
    return [selectedItem, ...remaining];
  }, [tree, selection.parentLabel]);

  return (
    <div className={`flex flex-col items-start gap-3.5 py-2 px-2.5 sm:px-4 scrollbar-none max-h-[80vh] overflow-y-auto ${className}`}>
      {/* Vertical Strip of Floating Category Icons with Drop Shadows & Titles on Desktop */}
      <motion.div layout className="flex flex-col items-start gap-3.5 w-full">
        <AnimatePresence mode="popLayout">
          {sortedCategories.map((cat) => {
            const isSelected = cat.isAll
              ? isParentSelected(null)
              : isParentSelected(cat.label);
            return (
              <motion.div
                key={cat.slug}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="w-full"
              >
                <FloatingCategoryIcon
                  label={cat.label}
                  icon={cat.icon}
                  selected={isSelected}
                  onClick={() =>
                    cat.isAll
                      ? onSelectionChange(EMPTY_CATEGORY_FILTER)
                      : onSelectionChange({ parentLabel: cat.label, subcategoryLabel: null })
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** Horizontal Sub-Category Strip displayed in main content area - Sticky on top during scroll */
export function HorizontalSubcategoryStrip({
  selection,
  onSelectionChange,
  className = "",
}: Props) {
  const { tree } = useCategoryItems();

  const activeGroup = useMemo(
    () => (selection.parentLabel ? tree.find((g) => g.parent.label === selection.parentLabel) ?? null : null),
    [selection.parentLabel, tree],
  );

  // Order subcategories so selected subcategory is always first
  const sortedSubcategories = useMemo(() => {
    if (!activeGroup) return [];

    const allItem = {
      label: `All`,
      slug: `all-${activeGroup.parent.slug}`,
      icon: resolveCategoryIcon(activeGroup.parent.label),
      isAll: true,
      subLabel: null as string | null,
    };

    const childrenItems = activeGroup.children.map((child) => ({
      label: child.label,
      slug: child.slug,
      icon: resolveCategoryIcon(child.label),
      isAll: false,
      subLabel: child.label,
    }));

    const items = [allItem, ...childrenItems];

    if (!selection.subcategoryLabel) return items;

    const selectedIndex = items.findIndex((i) => i.subLabel === selection.subcategoryLabel);
    if (selectedIndex <= 0) return items;

    const selectedItem = items[selectedIndex];
    const remaining = items.filter((_, idx) => idx !== selectedIndex);
    return [selectedItem, ...remaining];
  }, [activeGroup, selection.subcategoryLabel]);

  if (!activeGroup || activeGroup.children.length === 0) return null;

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={activeGroup.parent.slug}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`sticky top-[4.25rem] z-30 w-full overflow-visible py-2.5 backdrop-blur-md bg-surface/80 rounded-2xl shadow-sm px-4 sm:px-6 lg:px-8 ${className}`}
      >
        <div className="flex items-center gap-4 overflow-x-auto py-1 px-1 sm:px-3 scrollbar-none snap-x snap-mandatory">
          {/* Floating Subcategory Icons with Re-ordering Layout Animation */}
          <motion.div layout className="flex flex-1 items-center gap-4 sm:gap-6 overflow-x-auto md:overflow-visible md:justify-between scrollbar-none">
            <AnimatePresence mode="popLayout">
              {sortedSubcategories.map((sub) => {
                const isSelected = sub.isAll
                  ? selection.parentLabel === activeGroup.parent.label && !selection.subcategoryLabel
                  : selection.subcategoryLabel === sub.subLabel;
                return (
                  <motion.div
                    key={sub.slug}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="shrink-0 md:shrink"
                  >
                    <FloatingSubcategoryIcon
                      label={sub.label}
                      icon={sub.icon}
                      selected={isSelected}
                      onClick={() =>
                        onSelectionChange({
                          parentLabel: activeGroup.parent.label,
                          subcategoryLabel: sub.isAll ? null : sub.subLabel,
                        })
                      }
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// --- Floating Icon Button with Drop Shadow & Desktop Label ---

function FloatingCategoryIcon({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative group flex items-center gap-2.5 w-full">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
          selected
            ? "bg-accent text-white shadow-lg shadow-accent/40 scale-110 ring-2 ring-accent/30"
            : "bg-surface text-foreground/80 border border-border/60 shadow-md shadow-black/10 hover:shadow-lg hover:shadow-accent/20 hover:border-accent/40 hover:text-accent hover:scale-105"
        }`}
      >
        <MaterialSymbol
          name={icon}
          className="!text-xl sm:!text-2xl transition-transform"
          filled={selected}
        />
      </button>

      {/* Category Name beside icon on Desktop */}
      <span
        onClick={onClick}
        className={`hidden lg:block text-xs font-semibold tracking-tight transition-colors cursor-pointer whitespace-nowrap ${
          selected ? "text-accent font-bold" : "text-foreground/80 hover:text-accent"
        }`}
      >
        {label}
      </span>

      {/* Floating Tooltip Label on Mobile/Tablet */}
      <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 lg:hidden hidden group-hover:block z-50 whitespace-nowrap rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg shadow-black/20 pointer-events-none">
        {label}
      </span>
    </div>
  );
}

// --- Floating Subcategory Icon Button ---

function FloatingSubcategoryIcon({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative group flex flex-col items-center md:flex-row md:gap-2 shrink-0 snap-start">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
          selected
            ? "bg-accent text-white shadow-lg shadow-accent/40 scale-105 ring-2 ring-accent/30"
            : "bg-surface text-foreground/80 border border-border/60 shadow-md shadow-black/10 hover:shadow-lg hover:shadow-accent/20 hover:border-accent/40 hover:text-accent hover:scale-105"
        }`}
      >
        <MaterialSymbol
          name={icon}
          className="!text-xl sm:!text-2xl transition-transform"
          filled={selected}
        />
      </button>

      {/* Minimal label under icon on mobile, full label beside icon on desktop */}
      <span
        className={`mt-1 md:mt-0 text-center md:text-left text-[10px] sm:text-xs tracking-tight transition-colors whitespace-nowrap max-w-[56px] md:max-w-none truncate ${
          selected ? "font-bold text-accent" : "font-medium text-foreground/80 group-hover:text-accent"
        }`}
      >
        {label}
      </span>

      {/* Full Floating Tooltip Label on hover for mobile view */}
      <span className="absolute top-full mt-5 md:hidden hidden group-hover:block z-50 whitespace-nowrap rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg shadow-black/20 pointer-events-none">
        {label}
      </span>
    </div>
  );
}






