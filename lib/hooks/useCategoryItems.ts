"use client";

import { useEffect, useMemo, useState } from "react";
import { listCategoryItems, type CategoryItem } from "@/lib/api/categories";
import { CANONICAL_CATEGORY_LABELS, getCategoriesForFilter } from "@/lib/categories";

let cachedItems: CategoryItem[] | null = null;
let inflight: Promise<CategoryItem[]> | null = null;

function fallbackItems(): CategoryItem[] {
  return CANONICAL_CATEGORY_LABELS.map((label, i) => ({
    slug: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label,
    sort_order: i + 1,
    parent_slug: null,
  }));
}

async function loadCategoryItems(): Promise<CategoryItem[]> {
  if (cachedItems) return cachedItems;
  if (!inflight) {
    inflight = listCategoryItems()
      .then((items) => {
        cachedItems = items.length > 0 ? items : fallbackItems();
        return cachedItems;
      })
      .catch(() => {
        cachedItems = fallbackItems();
        return cachedItems;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useCategoryItems() {
  const [items, setItems] = useState<CategoryItem[]>(cachedItems ?? fallbackItems());
  const [loading, setLoading] = useState(!cachedItems);
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
