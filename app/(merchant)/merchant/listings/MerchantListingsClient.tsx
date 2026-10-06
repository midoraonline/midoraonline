"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  ImagePlus,
  Loader2,
  Package,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { type Product, type ProductStatus } from "@/lib/api/products";
import ListingManageCard from "@/components/shop/ListingManageCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { ListingShopSummary } from "./types";

type Tab = "all" | "reviewing" | "live" | "rejected" | "drafts";

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
  const [tab, setTab] = useState<Tab>("all");
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

  return (
    <div className="flex w-full flex-col gap-4 px-3 pb-24 pt-4 sm:pt-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mt-0.5 text-xs text-muted">
            {shops.length === 0
              ? "Everything you've posted."
              : shops.length === 1
                ? "Everything you've posted across your shop. Approved listings go live automatically."
                : `Everything you've posted across ${shops.length} shops. Approved listings go live automatically.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void reload()}
            disabled={refreshing}
            className="dm-focus inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground/70 hover:bg-surface-subtle disabled:opacity-60"
          >
            <Loader2 className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="dm-btn dm-btn-primary dm-btn-sm inline-flex items-center gap-1"
          >
            <ImagePlus className="size-3.5" />
            Add listing
          </button>
        </div>
      </header>

      {/* Search + Tabs — sticky so filters stay reachable while scrolling long lists */}
      <div className="sticky top-0 z-10 -mx-3 space-y-2 border-b border-border/60 bg-background/85 px-3 pt-1 pb-2 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-3 sm:pt-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={showMultipleShops ? "Search listings or shop…" : "Search listings…"}
            className="dm-input w-full pl-9"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {TAB_META.map((t) => {
            const active = tab === t.key;
            const n = counts[t.key];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-accent text-white shadow-sm"
                    : "bg-surface-subtle text-foreground/70 hover:bg-foreground/[0.06]"
                }`}
              >
                {t.label}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active ? "bg-white/25" : "bg-foreground/[0.08]"
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState tab={tab} hasShops={shops.length > 0} onAdd={openAdd} />
      ) : (
        <ul className="divide-y divide-border/70">
          {filtered.map((p) => (
            <li key={p.id} className="py-2 first:pt-0 last:pb-0">
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


      {/* Delete confirmation */}
      {pendingDelete ? (
        <ConfirmDialog
          title="Delete listing?"
          message={`"${pendingDelete.title || "This listing"}" will be removed permanently. Uploaded photos will also be cleared. This cannot be undone.`}
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
function EmptyState({
  tab,
  hasShops,
  onAdd,
}: {
  tab: Tab;
  hasShops: boolean;
  onAdd: () => void;
}) {
  const map: Record<Tab, { title: string; hint: string; icon: React.ReactNode }> = {
    all: {
      title: "No listings yet",
      hint: "Post your first product — it goes live after a quick automated check.",
      icon: <Package className="size-6" aria-hidden />,
    },
    reviewing: {
      title: "Nothing in review",
      hint: "New listings show here while Midora checks them — or when they await admin review.",
      icon: <Clock className="size-6" aria-hidden />,
    },
    live: {
      title: "Nothing live yet",
      hint: "Approved listings show here. Post something to get started.",
      icon: <CheckCircle2 className="size-6" aria-hidden />,
    },
    rejected: {
      title: "No rejections",
      hint: "Listings we couldn't approve show up here with a reason so you can fix and resubmit.",
      icon: <XCircle className="size-6" aria-hidden />,
    },
    drafts: {
      title: "No drafts or hidden listings",
      hint: "Save drafts or unpublish listings and they'll appear here.",
      icon: <Package className="size-6" aria-hidden />,
    },
  };
  const meta = map[tab];
  return (
    <div className="dm-card flex flex-col items-center gap-3 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        {meta.icon}
      </div>
      <p className="text-sm font-bold text-foreground">{meta.title}</p>
      <p className="max-w-xs text-xs text-muted">{meta.hint}</p>
      <button type="button" onClick={onAdd} className="dm-btn dm-btn-primary dm-btn-sm">
        Add listing
      </button>
      {!hasShops && tab === "all" ? (
        <Link href="/open-shop" className="text-[11px] font-medium text-muted hover:text-foreground">
          Open a shop for analytics, organization, and a public storefront
        </Link>
      ) : null}
    </div>
  );
}

