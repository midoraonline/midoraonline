"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { EngagementShop } from "@/lib/api/shops";
import {
  BTN_SECONDARY,
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
import { RowThumb } from "@/components/dashboard/ui";

type Tab = "followed" | "liked";
const TAB_KEYS = ["followed", "liked"] as const;

type Props = {
  initialFollowed: EngagementShop[];
  initialLiked: EngagementShop[];
};

export default function CustomerSavedClient({ initialFollowed, initialLiked }: Props) {
  const [tab, setTab] = useTabParam(TAB_KEYS, "followed");
  const [followed, setFollowed] = useState<EngagementShop[]>(initialFollowed);
  const [liked, setLiked] = useState<EngagementShop[]>(initialLiked);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [f, l] = await Promise.all([
        apiShops.myFollowedShops(),
        apiShops.myLikedShops(),
      ]);
      setFollowed(f.items ?? []);
      setLiked(l.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh saved shops");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeList = tab === "followed" ? followed : liked;

  return (
    <div>
      <PageHeader title="Saved shops" description="Shops you follow or liked." />
      {error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}
      <UnderlineTabs
        tabs={[
          { value: "followed", label: `Following ${followed.length}` },
          { value: "liked", label: `Liked ${liked.length}` },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />
      {activeList.length === 0 ? (
        <EmptyState
          message={tab === "followed" ? "You aren't following any shops yet." : "You haven't liked any shops yet."}
          action={
            <Link href="/shops" className={BTN_SECONDARY}>
              Discover shops
            </Link>
          }
        />
      ) : (
        <ul className={LIST}>
          {activeList.map((shop) => (
            <li key={shop.id}>
              <Link href={`/shops/${shop.slug}`} className={ROW}>
                <RowThumb src={shop.logo_url} label={shop.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{shop.name}</span>
                  <span className="block truncate text-xs tabular-nums text-muted">
                    {fmt(shop.follower_count)} followers · {fmt(shop.view_count)} views
                  </span>
                </span>
                {shop.is_active ? null : <StatusDot tone="neutral">Inactive</StatusDot>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
