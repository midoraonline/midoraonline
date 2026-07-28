"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShopCard from "@/components/shopcard";
import type { Shop } from "@/lib/api/shops";
import { SHOPS_PAGE_SIZE } from "@/lib/api/shops";
import { browseShopGridClass, shopMatchesCategoryFilter, type CategoryFilterSelection } from "@/lib/browseCategories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { apiShops } from "@/lib/api";

function locationDisplay(loc: unknown): string {
  if (typeof loc === "string") return loc;
  if (loc && typeof loc === "object" && "display" in loc)
    return String((loc as { display?: string }).display ?? "Online");
  return "Online";
}

function mergeShop(list: Shop[], next: Shop): Shop[] {
  const idx = list.findIndex((s) => s.id === next.id);
  if (idx === -1) return [next, ...list];
  const copy = list.slice();
  copy[idx] = { ...copy[idx], ...next };
  return copy;
}

function removeShop(list: Shop[], id: string): Shop[] {
  return list.filter((s) => s.id !== id);
}

function matchesShopSearch(shop: Shop, q: string, productCats?: string[]): boolean {
  const qq = q.trim().toLowerCase();
  if (!qq) return true;
  const inProductCats = productCats?.some((c) => c.toLowerCase().includes(qq)) ?? false;
  return (
    shop.name.toLowerCase().includes(qq) ||
    (shop.description ?? "").toLowerCase().includes(qq) ||
    (shop.category ?? "").toLowerCase().includes(qq) ||
    locationDisplay(shop.location).toLowerCase().includes(qq) ||
    inProductCats
  );
}

