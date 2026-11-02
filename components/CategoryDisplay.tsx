"use client";

import { createElement } from "react";
import { ChevronRight } from "lucide-react";
import { resolveCategoryParts } from "@/lib/categories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { resolveCategoryIcon, resolveCategoryTone } from "@/lib/homeCategoryIcons";

function Icon({ category, className }: { category: string; className: string }) {
  return createElement(resolveCategoryIcon(category), { className, "aria-hidden": true });
}

type Props = {
  label: string | null | undefined;
  variant?: "inline" | "chip" | "detail" | "compact";
  className?: string;
  immersive?: boolean;
};

export default function CategoryDisplay({
  label,
  variant = "inline",
  className = "",
  immersive = false,
}: Props) {
  const { items } = useCategoryItems();
  const { parentLabel, subcategoryLabel } = resolveCategoryParts(label, items);

  if (!parentLabel && !subcategoryLabel) return null;

  const categoryKey = parentLabel ?? subcategoryLabel ?? "";
  const tone = resolveCategoryTone(categoryKey);

  if (variant === "chip") {
    return (
      <span
        className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium sm:text-xs ${
          immersive
            ? "border-white/20 bg-white/10 text-white backdrop-blur-sm"
            : "border-neutral-200 bg-neutral-50 text-neutral-700"
        } ${className}`}
      >
        <Icon category={categoryKey} className="size-3.5 shrink-0" />
        <span className="truncate">
          {parentLabel}
          {subcategoryLabel ? (
            <>
              <span className={immersive ? "text-white/60" : "text-neutral-400"}> › </span>
              {subcategoryLabel}
            </>
          ) : null}
        </span>
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <span className={`inline-flex min-w-0 items-center gap-1 text-[10px] text-muted sm:text-[11px] ${className}`}>
        <Icon category={categoryKey} className="size-3 shrink-0 text-accent sm:size-3.5" />
        <span className="truncate">
          {parentLabel}
          {subcategoryLabel ? ` · ${subcategoryLabel}` : ""}
        </span>
      </span>
    );
  }

  if (variant === "detail") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {parentLabel ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 py-1 pl-1 pr-2.5 text-xs font-semibold text-neutral-700">
            <span className={`grid size-6 place-items-center rounded-full ${tone}`}>
              <Icon category={categoryKey} className="size-3.5" />
            </span>
            {parentLabel}
          </span>
        ) : null}
        {subcategoryLabel ? (
          <>
            <ChevronRight className="size-3.5 text-neutral-300" strokeWidth={2} aria-hidden />
            <span className="text-sm font-semibold text-neutral-900">{subcategoryLabel}</span>
          </>
        ) : null}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={`text-xs sm:text-sm ${
          immersive ? "text-white/95" : "text-neutral-700"
        } ${className}`}
      >
        {parentLabel}
        {subcategoryLabel ? (
          <>
            <span className={immersive ? "text-white/50" : "text-neutral-400"}> › </span>
            <span className={immersive ? "font-semibold text-white" : "font-medium text-neutral-900"}>
              {subcategoryLabel}
            </span>
          </>
        ) : null}
      </span>
    );
  }

  return null;
}
