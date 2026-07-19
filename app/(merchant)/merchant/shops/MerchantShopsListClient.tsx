"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type TabKey = "all" | "active" | "inactive";

type Props = { initialShops: Shop[] };

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

const SHOP_TABS = [
  { slug: "", label: "Overview", icon: "home" as const },
  { slug: "catalog", label: "Catalog", icon: "inventory_2" as const },
  { slug: "analytics", label: "Analytics", icon: "monitoring" as const },
  { slug: "verification", label: "Verify", icon: "verified" as const },
  { slug: "settings", label: "Settings", icon: "settings" as const },
];

function fmt(n?: number | null): string {
  return new Intl.NumberFormat().format(Number(n ?? 0));
}

function shopHref(id: string, slug = ""): string {
  return slug ? `/merchant/shops/${id}/${slug}` : `/merchant/shops/${id}`;
}

function ShopRow({
  shop,
  highlight,
  onOpenNewProduct,
}: {
  shop: Shop;
  highlight: boolean;
  onOpenNewProduct?: (shopId: string) => void;
}) {
  const initial = (shop.name || "?").charAt(0).toUpperCase();
  const statusClass = shop.is_active
    ? "dm-pill dm-pill--success"
    : "dm-pill dm-pill--warning";

  return (
    <li
      className={[
        "dm-card group relative overflow-hidden p-0 transition",
        highlight ? "ring-2 ring-accent/50" : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        {/* Logo */}
        <Link
          href={shopHref(shop.id)}
          className="dm-focus flex shrink-0 items-center gap-3 sm:gap-4"
          aria-label={`Open ${shop.name} dashboard`}
        >
          {shop.logo_url ? (
            <Image
              src={shop.logo_url}
              alt={shop.name}
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-lg font-bold text-accent">
              {initial}
            </span>
          )}
        </Link>

        {/* Identity + description */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={shopHref(shop.id)}
              className="dm-focus min-w-0 truncate font-display text-base font-semibold text-foreground transition-colors group-hover:text-accent sm:text-lg"
            >
              {shop.name}
            </Link>
            <span className={`${statusClass} px-2 py-0.5 text-[10px]`}>
              {shop.is_active ? "Active" : "Inactive"}
            </span>
            {shop.shop_type ? (
              <span className="dm-pill dm-pill--muted px-2 py-0.5 text-[10px] capitalize">
                {shop.shop_type}
              </span>
            ) : null}
          </div>
          {shop.slug ? (
            <p className="truncate text-xs text-muted">/{shop.slug}</p>
          ) : null}
          {shop.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted sm:line-clamp-2">
              {shop.description}
            </p>
          ) : null}

          {/* Metric strip */}
          <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
            <div className="flex items-center gap-1">
              <MaterialSymbol name="visibility" className="!text-[13px]" />
              <dt className="sr-only">Views</dt>
              <dd className="font-semibold text-foreground/80">{fmt(shop.view_count)}</dd>
            </div>
            <div className="flex items-center gap-1">
              <MaterialSymbol name="favorite" className="!text-[13px]" />
              <dt className="sr-only">Likes</dt>
              <dd className="font-semibold text-foreground/80">{fmt(shop.like_count)}</dd>
            </div>
            <div className="flex items-center gap-1">
              <MaterialSymbol name="group" className="!text-[13px]" />
              <dt className="sr-only">Followers</dt>
              <dd className="font-semibold text-foreground/80">{fmt(shop.follower_count)}</dd>
            </div>
            {shop.category ? (
              <div className="flex items-center gap-1">
                <MaterialSymbol name="category" className="!text-[13px]" />
                <dd className="truncate">{shop.category}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch sm:gap-1.5">
          {onOpenNewProduct ? (
            <button
              type="button"
              onClick={() => onOpenNewProduct(shop.id)}
              className="dm-btn dm-btn-primary dm-btn-sm w-full whitespace-nowrap"
            >
              <MaterialSymbol name="add" className="!text-sm" />
              New product
            </button>
          ) : (
            <Link
              href={shopHref(shop.id)}
              className="dm-btn dm-btn-primary dm-btn-sm w-full whitespace-nowrap"
            >
              Manage
              <MaterialSymbol name="arrow_forward" className="!text-sm" />
            </Link>
          )}
          {shop.slug ? (
            <Link
              href={`/shops/${shop.slug}`}
              target="_blank"
              rel="noreferrer"
              className="dm-btn dm-btn-secondary dm-btn-sm w-full whitespace-nowrap"
            >
              View public
              <MaterialSymbol name="open_in_new" className="!text-sm" />
            </Link>
          ) : null}
        </div>
      </div>

      {/* Sub-tab reveal — small hint about where you'll land */}
      <div className="grid grid-cols-5 gap-1 border-t border-border bg-surface-subtle/50 px-3 py-2">
        {SHOP_TABS.map((t) => (
          <Link
            key={t.slug || "overview"}
            href={shopHref(shop.id, t.slug)}
            className="dm-focus flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium text-muted transition-colors hover:bg-foreground/[0.05] hover:text-accent"
            title={`${shop.name} — ${t.label}`}
          >
            <MaterialSymbol name={t.icon} className="!text-[16px]" />
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
    </li>
  );
}

export default function MerchantShopsListClient({ initialShops }: Props) {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent"); // "new-product" from the navbar CTA

  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiShops.myShops();
      setShops(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your shops");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeTable(
    { table: "shops", channel: "merchant-shops-list" },
    () => {
      void load();
    },
  );

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { all: shops.length, active: 0, inactive: 0 };
    for (const s of shops) {
      if (s.is_active) c.active += 1;
      else c.inactive += 1;
    }
    return c;
  }, [shops]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shops.filter((s) => {
      if (tab === "active" && !s.is_active) return false;
      if (tab === "inactive" && s.is_active) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.slug ?? "").toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [shops, tab, query]);

  const newProductMode = intent === "new-product";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {newProductMode ? "Pick a shop" : "Merchant · My shops"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {newProductMode
              ? "Where should this product live?"
              : "Your shops"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {newProductMode
              ? "Choose the shop this product belongs to and we'll open its catalog."
              : `Manage every storefront you own. ${counts.all} ${counts.all === 1 ? "shop" : "shops"} total.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/open-shop"
            className="dm-btn dm-btn-secondary dm-btn-sm"
          >
            <MaterialSymbol name="add_business" className="!text-sm" />
            New shop
          </Link>
        </div>
      </div>

      {/* Search + tabs */}
      {shops.length > 0 && !newProductMode ? (
        <div className="dm-card flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto sm:flex-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              const count = counts[t.key];
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={[
                    "dm-focus flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "bg-accent text-white shadow-sm"
                      : "text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground",
                  ].join(" ")}
                >
                  <span>{t.label}</span>
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      active ? "bg-white/25 text-white" : "bg-foreground/[0.08] text-muted",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative sm:min-w-[240px]">
            <MaterialSymbol
              name="search"
              className="!text-base pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shops…"
              className="dm-focus w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted focus:border-accent/40"
              aria-label="Search shops"
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="dm-alert border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Empty states */}
      {shops.length === 0 ? (
        <div className="dm-card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-accent/10 text-accent">
            <MaterialSymbol name="storefront" className="!text-2xl" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">No shops yet</h2>
            <p className="mt-1 text-sm text-muted">
              Open your first storefront in under a minute — logo, category,
              contact and you&apos;re live.
            </p>
          </div>
          <Link href="/open-shop" className="dm-btn dm-btn-primary mt-1">
            <MaterialSymbol name="add_business" className="!text-sm" />
            Open your first shop
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="dm-card p-8 text-center text-sm text-muted">
          No shops match this filter.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((s) => {
            const openNewProduct = newProductMode
              ? (shopId: string) => {
                  window.location.href = `/merchant/shops/${shopId}/catalog?openAdd=true`;
                }
              : undefined;
            return (
              <ShopRow
                key={s.id}
                shop={s}
                highlight={newProductMode}
                onOpenNewProduct={openNewProduct}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
