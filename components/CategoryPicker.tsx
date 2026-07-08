"use client";

import { useEffect, useMemo, useState } from "react";
import { groupCategoriesByParent, resolveCategoryParts } from "@/lib/categories";
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
};

export default function CategoryPicker({
  value,
  onChange,
  required,
  className = "",
  idPrefix = "category",
}: Props) {
  const { items } = useCategoryItems();
  const tree = useMemo(() => groupCategoriesByParent(items), [items]);

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

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-parent`} className={formLabelClass}>
          Main category {required ? <span className="text-red-500">*</span> : null}
        </label>
        <div className="relative">
          <select
            id={`${idPrefix}-parent`}
            className={`${formFieldClass} appearance-none pr-10`}
            value={parentSlug}
            required={required}
            onChange={(e) => handleParentChange(e.target.value)}
          >
            <option value="">Select main category</option>
            {tree.map(({ parent }) => (
              <option key={parent.slug} value={parent.slug}>
                {parent.label}
              </option>
            ))}
          </select>
          <MaterialSymbol
            name="expand_more"
            className="pointer-events-none absolute right-3 top-1/2 !text-lg -translate-y-1/2 text-neutral-400"
          />
        </div>
      </div>

      {parentSlug && children.length > 0 ? (
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-sub`} className={formLabelClass}>
            Subcategory {required ? <span className="text-red-500">*</span> : null}
          </label>
          <div className="relative">
            <select
              id={`${idPrefix}-sub`}
              className={`${formFieldClass} appearance-none pr-10`}
              value={subcategoryLabel}
              required={required}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
            >
              <option value="">Select subcategory</option>
              {children.map((child) => (
                <option key={child.slug} value={child.label}>
                  {child.label}
                </option>
              ))}
            </select>
            <MaterialSymbol
              name="expand_more"
              className="pointer-events-none absolute right-3 top-1/2 !text-lg -translate-y-1/2 text-neutral-400"
            />
          </div>
        </div>
      ) : null}

      {parentSlug && activeGroup ? (
        <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-accent shadow-sm">
            <MaterialSymbol
              name={resolveCategoryIcon(activeGroup.parent.label)}
              className="!text-base"
              filled
            />
          </div>
          <div className="min-w-0 text-xs leading-snug text-neutral-700">
            <span className="font-semibold text-neutral-900">{activeGroup.parent.label}</span>
            {subcategoryLabel ? (
              <>
                <span className="mx-1 text-neutral-400">›</span>
                <span className="font-medium text-accent">{subcategoryLabel}</span>
              </>
            ) : children.length > 0 ? (
              <p className="text-[11px] text-neutral-500">Choose a subcategory to be more discoverable</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
