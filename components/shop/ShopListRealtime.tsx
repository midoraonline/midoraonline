"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShopCard from "@/components/shopcard";
import type { Shop } from "@/lib/api/shops";
import { browseShopGridClass, shopHasProductCategory } from "@/lib/browseCategories";
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
  shopProductCategories,
  productCategoryFilter = null,
  searchQuery = "",
  gridClassName,
}: {
  initialShops: Shop[];
  shopProductCategories: Record<string, string[]>;
  productCategoryFilter?: string | null;
  searchQuery?: string;
  gridClassName?: string;
}) {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShops(initialShops);
  }, [initialShops]);

  // Periodic refresh to catch newly-verified shops that may not surface via
  // realtime due to Supabase RLS row-visibility rules (a row that was hidden
  // from anon becomes visible only after is_active flips to true, so the
  // INSERT / UPDATE may be suppressed in some RLS configurations).
  const refreshFromApi = useCallback(async () => {
    try {
      const freshShops = await apiShops.listAllPublic();
      if (freshShops.length > 0) {
        setShops(freshShops.filter((shop) => shop.is_active !== false));
      }
    } catch {
      // Silently ignore — realtime is the primary path.
    }
  }, []);

  // Re-fetch when the tab regains visibility. This guarantees newly verified
  // shops appear without a manual page reload even if the realtime event was
  // missed (e.g. the tab was in the background during verification).
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
      // For INSERT events and UPDATE events where is_active becomes true,
      // merge the shop directly. If the payload has limited fields due to
      // RLS, schedule a background refresh to hydrate the full record.
      setShops((prev) => mergeShop(prev, row));

      // Debounced refresh to hydrate any missing fields from the API.
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        void refreshFromApi();
      }, 1500);
    }
  );

  const activeShops = useMemo(() => shops.filter((s) => s.is_active !== false), [shops]);

  const visible = useMemo(() => {
    let list = activeShops;
    if (productCategoryFilter) {
      list = list.filter((s) => shopHasProductCategory(s.id, shopProductCategories, productCategoryFilter));
    }
    list = list.filter((s) => matchesShopSearch(s, searchQuery, shopProductCategories[s.id]));
    return list;
  }, [activeShops, productCategoryFilter, searchQuery, shopProductCategories]);

  const grid = gridClassName ?? browseShopGridClass;

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
      </div>
    );
  }

  return (
    <div className={grid}>
      {visible.map((shop) => (
        <ShopCard
          key={shop.id}
          shop={{
            id: shop.id,
            slug: shop.slug,
            name: shop.name,
            category: shopProductCategories[shop.id]?.[0] ?? shop.category ?? "Shop",
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
  );
}
