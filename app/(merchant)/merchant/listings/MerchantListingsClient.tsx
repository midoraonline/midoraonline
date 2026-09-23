"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  ImagePlus,
  Loader2,
  Package,
  Pencil,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiProducts } from "@/lib/api";
import {
  productImageUrls,
  productPrimaryImage,
  productPriceUgx,
  type Product,
  type ProductStatus,
} from "@/lib/api/products";
import { deleteUploadThingFiles } from "@/lib/uploadthing";
import StatusBadge from "@/components/shop/StatusBadge";
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

function formatUGX(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
}

function relativeTime(iso?: string | null): string {
  if (!iso) return "just now";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "just now";
  const diffMs = Date.now() - t;
  const s = Math.max(0, Math.round(diffMs / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
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
      const perShop = await Promise.all(
        shops.map((s) => apiProducts.listShopProducts(s.id, { limit: 100, includeUnpublished: true })),
      );
      const flat = perShop
        .flatMap((res) => res.items ?? [])
        .sort((a, b) => {
          const rank = (p: Product) =>
            p.status === "pending_review" ? 0 : p.status === "rejected" ? 1 : 2;
          const rDiff = rank(a) - rank(b);
          if (rDiff !== 0) return rDiff;
          return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
        });
      setItems(flat);
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
    const media = productImageUrls(p);
    const request = apiProducts.deleteProduct(p.id);
    toast.promise(request, {
      loading: "Removing listing…",
      success: "Listing removed",
      error: (e) => (e instanceof Error ? e.message : "Delete failed."),
    });
    try {
      await request;
      if (media.length) void deleteUploadThingFiles(media);
      setPendingDelete(null);
      await reload();
    } catch {
      /* sonner */
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    if (shops.length === 1) {
      router.push(`/post-item?shop_id=${shops[0].id}`);
    } else {
      router.push("/post-item");
    }
  }

  const showMultipleShops = shops.length > 1;

  const totalViews = useMemo(
    () => items.reduce((sum, p) => sum + (p.view_count ?? 0), 0),
    [items],
  );

  return (
    <div className="flex w-full flex-col gap-4 px-3 pb-24 pt-4 sm:pt-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mt-0.5 text-xs text-muted">
            Everything you&apos;ve posted across{" "}
            {shops.length === 1 ? "your shop" : `${shops.length} shops`}. Approved
            listings go live automatically.
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
          {shops.length > 0 ? (
            <button
              type="button"
              onClick={openAdd}
              className="dm-btn dm-btn-primary dm-btn-sm inline-flex items-center gap-1"
            >
              <ImagePlus className="size-3.5" />
              Add listing
            </button>
          ) : (
            <Link href="/open-shop" className="dm-btn dm-btn-primary dm-btn-sm">
              Open a shop
            </Link>
          )}
        </div>
      </header>

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard
          icon={<Package className="size-4" aria-hidden />}
          label="Total"
          value={counts.all}
          tone="neutral"
          active={tab === "all"}
          onClick={() => setTab("all")}
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" aria-hidden />}
          label="Live"
          value={counts.live}
          tone="success"
          active={tab === "live"}
          onClick={() => setTab("live")}
        />
        <StatCard
          icon={<Clock className="size-4" aria-hidden />}
          label="In review"
          value={counts.reviewing}
          tone="warning"
          active={tab === "reviewing"}
          onClick={() => setTab("reviewing")}
          pulse={counts.reviewing > 0}
        />
        <StatCard
          icon={<XCircle className="size-4" aria-hidden />}
          label="Not approved"
          value={counts.rejected}
          tone="error"
          active={tab === "rejected"}
          onClick={() => setTab("rejected")}
        />
      </div>

      {items.length > 0 ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <BarChart3 className="size-3.5" aria-hidden />
          <span>
            {totalViews.toLocaleString()} total view
            {totalViews === 1 ? "" : "s"} across your listings
          </span>
        </div>
      ) : null}

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
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
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

      {/* Listing rows: cards on mobile, table on md+ */}
      {filtered.length === 0 ? (
        <EmptyState tab={tab} hasShops={shops.length > 0} onAdd={openAdd} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {filtered.map((p) => {
              const cover = productPrimaryImage(p);
              const mediaCount = productImageUrls(p).length;
              const shopMeta = shopById.get(p.shop_id);
              const reviewing = p.status === "pending_review";
              const rejected = p.status === "rejected";
              return (
                <li
                  key={p.id}
                  className="dm-card group relative overflow-hidden p-3 transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <div className="flex gap-3">
                    <Link
                      href={`/merchant/listings/${p.id}/edit`}
                      className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-subtle"
                      title="Edit listing"
                    >
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element -- CDN
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted">
                          No image
                        </div>
                      )}
                      {mediaCount > 1 ? (
                        <span className="absolute bottom-1 right-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          +{mediaCount - 1}
                        </span>
                      ) : null}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/merchant/listings/${p.id}/edit`}
                            className="block truncate text-sm font-bold text-foreground hover:text-accent"
                          >
                            {p.title || "Untitled"}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                            <StatusBadge status={p.status} is_published={p.is_published} />
                            {showMultipleShops && shopMeta ? (
                              <span className="truncate text-[10px]">{shopMeta.name}</span>
                            ) : null}
                            <span className="inline-flex items-center gap-1 text-[10px]">
                              <Eye className="size-3" aria-hidden />
                              {p.view_count ?? 0}
                            </span>
                          </div>
                        </div>
                        <p className="whitespace-nowrap text-sm font-semibold">
                          {formatUGX(productPriceUgx(p))}
                        </p>
                      </div>
                      {reviewing && !p.review_notes ? (
                        <p className="text-[11px] text-[color:var(--warning)]">
                          <span className="font-semibold">In review</span>
                          <span className="opacity-80"> · awaiting review</span>
                        </p>
                      ) : null}
                      {(reviewing || rejected) && p.review_notes ? (
                        <p
                          className={`line-clamp-2 text-[11px] ${
                            rejected ? "text-[color:var(--error)]" : "text-[color:var(--warning)]"
                          }`}
                        >
                          {rejected ? "Not approved: " : "Note: "}
                          {p.review_notes}
                        </p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/merchant/listings/${p.id}/edit`}
                          className="dm-focus inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-foreground/75 hover:bg-foreground/[0.06]"
                        >
                          <Pencil className="size-3" />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(p)}
                          className="dm-focus inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[color:var(--error)] hover:bg-[color:var(--error-subtle)]"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </button>
                        {rejected ? (
                          <Link
                            href={`/merchant/listings/${p.id}/edit`}
                            className="dm-btn dm-btn-primary dm-btn-sm ml-auto"
                          >
                            Resubmit
                          </Link>
                        ) : (
                          <Link
                            href={`/products/${p.id}`}
                            className="ml-auto text-[11px] font-medium text-foreground/60"
                            target="_blank"
                            rel="noopener"
                          >
                            Preview
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="dm-card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-subtle/80 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Listing</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Price</th>
                  <th className="px-3 py-3 font-semibold">Views</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const cover = productPrimaryImage(p);
                  const shopMeta = shopById.get(p.shop_id);
                  const reviewing = p.status === "pending_review";
                  const rejected = p.status === "rejected";
                  return (
                    <tr key={p.id} className="hover:bg-foreground/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/merchant/listings/${p.id}/edit`}
                            className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-subtle"
                          >
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element -- CDN
                              <img src={cover} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] text-muted">
                                —
                              </div>
                            )}
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/merchant/listings/${p.id}/edit`}
                              className="block truncate font-semibold text-foreground hover:text-accent"
                            >
                              {p.title || "Untitled"}
                            </Link>
                            <p className="truncate text-[11px] text-muted">
                              {showMultipleShops && shopMeta ? shopMeta.name : relativeTime(p.created_at)}
                              {reviewing && !p.review_notes ? " · Awaiting review" : ""}
                              {p.review_notes ? ` · ${p.review_notes}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={p.status} is_published={p.is_published} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-medium tabular-nums">
                        {formatUGX(productPriceUgx(p))}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted">
                        {p.view_count ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/merchant/listings/${p.id}/edit`}
                            className="dm-focus inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-foreground/[0.06]"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(p)}
                            className="dm-focus inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[color:var(--error)] hover:bg-[color:var(--error-subtle)]"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          {rejected ? (
                            <Link
                              href={`/merchant/listings/${p.id}/edit`}
                              className="dm-btn dm-btn-primary dm-btn-sm"
                            >
                              Resubmit
                            </Link>
                          ) : (
                            <Link
                              href={`/products/${p.id}`}
                              className="dm-focus rounded-lg px-2 py-1.5 text-xs font-medium text-foreground/60 hover:text-foreground"
                              target="_blank"
                              rel="noopener"
                            >
                              Preview
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
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
  if (!hasShops) {
    return (
      <div className="dm-card flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <ImagePlus className="size-6" aria-hidden />
        </div>
        <p className="text-sm font-bold text-foreground">No shop yet</p>
        <p className="max-w-xs text-xs text-muted">
          Open a shop first — that&apos;s where your listings live.
        </p>
        <Link href="/open-shop" className="dm-btn dm-btn-primary dm-btn-sm">
          Open a shop
        </Link>
      </div>
    );
  }
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
    </div>
  );
}

type StatTone = "neutral" | "success" | "warning" | "error";

function StatCard({
  icon,
  label,
  value,
  tone,
  active,
  pulse,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: StatTone;
  active?: boolean;
  pulse?: boolean;
  onClick?: () => void;
}) {
  const toneStyles: Record<StatTone, string> = {
    neutral: "text-foreground",
    success: "text-[color:var(--success)]",
    warning: "text-[color:var(--warning)]",
    error: "text-[color:var(--error)]",
  };
  const toneBg: Record<StatTone, string> = {
    neutral: "bg-foreground/5",
    success: "bg-[color:var(--success)]/10",
    warning: "bg-[color:var(--warning)]/10",
    error: "bg-[color:var(--error)]/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dm-focus relative flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all sm:gap-1.5 sm:p-4 ${
        active
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border bg-surface hover:border-accent/30 hover:shadow-xs"
      }`}
    >
      <span
        className={`inline-flex size-8 items-center justify-center rounded-lg ${toneBg[tone]} ${toneStyles[tone]}`}
      >
        {icon}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className={`text-xl font-bold tabular-nums ${toneStyles[tone]}`}>
        {value}
      </span>
      {pulse ? (
        <span className="absolute right-3 top-3 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--warning)] opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--warning)]" />
        </span>
      ) : null}
    </button>
  );
}
