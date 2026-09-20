"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
  fetchCategoryListingCounts,
  listCategoryItems,
  type CategoryItem,
} from "@/lib/api/categories";
import {
  buildCanonicalCategoryItems,
  categoryItemsHaveSubcategories,
  getCategoriesForFilter,
} from "@/lib/categories";

function nestedFallback(): CategoryItem[] {
  return buildCanonicalCategoryItems();
}

export function useCategoryItems() {
  const { data: items = nestedFallback(), isLoading } = useSWR(
    "categories:items",
    listCategoryItems,
    {
      fallbackData: nestedFallback(),
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );
  const { data: counts = {} } = useSWR(
    "categories:counts",
    fetchCategoryListingCounts,
    {
      fallbackData: {},
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );
  const tree = useMemo(() => {
    const base = getCategoriesForFilter(items);
    const hasCounts = Object.keys(counts).length > 0;
    if (!hasCounts) return base;
    return [...base].sort((a, b) => {
      const ca = counts[a.parent.label] ?? 0;
      const cb = counts[b.parent.label] ?? 0;
      if (cb !== ca) return cb - ca;
      return a.parent.sort_order - b.parent.sort_order;
    });
  }, [items, counts]);

  return {
    items,
    tree,
    counts,
    loading: isLoading && !categoryItemsHaveSubcategories(items),
  };
}
