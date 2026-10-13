"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import {
  BTN_PRIMARY,
  EmptyState,
  ErrorState,
  LIST,
  PageHeader,
  ROW,
  StatusDot,
  UnderlineTabs,
  formatCount as fmt,
  useTabParam,
} from "@/components/dashboard/ui";

const TAB_KEYS = ["all", "live", "pending"] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function MerchantShopsListClient({ initialShops }: { initialShops: Shop[] }) {
  const intent = useSearchParams().get("intent");
  const newProductMode = intent === "new-product";

  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useTabParam(TAB_KEYS, "all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiShops.myShops();
      setShops(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your shops.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeTable({ table: "shops", channel: "merchant-shops-list" }, () => {
    void load();
  });

  const live = shops.filter((s) => s.is_active).length;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shops.filter((s) => {
      if (tab === "live" && !s.is_active) return false;
      if (tab === "pending" && s.is_active) return false;
      if (!q) return true;
      return [s.name, s.slug ?? "", s.description ?? ""].some((v) => v.toLowerCase().includes(q));
    });
  }, [shops, tab, query]);

  return (
    <div>
      <PageHeader
        title={newProductMode ? "Choose a shop" : "My shops"}
        description={
          newProductMode
            ? "Pick the shop this listing belongs to and we'll open its catalog."
            : `${fmt(shops.length)} ${shops.length === 1 ? "shop" : "shops"}, ${fmt(live)} live`
        }
        action={
          <Link href="/open-shop" className={BTN_PRIMARY}>
            New shop
          </Link>
        }
      />

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {shops.length > 0 && !newProductMode ? (
        <>
          <UnderlineTabs
            tabs={[
              { value: "all", label: `All ${shops.length}` },
              { value: "live", label: `Live ${live}` },
              { value: "pending", label: `Pending ${shops.length - live}` },
            ]}
            value={tab}
            onChange={(v) => setTab(v as TabKey)}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shops"
            aria-label="Search shops"
            className="mb-4 h-9 w-full max-w-xs rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </>
      ) : null}

      {shops.length === 0 ? (
        <EmptyState
          message="You don't have a shop yet."
          action={
            <Link href="/open-shop" className={BTN_PRIMARY}>
              Open a shop
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState message="No shops match this filter." />
      ) : (
        <ul className={LIST}>
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                href={newProductMode ? `/merchant/shops/${s.id}/catalog?openAdd=true` : `/merchant/shops/${s.id}`}
                className={ROW}
              >
                {s.logo_url ? (
                  <Image src={s.logo_url} alt="" width={32} height={32} className="size-8 shrink-0 rounded-md object-cover" />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {[s.category, `${fmt(s.view_count)} views`, `${fmt(s.follower_count)} followers`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <StatusDot tone={s.is_active ? "ok" : "warn"}>{s.is_active ? "Live" : "Pending"}</StatusDot>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
