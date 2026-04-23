"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { EngagementShop } from "@/lib/api/shops";

type Tab = "followed" | "liked";

function fmt(n?: number | null) {
  return new Intl.NumberFormat().format(Number(n ?? 0));
}

function ShopCard({ shop }: { shop: EngagementShop }) {
  return (
    <Link
      href={`/shops/${shop.slug}`}
      className="dm-card group flex flex-col gap-3 p-4 transition hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        {shop.logo_url ? (
          <Image
            src={shop.logo_url}
            alt={shop.name}
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
            {shop.name[0]?.toUpperCase() ?? "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{shop.name}</p>
          <p className="truncate text-xs text-muted">/{shop.slug}</p>
        </div>
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            shop.is_active
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-foreground/[0.06] text-foreground/70",
          ].join(" ")}
        >
          {shop.is_active ? "Active" : "Inactive"}
        </span>
      </div>
      {shop.description ? (
        <p className="line-clamp-2 text-xs text-muted">{shop.description}</p>
      ) : null}
      <div className="flex items-center gap-4 border-t border-border pt-3 text-[11px] text-muted">
        <span>👁 {fmt(shop.view_count)}</span>
        <span>❤ {fmt(shop.like_count)}</span>
        <span>👥 {fmt(shop.follower_count)}</span>
      </div>
    </Link>
  );
}

export default function CustomerSavedPage() {
  const [tab, setTab] = useState<Tab>("followed");
  const [followed, setFollowed] = useState<EngagementShop[]>([]);
  const [liked, setLiked] = useState<EngagementShop[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(true);
  const [loadingLiked, setLoadingLiked] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollowed = useCallback(async () => {
    setLoadingFollowed(true);
    try {
      const res = await apiShops.myFollowedShops();
      setFollowed(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load followed shops");
    } finally {
      setLoadingFollowed(false);
    }
  }, []);

  const loadLiked = useCallback(async () => {
    setLoadingLiked(true);
    try {
      const res = await apiShops.myLikedShops();
      setLiked(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load liked shops");
    } finally {
      setLoadingLiked(false);
    }
  }, []);

  useEffect(() => {
    void loadFollowed();
    void loadLiked();
  }, [loadFollowed, loadLiked]);

  const activeList = tab === "followed" ? followed : liked;
  const isLoading = tab === "followed" ? loadingFollowed : loadingLiked;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Customer
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Saved shops
        </h1>
        <p className="mt-2 text-sm text-muted">
          Shops you follow or liked appear here so you can come back quickly.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <nav className="flex gap-1 rounded-xl border border-border p-0.5 text-xs font-semibold w-fit">
        {(["followed", "liked"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "flex items-center gap-2 rounded-lg px-4 py-2 capitalize transition-colors",
              tab === t
                ? "bg-foreground/[0.08] text-foreground shadow-sm"
                : "text-muted hover:bg-foreground/[0.04]",
            ].join(" ")}
          >
            <span>{t === "followed" ? "Following" : "Liked"}</span>
            <span className="rounded-full bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] tabular-nums">
              {t === "followed" ? followed.length : liked.length}
            </span>
          </button>
        ))}
      </nav>

      {isLoading ? (
        <div className="dm-card p-8 text-sm text-muted">Loading…</div>
      ) : activeList.length === 0 ? (
        <div className="dm-card p-8 text-center text-sm text-muted">
          <p>
            {tab === "followed"
              ? "You aren't following any shops yet."
              : "You haven't liked any shops yet."}
          </p>
          <Link
            href="/shops"
            className="dm-pill dm-focus mt-5 inline-flex bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
          >
            Discover shops →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeList.map((s) => (
            <li key={s.id}>
              <ShopCard shop={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
