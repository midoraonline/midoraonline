"use client";

import { CheckCircle2, Package, Plus, Search, X } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { type Product, type ProductStatus } from "@/lib/api/products";
import ListingManageCard from "@/components/shop/ListingManageCard";
import ListingPromoteActions from "@/components/shop/ListingPromoteActions";
import useSWR from "swr";
import { getListingAttention, getMyBoosts, myBoostsKey } from "@/lib/api/listingActions";
import ConfirmDialog from "@/components/ConfirmDialog";
import MoveListingDialog from "@/components/shop/MoveListingDialog";
import { ShopAvatar } from "@/components/shop/ShopAvatar";
import { OTHER_LISTINGS_LABEL, shopTypeLabel } from "@/lib/shop/shopFit";
import Link from "next/link";
import type { ListingShopSummary } from "./types";
import {
  BTN_PRIMARY,
  BTN_TEXT,
  EmptyState,
  INPUT,
  LIST,
  PageHeader,
  UnderlineTabs,
  formatCount as fmt,
  useTabParam,
} from "@/components/dashboard/ui";

const TAB_KEYS = ["all", "reviewing", "live", "rejected", "drafts"] as const;
type Tab = (typeof TAB_KEYS)[number];

const TAB_META: {
  key: Tab;
  label: string;
  test: (s: ProductStatus | null | undefined) => boolean;
}[] = [
  { key: "all", label: "All", test: () => true },
  { key: "reviewing", label: "In review", test: (s) => s === "pending_review" },
  { key: "live", label: "Live", test: (s) => s === "active" },
  { key: "rejected", label: "Not approved", test: (s) => s === "rejected" },
  {
    key: "drafts",
    label: "Drafts & hidden",
    test: (s) => s === "draft" || s === "hidden" || s === "expired" || s === "sold",
  },
];

function sortListings(items: Product[]): Product[] {
  return [...items].sort((a, b) => {
    const rank = (p: Product) =>
      p.status === "pending_review" ? 0 : p.status === "rejected" ? 1 : 2;
    const rDiff = rank(a) - rank(b);
    if (rDiff !== 0) return rDiff;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
}

async function loadOwnerListings(shops: ListingShopSummary[]): Promise<Product[]> {
  try {
    const first = await apiProducts.listMyProducts({ page: 1, limit: 100 });
    const items = [...(first.items ?? [])];
    const pageSize = first.limit || first.page_size || 100;
    const totalPages = Math.min(
      first.total_pages ??
        (first.total != null ? Math.ceil(first.total / pageSize) : 1),
      10,
    );
    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          apiProducts.listMyProducts({ page: i + 2, limit: 100 }),
        ),
      );
      for (const page of rest) items.push(...(page.items ?? []));
    }
    return sortListings(items);
  } catch (e) {
    if (!(e instanceof ApiError) || (e.status !== 404 && e.status !== 405)) throw e;
    const perShop = await Promise.all(
      shops.map((s) =>
        apiProducts.listShopProducts(s.id, { limit: 100, includeUnpublished: true }),
      ),
    );
    return sortListings(perShop.flatMap((res) => res.items ?? []));
  }
}

