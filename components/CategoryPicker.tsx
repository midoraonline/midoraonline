"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveCategoryParts } from "@/lib/categories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { resolveCategoryIcon } from "@/lib/homeCategoryIcons";
import { formFieldClass, formLabelClass } from "@/components/FormModal";

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  idPrefix?: string;
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
  const { items, tree } = useCategoryItems();

  const resolved = useMemo(() => resolveCategoryParts(value, items), [value, items]);

  const [parentSlug, setParentSlug] = useState<string>("");
  const [subcategoryLabel, setSubcategoryLabel] = useState<string>("");

  useEffect(() => {
    if (!value.trim()) {
      setParentSlug("");
      setSubcategoryLabel("");
      return;
    }
    if (resolved.subcategoryLabel && resolved.parentLabel) {
      const parent = tree.find((g) => g.parent.label === resolved.parentLabel);
      setParentSlug(parent?.parent.slug ?? "");
      setSubcategoryLabel(resolved.subcategoryLabel);
      return;
    }
    if (resolved.parentLabel) {
      const parent = tree.find((g) => g.parent.label === resolved.parentLabel);
      setParentSlug(parent?.parent.slug ?? "");
      setSubcategoryLabel("");
    }
  }, [value, resolved.parentLabel, resolved.subcategoryLabel, tree]);

  const activeGroup = tree.find((g) => g.parent.slug === parentSlug);
  const children = activeGroup?.children ?? [];

  function handleParentChange(slug: string) {
    setParentSlug(slug);
    setSubcategoryLabel("");
    const group = tree.find((g) => g.parent.slug === slug);
    if (!group) {
      onChange("");
      return;
    }
    if (group.children.length === 0) {
      onChange(group.parent.label);
    } else {
      onChange("");
    }
  }

  function handleSubcategoryChange(label: string) {
    setSubcategoryLabel(label);
    onChange(label);
  }

  const labelClass = compact ? "text-[11px] font-semibold text-neutral-700" : formLabelClass;
  const fieldClass = compact
    ? "h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-xs text-neutral-900 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 appearance-none pr-9"
    : `${formFieldClass} appearance-none pr-10`;

  return (
    <div className={`space-y-2.5 sm:space-y-3 ${className}`}>
      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <div className="space-y-1">
          <label htmlFor={`${idPrefix}-parent`} className={labelClass}>
            Category {required ? <span className="text-red-500">*</span> : null}
          </label>
          <div className="relative">
            <select
              id={`${idPrefix}-parent`}
              className={fieldClass}
              value={parentSlug}
              required={required}
              onChange={(e) => handleParentChange(e.target.value)}
            >
              <option value="">Select category</option>
              {tree.map(({ parent }) => (
                <option key={parent.slug} value={parent.slug}>
                  {parent.label}
                </option>
              ))}
            </select>
            <MaterialSymbol
              name="expand_more"
              className="pointer-events-none absolute right-2.5 top-1/2 !text-base -translate-y-1/2 text-neutral-400"
            />
          </div>
        </div>

        {parentSlug && children.length > 0 ? (
          <div className="space-y-1 sm:col-span-2">
            <label className={labelClass}>
              Subcategory {required ? <span className="text-red-500">*</span> : null}
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {children.map((child) => {
                const active = subcategoryLabel === child.label;
                return (
                  <button
                    key={child.slug}
                    type="button"
                    onClick={() => handleSubcategoryChange(child.label)}
                    className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all sm:px-3 sm:py-1.5 sm:text-xs ${
                      active
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
                    }`}
                  >
                    <span className="truncate">{child.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {parentSlug && activeGroup ? (
        <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface text-accent shadow-sm sm:size-8 sm:rounded-lg">
            <MaterialSymbol
              name={resolveCategoryIcon(activeGroup.parent.label)}
              className="!text-sm sm:!text-base"
              filled
            />
          </div>
          <div className="min-w-0 text-[11px] leading-snug text-neutral-700 sm:text-xs">
            <span className="font-semibold text-neutral-900">{activeGroup.parent.label}</span>
            {subcategoryLabel ? (
              <>
                <span className="mx-1 text-neutral-400">›</span>
                <span className="font-medium text-accent">{subcategoryLabel}</span>
              </>
            ) : children.length > 0 ? (
              <p className="text-[10px] text-neutral-500 sm:text-[11px]">
                Tap a subcategory above
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
