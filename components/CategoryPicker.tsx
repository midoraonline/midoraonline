"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveCategoryParts } from "@/lib/categories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { ChevronDown } from "lucide-react";
import { resolveCategoryIcon } from "@/lib/homeCategoryIcons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  idPrefix?: string;
  /** Compact mode used inside modals / narrower containers */
  compact?: boolean;
  /** Force a specific top-level category (e.g. "services", "opportunities").
   *  When set, the parent dropdown is hidden and only the subcategory picker shows. */
  lockedParentSlug?: string;
  /** Hide these parent slugs from the parent dropdown (e.g. hide services /
   *  opportunities when the user is posting a product). */
  excludeParentSlugs?: readonly string[];
};

/**
 * Two sequential dropdowns: pick a category, then (if it has children) pick
 * a subcategory. Emits the final leaf label via `onChange` — empty string
 * while the selection is incomplete so parent forms can validate.
 */
export default function CategoryPicker({
  value,
  onChange,
  required,
  className = "",
  idPrefix = "category",
  compact = false,
  lockedParentSlug,
  excludeParentSlugs,
}: Props) {
  const { items, tree, loading } = useCategoryItems();

  const resolved = useMemo(() => resolveCategoryParts(value, items), [value, items]);

  const visibleTree = useMemo(() => {
    if (!excludeParentSlugs || excludeParentSlugs.length === 0) return tree;
    const blocked = new Set(excludeParentSlugs);
    return tree.filter((g) => !blocked.has(g.parent.slug));
  }, [tree, excludeParentSlugs]);

  const [parentSlug, setParentSlug] = useState<string>(lockedParentSlug ?? "");
  const [subcategoryLabel, setSubcategoryLabel] = useState<string>("");

  // Sync from prop when editing an existing value. Do not clear parentSlug
  // when value is "" — that happens right after picking a parent that still
  // needs a subcategory, and wiping parentSlug would collapse the second dropdown.
  useEffect(() => {
    if (!value.trim()) return;
    if (resolved.parentLabel) {
      const parent = tree.find((g) => g.parent.label === resolved.parentLabel);
      if (parent) {
        setParentSlug(parent.parent.slug);
        setSubcategoryLabel(resolved.subcategoryLabel ?? "");
      }
    }
  }, [value, resolved.parentLabel, resolved.subcategoryLabel, tree]);

  // Force parent to locked slug when it changes (e.g. user switched listing kind).
  useEffect(() => {
    if (!lockedParentSlug) return;
    if (parentSlug === lockedParentSlug) return;
    setParentSlug(lockedParentSlug);
    setSubcategoryLabel("");
    const group = tree.find((g) => g.parent.slug === lockedParentSlug);
    if (!group) {
      onChange("");
      return;
    }
    onChange(group.children.length === 0 ? group.parent.label : "");
    // onChange intentionally excluded — treated as a stable callback by the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedParentSlug, tree]);

  const activeGroup = useMemo(
    () => tree.find((g) => g.parent.slug === parentSlug) ?? null,
    [tree, parentSlug],
  );
  const children = activeGroup?.children ?? [];
  const hasChildren = children.length > 0;
  const needsSubcategory = Boolean(parentSlug && hasChildren && !subcategoryLabel);
  const SelectedIcon = activeGroup
    ? resolveCategoryIcon(activeGroup.parent.label)
    : null;

  function handleParentChange(slug: string) {
    setParentSlug(slug);
    setSubcategoryLabel("");
    if (!slug) {
      onChange("");
      return;
    }
    const group = tree.find((g) => g.parent.slug === slug);
    if (!group) {
      onChange("");
      return;
    }
    // Parents without children resolve immediately; otherwise wait for subcategory.
    onChange(group.children.length === 0 ? group.parent.label : "");
  }

  function handleSubcategoryChange(label: string) {
    setSubcategoryLabel(label);
    onChange(label);
  }

  const labelClass = compact
    ? "text-xs font-medium text-foreground"
    : "text-sm font-medium text-foreground";

  const selectClass = "dm-input appearance-none pr-9";

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Parent category dropdown — hidden when the parent is locked by kind */}
      {!lockedParentSlug ? (
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-parent`} className={labelClass}>
            Category{" "}
            {required ? (
              <span className="text-[color:var(--error)]">*</span>
            ) : null}
          </label>
          <div className="relative">
            <select
              id={`${idPrefix}-parent`}
              className={selectClass}
              value={parentSlug}
              onChange={(e) => handleParentChange(e.target.value)}
              disabled={loading}
            >
              <option value="">
                {loading ? "Loading categories…" : "Select a category"}
              </option>
              {visibleTree.map(({ parent }) => (
                <option key={parent.slug} value={parent.slug}>
                  {parent.label}
                </option>
              ))}
            </select>
            {loading ? (
              <span
                className="pointer-events-none absolute right-3 top-1/2 block size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-border"
                style={{ borderTopColor: "var(--accent)" }}
                aria-hidden="true"
              />
            ) : (
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 size-[18px] -translate-y-1/2 text-muted"
                strokeWidth={1.75}
                aria-hidden
              />
            )}
          </div>
        </div>
      ) : null}

      {/* Subcategory dropdown — appears only when the parent has children */}
      {parentSlug && hasChildren ? (
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-child`} className={labelClass}>
            Subcategory{" "}
            {required ? (
              <span className="text-[color:var(--error)]">*</span>
            ) : null}
          </label>
          <div className="relative">
            <select
              id={`${idPrefix}-child`}
              className={selectClass}
              value={subcategoryLabel}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              required={required}
              aria-invalid={needsSubcategory}
            >
              <option value="">Select a subcategory</option>
              {children.map((child) => (
                <option key={child.slug} value={child.label}>
                  {child.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 size-[18px] -translate-y-1/2 text-muted"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
          {needsSubcategory ? (
            <p className="text-xs text-[color:var(--warning)]">
              Pick a subcategory to complete the category.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Selection summary */}
      {parentSlug && activeGroup ? (
        <div
          className={
            "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs leading-snug " +
            (needsSubcategory
              ? "dm-pill--warning border-[color:color-mix(in_oklab,var(--warning)_25%,transparent)]"
              : "border-accent/20 bg-accent/5")
          }
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface shadow-sm">
            {SelectedIcon ? (
              <SelectedIcon
                className={`size-3.5 ${needsSubcategory ? "text-[color:var(--warning)]" : "text-accent"}`}
                strokeWidth={2}
                aria-hidden
              />
            ) : null}
          </span>
          <div className="min-w-0">
            <span className="font-semibold text-foreground">
              {activeGroup.parent.label}
            </span>
            {subcategoryLabel ? (
              <>
                <span className="mx-1 text-muted">›</span>
                <span className="font-medium text-accent">{subcategoryLabel}</span>
              </>
            ) : hasChildren ? (
              <span
                className="ml-1 text-[color:var(--warning)]"
                style={{ opacity: 0.9 }}
              >
                — subcategory required
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
