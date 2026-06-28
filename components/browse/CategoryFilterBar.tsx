"use client";

import { useMemo } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { resolveCategoryIcon, ALL_CATEGORIES_ICON } from "@/lib/homeCategoryIcons";

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

  const items = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.localeCompare(b));
    return [
      { key: null as string | null, label: "All categories" },
      ...sorted.map((c) => ({ key: c, label: c })),
    ];
  }, [categories]);

  return (
    <div className="w-full mb-6">
      {/* Responsive circular categories scroll/grid wrapper */}
      <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto md:flex-wrap md:justify-center py-3 px-1 scrollbar-none">
        {items.map(({ key, label }) => {
          const active = key === null ? selected === null : selected === key;
          const icon = key === null ? ALL_CATEGORIES_ICON : resolveCategoryIcon(label);

          // Format labels to match simple display (e.g. "Home & Living" -> "Home & Living")
          let displayLabel = label;
          if (label === "All categories") displayLabel = "All categories";

          return (
            <button
              key={key ?? "all"}
              type="button"
              onClick={() => onSelect(key)}
              className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none cursor-pointer"
            >
              {/* Circle container */}
              <div
                className={`size-14 sm:size-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  active
                    ? "bg-orange-50 border-2 border-orange-500 shadow-sm scale-[1.03]"
                    : "bg-white border border-neutral-200/80 hover:border-neutral-400 shadow-xs hover:shadow-sm"
                }`}
              >
                <MaterialSymbol
                  name={icon}
                  className={`!text-[22px] sm:!text-[24px] transition-colors duration-300 ${
                    active ? "text-orange-600 font-bold" : "text-neutral-500 group-hover:text-neutral-700"
                  }`}
                  filled={active}
                />
              </div>
              
              {/* Text label underneath */}
              <span
                className={`text-[10px] sm:text-xs tracking-tight transition-colors duration-300 max-w-[72px] sm:max-w-[80px] text-center line-clamp-2 ${
                  active ? "text-orange-600 font-bold" : "text-neutral-500 group-hover:text-neutral-800"
                }`}
              >
                {displayLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
