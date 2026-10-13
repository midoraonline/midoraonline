"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import { BTN_SECONDARY, ErrorState, PageHeader, StatusDot, UnderlineTabs } from "@/components/dashboard/ui";

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

  const tabs = TABS.map((t) => ({
    value: t.slug,
    label: t.label,
    href: t.slug ? `/merchant/shops/${shopId}/${t.slug}` : `/merchant/shops/${shopId}`,
  }));
  const current =
    TABS.find((t) => t.slug && (pathname.endsWith(`/${t.slug}`) || pathname.includes(`/${t.slug}/`)))?.slug ?? "";

  return (
    <div>
      <PageHeader
        title={loading ? "Loading…" : shop?.name || "Shop"}
        description={
          shop ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{shop.name}</span>
              <StatusDot tone={shop.is_active ? "ok" : "warn"}>{shop.is_active ? "Live" : "Pending review"}</StatusDot>
              <span className="truncate">/{shop.slug}</span>
            </span>
          ) : null
        }
        action={
          shop?.slug ? (
            <Link href={`/shops/${shop.slug}`} target="_blank" rel="noreferrer" className={BTN_SECONDARY}>
              View public page
            </Link>
          ) : null
        }
      />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      <UnderlineTabs tabs={tabs} value={current} />
      {children}
    </div>
  );
}
