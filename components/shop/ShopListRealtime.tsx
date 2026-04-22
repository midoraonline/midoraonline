"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ShopCard from "@/components/shopcard";
import type { Shop } from "@/lib/api/shops";
import { useRealtimeTable } from "@/lib/realtime/hooks";

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

/**
 * Client-side shop grid that seeds from a server-fetched list and keeps
 * itself in sync via Supabase Realtime on the `public.shops` table.
 *
 * Falls back to the initial list if realtime isn't configured.
 */
export default function ShopListRealtime({ initialShops }: { initialShops: Shop[] }) {
  const [shops, setShops] = useState<Shop[]>(initialShops);

  // Re-seed when server provides a fresh list (eg. after router refresh).
  useEffect(() => {
    setShops(initialShops);
  }, [initialShops]);

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
      // Only expose active shops in the public list.
      if (row.is_active === false) {
        setShops((prev) => removeShop(prev, String(row.id)));
        return;
      }
      setShops((prev) => mergeShop(prev, row));
    }
  );

  const visible = useMemo(
    () => shops.filter((s) => s.is_active !== false),
    [shops]
  );

  if (visible.length === 0) {
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {visible.map((shop) => (
        <ShopCard
          key={shop.id}
          shop={{
            id: shop.id,
            slug: shop.slug,
            name: shop.name,
            category: shop.category ?? "Shop",
            location: locationDisplay(shop.location),
            tagline: shop.description ?? "",
            verified: shop.is_active ?? true,
            logoUrl: shop.logo_url ?? null,
          }}
        />
      ))}
    </div>
  );
}
