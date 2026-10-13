"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";

const TABS = [
  { slug: "", label: "Overview" },
  { slug: "catalog", label: "Catalog" },
  { slug: "analytics", label: "Analytics" },
  { slug: "verification", label: "Verification" },
  { slug: "settings", label: "Settings" },
] as const;

export default function ShopDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";
  const pathname = usePathname() || "";

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const s = await apiShops.getShop(shopId);
      setShop(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shop");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <nav className="flex items-center gap-1 text-xs text-muted">
        <Link href="/merchant/shops" className="hover:text-foreground">
          My shops
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">
          {loading ? "…" : shop?.name || shopId.slice(0, 8)}
        </span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-semibold sm:text-2xl">
            {loading ? "Loading…" : shop?.name || "Unknown shop"}
          </h2>
          {shop?.slug ? (
            <p className="mt-0.5 text-xs text-muted">{shop.slug}</p>
          ) : null}
        </div>
        {shop ? (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                shop.is_active
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              }`}
            >
              {shop.is_active ? "Active" : "Inactive"}
            </span>
            <Link
              href={`/shops/${shop.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface-subtle"
            >
              View public ↗
            </Link>
          </div>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto border-b border-border">
        <nav className="flex min-w-full items-center gap-1">
          {TABS.map((t) => {
            const href = t.slug
              ? `/merchant/shops/${shopId}/${t.slug}`
              : `/merchant/shops/${shopId}`;
            const active = t.slug
              ? pathname.endsWith(`/${t.slug}`) ||
                pathname.includes(`/${t.slug}/`)
              : pathname === `/merchant/shops/${shopId}`;
            return (
              <Link
                key={t.slug || "overview"}
                href={href}
                className={[
                  "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>{children}</div>
    </div>
  );
}
