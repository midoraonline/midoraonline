"use client";

import { useEffect, useMemo, useState } from "react";
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

let cachedItems: CategoryItem[] | null = null;
let inflight: Promise<CategoryItem[]> | null = null;
let cachedCounts: Record<string, number> | null = null;
let countsInflight: Promise<Record<string, number>> | null = null;

function nestedFallback(): CategoryItem[] {
  return buildCanonicalCategoryItems();
}

function normalizeItems(items: CategoryItem[]): CategoryItem[] {
  if (items.length > 0 && categoryItemsHaveSubcategories(items)) {
    return items;
  }
  return nestedFallback();
}

async function loadCategoryItems(): Promise<CategoryItem[]> {
  if (cachedItems && categoryItemsHaveSubcategories(cachedItems)) {
    return cachedItems;
  }
  if (!inflight) {
    inflight = listCategoryItems()
      .then((items) => {
        cachedItems = normalizeItems(items);
        return cachedItems;
      })
      .catch(() => {
        cachedItems = nestedFallback();
        return cachedItems;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

async function loadCategoryCounts(): Promise<Record<string, number>> {
  if (cachedCounts) return cachedCounts;
  if (!countsInflight) {
    countsInflight = fetchCategoryListingCounts()
      .then((counts) => {
        cachedCounts = counts;
        return counts;
      })
      .catch(() => {
        cachedCounts = {};
        return cachedCounts;
      })
      .finally(() => {
        countsInflight = null;
      });
  }
  return countsInflight;
}

export function useCategoryItems() {
  const [items, setItems] = useState<CategoryItem[]>(
    () => cachedItems ?? nestedFallback(),
  );
  const [counts, setCounts] = useState<Record<string, number>>(
    () => cachedCounts ?? {},
  );
  const [loading, setLoading] = useState(
    !(cachedItems && categoryItemsHaveSubcategories(cachedItems)),
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

  useEffect(() => {
    let cancelled = false;
    void loadCategoryItems().then((next) => {
      if (!cancelled) {
        setItems(next);
        setLoading(false);
      }
    });
    void loadCategoryCounts().then((next) => {
      if (!cancelled) setCounts(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, tree, counts, loading };
}

export { loadCategoryItems };
