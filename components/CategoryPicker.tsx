"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveCategoryParts } from "@/lib/categories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { resolveCategoryIcon } from "@/lib/homeCategoryIcons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  idPrefix?: string;
  /** Compact mode used inside modals / narrower containers */
  compact?: boolean;
};

export default function CategoryPicker({
  value,
  onChange,
  required,
  className = "",
  idPrefix = "category",
  compact = false,
}: Props) {
  const { items, tree, loading } = useCategoryItems();

  const resolved = useMemo(() => resolveCategoryParts(value, items), [value, items]);

  const [parentSlug, setParentSlug] = useState<string>("");
  const [subcategoryLabel, setSubcategoryLabel] = useState<string>("");

  // Sync internal state from the incoming `value` prop (handles editing an existing record)
  useEffect(() => {
    if (!value.trim()) {
      setParentSlug("");
      setSubcategoryLabel("");
      return;
    }
    if (resolved.parentLabel) {
      const parent = tree.find((g) => g.parent.label === resolved.parentLabel);
      if (parent) {
        setParentSlug(parent.parent.slug);
        setSubcategoryLabel(resolved.subcategoryLabel ?? "");
        return;
      }
    }
  }, [value, resolved.parentLabel, resolved.subcategoryLabel, tree]);

  const activeGroup = useMemo(
    () => tree.find((g) => g.parent.slug === parentSlug) ?? null,
    [tree, parentSlug],
  );
  const children = activeGroup?.children ?? [];
  const hasChildren = children.length > 0;

  function handleParentChange(slug: string) {
    setParentSlug(slug);
    setSubcategoryLabel("");
    const group = tree.find((g) => g.parent.slug === slug);
    if (!group) {
      onChange("");
      return;
    }
    // If this parent has no subcategories, the parent label itself is the final value
    onChange(group.children.length === 0 ? group.parent.label : "");
  }

  function handleSubcategoryClick(label: string) {
    if (subcategoryLabel === label) {
      // Clicking the active chip deselects it → fall back to parent-only
      setSubcategoryLabel("");
      onChange(activeGroup?.parent.label ?? "");
    } else {
      setSubcategoryLabel(label);
      onChange(label);
    }
  }

  const labelClass = compact
    ? "text-[11px] font-semibold text-neutral-700"
    : "text-xs font-semibold text-neutral-800";

  const selectClass = compact
    ? "h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 pr-9 text-xs text-neutral-900 appearance-none focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
    : "h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 pr-10 text-sm text-neutral-900 appearance-none focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60";

  // The subcategory is required when the parent has children but none is chosen yet.
  // We use a hidden input with `required` to let the browser catch this, rather than
  // putting `required` on the select (which causes false positives when the value is
  // intentionally "" while waiting for a subcategory pick).
  const needsSubcategory = parentSlug && hasChildren && !subcategoryLabel;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Step 1: parent category ── */}
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-parent`} className={labelClass}>
          Category {required && <span className="text-red-500 ml-0.5">*</span>}
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
            {tree.map(({ parent }) => (
              <option key={parent.slug} value={parent.slug}>
                {parent.label}
              </option>
            ))}
          </select>

          {loading ? (
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <span className="block size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-orange-500" />
            </div>
          ) : (
            <MaterialSymbol
              name="expand_more"
              className="pointer-events-none absolute right-2.5 top-1/2 !text-[18px] -translate-y-1/2 text-neutral-400"
            />
          )}
        </div>
      </div>

      {/* ── Step 2: subcategory chips (only when parent has children) ── */}
      {parentSlug && hasChildren && (
        <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center gap-2">
            <span className={labelClass}>Subcategory</span>
            {needsSubcategory && (
              <span className="text-[10px] font-semibold text-orange-600">
                ← pick one to continue
              </span>
            )}
            {subcategoryLabel && (
              <button
                type="button"
                onClick={() => handleSubcategoryClick(subcategoryLabel)}
                className="ml-auto text-[10px] font-semibold text-neutral-500 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {children.map((child) => {
              const active = subcategoryLabel === child.label;
              return (
                <button
                  key={child.slug}
                  type="button"
                  onClick={() => handleSubcategoryClick(child.label)}
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all sm:text-xs ${
                    active
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
                  }`}
                >
                  {child.label}
                </button>
              );
            })}
          </div>

          {/* Hidden input so browser/form validation fires when subcategory is required but missing */}
          {required && (
            <input
              aria-hidden
              tabIndex={-1}
              style={{ opacity: 0, position: "absolute", height: 0, width: 0 }}
              value={subcategoryLabel}
              required
              readOnly
            />
          )}
        </div>
      )}

      {/* ── Current selection breadcrumb ── */}
      {parentSlug && activeGroup && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] leading-snug ${
            needsSubcategory
              ? "border-orange-200 bg-orange-50"
              : "border-accent/20 bg-accent/5"
          }`}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
            <MaterialSymbol
              name={resolveCategoryIcon(activeGroup.parent.label)}
              className={`!text-sm ${needsSubcategory ? "text-orange-500" : "text-accent"}`}
              filled
            />
          </span>
          <div className="min-w-0">
            <span className="font-semibold text-neutral-900">{activeGroup.parent.label}</span>
            {subcategoryLabel ? (
              <>
                <span className="mx-1 text-neutral-400">›</span>
                <span className="font-medium text-accent">{subcategoryLabel}</span>
              </>
            ) : hasChildren ? (
              <p className="text-[10px] text-orange-600">
                Select a subcategory above to complete the category
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
