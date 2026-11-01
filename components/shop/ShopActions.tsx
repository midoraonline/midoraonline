"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";

import { MaterialSymbol } from "@/components/MaterialSymbol";
import { apiShops } from "@/lib/api";
import type { ShopEngagement } from "@/lib/api/shops";
import { track } from "@/lib/analytics";
import { useAppSession } from "@/lib/state";

/**
 * Customer engagement toolbar: Like, Follow, Share.
 *
 * Viewer state always comes from the client (SWR), never the SSR shop
 * payload: SSR fetches anonymously, so its viewer_* flags are always false.
 * Toggles update optimistically and revert on error. Signed-out viewers get
 * a sign-in prompt instead of a local-only toggle.
 */
export default function ShopActions({
  shopSlug,
  shopName,
  shopId,
  initialLikeCount,
  initialFollowerCount,
}: {
  shopSlug: string;
  shopName: string;
  shopId: string;
  initialLiked?: boolean | null;
  initialFollowed?: boolean | null;
  initialLikeCount?: number | null;
  initialFollowerCount?: number | null;
}) {
  const session = useAppSession();
  const router = useRouter();
  const pathname = usePathname();
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [busy, setBusy] = useState<"like" | "follow" | null>(null);

  const userId = session.isAuthenticated ? session.user?.id ?? "me" : "anon";
  const key = session.hydrated ? (["shop-engagement", shopId, userId] as const) : null;
  const { data, mutate } = useSWR<ShopEngagement>(key, () => apiShops.getShopEngagement(shopId), {
    fallbackData: {
      like_count: initialLikeCount ?? 0,
      follower_count: initialFollowerCount ?? 0,
      viewer_liked_shop: false,
      viewer_following: false,
    },
    revalidateOnMount: true,
  });

  const liked = session.isAuthenticated && Boolean(data?.viewer_liked_shop);
  const followed = session.isAuthenticated && Boolean(data?.viewer_following);
  const likeCount = Number(data?.like_count ?? 0);
  const followerCount = Number(data?.follower_count ?? 0);

  function promptSignIn(action: string) {
    toast.message(`Sign in to ${action} this business`, {
      action: {
        label: "Sign in",
        onClick: () => router.push(`/login?next=${encodeURIComponent(pathname || `/shops/${shopSlug}`)}`),
      },
    });
  }

  async function toggle(kind: "like" | "follow") {
    if (!session.isAuthenticated) {
      promptSignIn(kind === "like" ? "like" : "follow");
      return;
    }
    if (busy) return;
    const current = data ?? {};
    const on = kind === "like" ? !liked : !followed;
    const optimistic: ShopEngagement =
      kind === "like"
        ? { ...current, viewer_liked_shop: on, like_count: Math.max(0, likeCount + (on ? 1 : -1)) }
        : { ...current, viewer_following: on, follower_count: Math.max(0, followerCount + (on ? 1 : -1)) };
    setBusy(kind);
    try {
      await mutate(
        async () => {
          const res =
            kind === "like"
              ? on
                ? await apiShops.likeShop(shopId)
                : await apiShops.unlikeShop(shopId)
              : on
                ? await apiShops.followShop(shopId)
                : await apiShops.unfollowShop(shopId);
          return { ...optimistic, ...(res as ShopEngagement) };
        },
        { optimisticData: optimistic, rollbackOnError: true, revalidate: false, populateCache: true },
      );
      if (kind === "follow") track(on ? "shop:followed" : "shop:unfollowed", { shopId });
    } catch {
      toast.error(kind === "like" ? "Couldn't update your like. Try again." : "Couldn't update follow. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/shops/${shopSlug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: shopName, url });
        return;
      }
    } catch {
      /* fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2200);
    } catch {
      /* ignore */
    }
  }

  const count = (n: number) =>
    n > 0 ? <span className="tabular-nums text-xs font-semibold opacity-80">{n.toLocaleString()}</span> : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void toggle("like")}
        disabled={busy === "like"}
        aria-label={liked ? "Unlike business" : "Like business"}
        aria-pressed={liked}
        className={`dm-btn dm-btn-secondary dm-btn-sm min-h-10 ${
          liked ? "border-[color:var(--error)] bg-error-subtle text-[color:var(--error)]" : ""
        }`}
      >
        <MaterialSymbol name="favorite" className="!text-sm" filled={liked} aria-hidden="true" />
        {liked ? "Liked" : "Like shop"}
        {count(likeCount)}
      </button>

      <button
        type="button"
        onClick={() => void toggle("follow")}
        disabled={busy === "follow"}
        aria-label={followed ? "Unfollow business" : "Follow business"}
        aria-pressed={followed}
        className={`dm-btn dm-btn-sm min-h-10 ${followed ? "dm-btn-secondary border-accent bg-accent/10 text-accent" : "dm-btn-primary"}`}
      >
        <MaterialSymbol
          name={followed ? "how_to_reg" : "person_add"}
          className="!text-sm"
          filled={followed}
          aria-hidden="true"
        />
        {followed ? "Following" : "Follow shop"}
        {count(followerCount)}
      </button>

      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label={shareState === "copied" ? "Link copied" : "Share business"}
        className={`dm-btn dm-btn-secondary dm-btn-sm min-h-10 ${
          shareState === "copied" ? "border-[color:var(--success)] text-[color:var(--success)]" : ""
        }`}
      >
        <MaterialSymbol name={shareState === "copied" ? "check" : "share"} className="!text-sm" aria-hidden="true" />
        {shareState === "copied" ? "Copied" : "Share"}
      </button>
    </div>
  );
}
