"use client";

import { useEffect, useMemo, useState } from "react";
import { listCategoryItems, type CategoryItem } from "@/lib/api/categories";
import {
  buildCanonicalCategoryItems,
  categoryItemsHaveSubcategories,
  getCategoriesForFilter,
} from "@/lib/categories";

let cachedItems: CategoryItem[] | null = null;
let inflight: Promise<CategoryItem[]> | null = null;

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

export function useCategoryItems() {
  const [items, setItems] = useState<CategoryItem[]>(
    () => cachedItems ?? nestedFallback(),
  );
  const [loading, setLoading] = useState(
    !(cachedItems && categoryItemsHaveSubcategories(cachedItems)),
  );
  const tree = useMemo(() => getCategoriesForFilter(items), [items]);

  useEffect(() => {
    let cancelled = false;
    void loadCategoryItems().then((next) => {
      if (!cancelled) {
        setItems(next);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, tree, loading };
}

export { loadCategoryItems };
