"use client";

import { Package, Plus, Search } from "lucide-react";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { type Product, type ProductStatus } from "@/lib/api/products";
import ListingManageCard from "@/components/shop/ListingManageCard";
import ConfirmDialog from "@/components/ConfirmDialog";
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
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

      {filtered.length === 0 ? (
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
        <ul className={LIST}>
          {filtered.map((p) => (
            <li key={p.id} className="px-3 py-3 sm:px-4">
              <ListingManageCard
                product={p}
                shopName={showMultipleShops ? shopById.get(p.shop_id)?.name : null}
                onDelete={() => setPendingDelete(p)}
                onUpdated={applyProduct}
              />
            </li>
          ))}
        </ul>
      )}

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