export default function ShopListRealtime({
  initialShops,
  initialHasMore = false,
  initialTotal,
  shopProductCategories: initialCategories,
  categoryFilter = { parentLabel: null, subcategoryLabel: null },
  searchQuery = "",
  gridClassName,
}: {
  initialShops: Shop[];
  initialHasMore?: boolean;
  initialTotal?: number | null;
  shopProductCategories: Record<string, string[]>;
  categoryFilter?: CategoryFilterSelection;
  searchQuery?: string;
  gridClassName?: string;
}) {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [categories, setCategories] = useState(initialCategories);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const { items: categoryItems } = useCategoryItems();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBootstrapped = useRef(false);
  const [serverSearch, setServerSearch] = useState("");

  useEffect(() => {
    setShops(initialShops);
    setCategories(initialCategories);
    setHasMore(initialHasMore);
  }, [initialShops, initialCategories, initialHasMore]);

  // Debounce search → server fetch (replaces loading the full catalog)
  useEffect(() => {
    if (!searchBootstrapped.current) {
      searchBootstrapped.current = true;
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const q = searchQuery.trim();
    searchTimerRef.current = setTimeout(() => {
      void (async () => {
        setServerSearch(q);
        try {
          const res = await apiShops.listPublic({
            search: q || undefined,
            page: 1,
            limit: SHOPS_PAGE_SIZE,
          });
          const items = (res.items ?? []).filter((s) => s.is_active !== false);
          setShops(items);
          setHasMore(Boolean(res.has_more ?? items.length >= SHOPS_PAGE_SIZE));
          if (items.length) {
            const cats = await apiShops.productCategoriesForShops(items.map((s) => s.id));
            setCategories((prev) => ({ ...prev, ...cats }));
          }
        } catch {
          /* keep current list */
        }
      })();
    }, q ? 280 : 0);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  const refreshFromApi = useCallback(async () => {
    try {
      const res = await apiShops.listPublic({
        search: serverSearch || undefined,
        page: 1,
        limit: SHOPS_PAGE_SIZE,
      });
      const fresh = (res.items ?? []).filter((shop) => shop.is_active !== false);
      if (fresh.length > 0) {
        setShops((prev) => {
          // Merge first page into existing without dropping load-more rows
          const byId = new Map(prev.map((s) => [s.id, s]));
          for (const s of fresh) byId.set(s.id, { ...byId.get(s.id), ...s });
          const merged = [...byId.values()];
          merged.sort((a, b) => {
            const at = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bt - at;
          });
          return merged;
        });
        setHasMore(Boolean(res.has_more ?? fresh.length >= SHOPS_PAGE_SIZE));
      }
    } catch {
      // Silently ignore — realtime is the primary path.
    }
  }, [serverSearch]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshFromApi();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshFromApi]);

  useRealtimeTable(
    { channel: "shops:public", table: "shops", event: "*" },
    (payload) => {
      if (payload.eventType === "DELETE") {
        const row = payload.old as Partial<Shop> | undefined;
        if (row?.id) setShops((prev) => removeShop(prev, String(row.id)));
        return;
      }
      const row = payload.new as Shop | undefined;
      if (!row || !row.id) return;
      if (row.is_active === false) {
        setShops((prev) => removeShop(prev, String(row.id)));
        return;
      }
      setShops((prev) => mergeShop(prev, row));

      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        void refreshFromApi();
      }, 1500);
    }
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const exclude = shops.map((s) => s.id);
      const res = await apiShops.listPublic({
        search: serverSearch || undefined,
        limit: SHOPS_PAGE_SIZE,
        exclude_ids: exclude,
      });
      const next = (res.items ?? []).filter((s) => s.is_active !== false);
      if (next.length === 0) {
        setHasMore(false);
      } else {
        setShops((prev) => {
          const seen = new Set(prev.map((s) => s.id));
          return [...prev, ...next.filter((s) => !seen.has(s.id))];
        });
        setHasMore(Boolean(res.has_more));
        const cats = await apiShops.productCategoriesForShops(next.map((s) => s.id));
        setCategories((prev) => ({ ...prev, ...cats }));
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, shops, serverSearch]);

  const activeShops = useMemo(() => shops.filter((s) => s.is_active !== false), [shops]);

  const visible = useMemo(() => {
    let list = activeShops;
    if (categoryFilter.parentLabel || categoryFilter.subcategoryLabel) {
      list = list.filter((s) =>
        shopMatchesCategoryFilter(
          s.category,
          categories[s.id] ?? [],
          categoryFilter,
          categoryItems,
        ),
      );
    }
    // When using server search, list is already filtered; still apply local match for category product cats
    if (!serverSearch) {
      list = list.filter((s) => matchesShopSearch(s, searchQuery, categories[s.id]));
    }
    return list;
  }, [activeShops, categoryFilter, categoryItems, searchQuery, serverSearch, categories]);

  const grid = gridClassName ?? browseShopGridClass;
  const totalLabel =
    initialTotal != null && initialTotal > 0
      ? initialTotal
      : activeShops.length;

  if (activeShops.length === 0) {
    return (
      <div className="dm-card p-6 sm:p-8">
        <p className="text-sm font-medium text-foreground">No active shops yet.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Shops become visible to the public after they are verified. If you
          already opened a shop, check your{" "}
          <Link href="/merchant" className="font-semibold text-foreground underline-offset-2 hover:underline">
            merchant dashboard
          </Link>{" "}
          to track the verification status, or{" "}
          <Link href="/merchant/new" className="font-semibold text-foreground underline-offset-2 hover:underline">
            open a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="dm-card p-6 sm:p-8">
        <p className="text-sm text-muted">No shops match your search or category. Try clearing filters.</p>
        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="dm-btn dm-btn-secondary mt-4 dm-btn-sm"
          >
            {loadingMore ? "Loading…" : "Load more shops"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={grid}>
        {visible.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={{
              id: shop.id,
              slug: shop.slug,
              name: shop.name,
              category: categories[shop.id]?.[0] ?? shop.category ?? "Shop",
              location: locationDisplay(shop.location),
              tagline: shop.description ?? "",
              verified: shop.is_active ?? true,
              logoUrl: shop.logo_url ?? null,
              shopType: shop.shop_type ?? null,
              viewCount: shop.view_count ?? null,
              whatsappNumber: shop.whatsapp_number ?? null,
              email: shop.shop_email ?? null,
              rating: shop.trust_score != null ? Math.min(5, shop.trust_score / 20) : null,
              reviewCount: null,
            }}
          />
        ))}
      </div>

      {hasMore ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="dm-btn dm-btn-secondary px-6"
          >
            {loadingMore ? "Loading…" : "Load more shops"}
          </button>
          {totalLabel > visible.length ? (
            <p className="text-xs text-muted">
              Showing {visible.length}
              {initialTotal != null ? ` of ${initialTotal}` : ""} shops
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