export default function MerchantListingsClient({
  initialListings,
  shops,
}: {
  initialListings: Product[];
  shops: ListingShopSummary[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>(initialListings);
  const [tab, setTab] = useTabParam(TAB_KEYS, "all");
  const [search, setSearch] = useState("");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const liveIds = useMemo(
    () => items.filter((p) => p.status === "active" && p.is_published !== false).map((p) => p.id),
    [items],
  );
  const boostsKey = myBoostsKey(liveIds);
  const { data: boosts } = useSWR(boostsKey, () => getMyBoosts(liveIds), { revalidateOnFocus: true });
  const { data: attention } = useSWR("listing-attention", getListingAttention, { revalidateOnFocus: true });
  const searchParams = useSearchParams();
  const postedId = searchParams.get("posted");
  const [dismissedPosted, setDismissedPosted] = useState(false);
  const posted = postedId && !dismissedPosted ? items.find((p) => p.id === postedId) ?? null : null;

  const shopById = useMemo(() => {
    const m = new Map<string, ListingShopSummary>();
    for (const s of shops) m.set(s.id, s);
    return m;
  }, [shops]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: 0, reviewing: 0, live: 0, rejected: 0, drafts: 0 };
    for (const p of items) {
      for (const t of TAB_META) if (t.test(p.status)) c[t.key] += 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = TAB_META.find((t) => t.key === tab)?.test ?? (() => true);
    return items.filter((p) => {
      if (!match(p.status)) return false;
      if (!q) return true;
      const shopName = shopById.get(p.shop_id)?.name ?? "";
      return (
        (p.title || "").toLowerCase().includes(q) ||
        shopName.toLowerCase().includes(q)
      );
    });
  }, [items, tab, search, shopById]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await loadOwnerListings(shops));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to refresh listings");
    } finally {
      setRefreshing(false);
    }
  }, [shops]);

  // Poll while any listing is under review so status updates land without
  // the merchant hitting refresh. Stops as soon as the queue is empty.
  useEffect(() => {
    const anyPending = items.some((p) => p.status === "pending_review");
    if (!anyPending) return;
    const id = setInterval(() => void reload(), 15_000);
    return () => clearInterval(id);
  }, [items, reload]);

  async function handleDelete(p: Product) {
    setDeleting(true);
    const request = apiProducts.deleteProduct(p.id);
    toast.promise(request, {
      loading: "Removing listing…",
      success: "Listing removed",
      error: (e) => (e instanceof Error ? e.message : "Delete failed."),
    });
    try {
      await request;
      setPendingDelete(null);
      await reload();
    } catch {
      /* sonner */
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    router.push("/post-item");
  }

  function applyProduct(next: Product) {
    setItems((prev) => prev.map((p) => (p.id === next.id ? { ...p, ...next } : p)));
  }

  const showMultipleShops = shops.length > 1;
  const shopCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of filtered) {
      const key = shopById.has(p.shop_id) ? p.shop_id : "other";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [filtered, shopById]);
  // With shops, group the list: one section per shop, then "Other listings" for the rest.
  const groups = useMemo(() => {
    type Group = { key: string; shop: ListingShopSummary | null; items: Product[] };
    if (shops.length === 0) return [{ key: "all", shop: null, items: filtered }] as Group[];
    const out: Group[] = shops
      .map((s) => ({ key: s.id, shop: s, items: filtered.filter((p) => p.shop_id === s.id) }))
      .filter((g) => g.items.length > 0);
    const other = filtered.filter((p) => !shopById.has(p.shop_id));
    if (other.length > 0) out.push({ key: "other", shop: null, items: other });
    return shopFilter === "all" ? out : out.filter((g) => g.key === shopFilter);
  }, [shops, filtered, shopById, shopFilter]);
  const visibleCount = groups.reduce((n, g) => n + g.items.length, 0);

  const emptyMessage: Record<Tab, string> = {
    all: "Post your first product, service or opportunity. It goes live after a quick automated check.",
    reviewing: "Nothing is in review.",
    live: "Nothing is live yet.",
    rejected: "No listings were turned down.",
    drafts: "No drafts or hidden listings.",
  };

  return (
    <div>
      <PageHeader
        title="My listings"
        description={
          shops.length > 1
            ? `${fmt(items.length)} listings across ${shops.length} shops.`
            : `${fmt(items.length)} listings. Approved listings go live automatically.`
        }
        action={
          <button type="button" onClick={openAdd} className={BTN_PRIMARY}>
            <Plus className="size-4" aria-hidden />
            Post an ad
          </button>
        }
      />

      {posted ? (
        <section className="mb-5 rounded-xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/5 p-4" aria-live="polite">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[color:var(--success)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {posted.status === "active" ? "Your ad is live" : "Your ad is posted"}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted">{posted.title}</p>
              {posted.status === "active" && posted.is_published !== false ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <ListingPromoteActions
                    listingId={posted.id}
                    onReposted={(postedAt) => applyProduct({ ...posted, created_at: postedAt })}
                  />
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  It&apos;s being checked. Boost, Repost and Find in feed appear once it&apos;s live.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDismissedPosted(true)}
              className="dm-focus grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-muted"
              aria-label="Dismiss"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </section>
      ) : null}

      <UnderlineTabs
        tabs={TAB_META.map((t) => ({ value: t.key, label: (
            <>
              {t.label}
              <span className="ml-1.5 rounded-md bg-surface-muted px-1.5 text-xs tabular-nums text-muted">{counts[t.key]}</span>
            </>
          ),
        }))}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={showMultipleShops ? "Search listings or shop" : "Search listings"}
          aria-label="Search listings"
          className={`${INPUT} pl-9`}
        />
        </div>
        <button type="button" onClick={() => void reload()} disabled={refreshing} className={BTN_TEXT}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {shops.length > 0 ? (
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by shop">
          {[
            { key: "all", label: "All shops", shop: undefined, count: filtered.length },
            ...shops.map((s) => ({ key: s.id, label: s.name, shop: s as ListingShopSummary | null, count: shopCounts.get(s.id) ?? 0 })),
            ...((shopCounts.get("other") ?? 0) > 0 || shopFilter === "other"
              ? [{ key: "other", label: OTHER_LISTINGS_LABEL, shop: null, count: shopCounts.get("other") ?? 0 }]
              : []),
          ].map((f) => {
            const on = shopFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setShopFilter(f.key)}
                className={`dm-focus inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1 text-xs font-medium transition-colors ${
                  f.shop === undefined ? "px-3" : "pl-1 pr-3"
                } ${
                  on
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-surface text-muted hover:border-accent/40 hover:text-foreground"
                }`}
              >
                {f.shop !== undefined ? <ShopAvatar shop={f.shop} size="xs" /> : null}
                <span className="max-w-[10rem] truncate">{f.label}</span>
                <span className={`tabular-nums ${on ? "text-accent" : "text-muted"}`}>{f.count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {visibleCount === 0 ? (
        <EmptyState
          icon={Package}
          title={tab === "all" ? "No listings yet" : undefined}
          message={emptyMessage[tab]}
          action={
            tab === "all" ? (
              <button type="button" onClick={openAdd} className={BTN_PRIMARY}>
                <Plus className="size-4" aria-hidden />
                Post an ad
              </button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.shop?.name ?? (g.key === "other" ? OTHER_LISTINGS_LABEL : "Listings")}>
              {g.key !== "all" ? (
                <div className="mb-2 flex items-center gap-3 px-1">
                  <ShopAvatar shop={g.shop} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-foreground">
                      {g.shop?.name ?? OTHER_LISTINGS_LABEL}
                    </h2>
                    <p className="text-xs text-muted">
                      {g.shop ? shopTypeLabel(g.shop.shop_type) : "Not under any shop"} ·{" "}
                      <span className="tabular-nums">{g.items.length}</span>{" "}
                      {g.items.length === 1 ? "listing" : "listings"}
                    </p>
                  </div>
                  {g.shop?.slug ? (
                    <Link href={`/shops/${g.shop.slug}`} className={BTN_TEXT}>
                      View shop
                    </Link>
                  ) : null}
                </div>
              ) : null}
              <ul className={LIST}>
                {g.items.map((p) => (
                  <li key={p.id} className="px-3 py-3 sm:px-4">
                    <ListingManageCard
                      product={p}
                      shop={shops.length > 0 ? shopById.get(p.shop_id) ?? null : undefined}
                      onDelete={() => setPendingDelete(p)}
                      onUpdated={applyProduct}
                      onMove={() => setMoving(p)}
                      boost={boosts?.[p.id] ?? null}
                      attention={attention?.[p.id] ?? null}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {moving ? (
        <MoveListingDialog
          product={moving}
          shops={shops}
          onMoved={(next) => applyProduct({ ...moving, shop_id: next.shop_id })}
          onClose={() => setMoving(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete listing?"
          message={`"${pendingDelete.title || "This listing"}" and its photos will be removed. This can't be undone.`}
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          cancelLabel="Cancel"
          destructive
          busy={deleting}
          onConfirm={() => void handleDelete(pendingDelete)}
          onClose={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}
