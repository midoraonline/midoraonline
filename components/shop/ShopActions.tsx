"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { apiShops } from "@/lib/api";
import { notifyFeedEngagement } from "@/lib/engagementEvents";
import { useAppSession } from "@/lib/state";

/**
 * Customer engagement toolbar — Like, Follow, Share.
 *
 * Labeled `dm-btn dm-btn-secondary dm-btn-sm` buttons designed to sit on a
 * plain background (below the hero, inside the ShopHeroActionBar). All three
 * work for anonymous viewers via localStorage flags; when signed in, likes
 * and follows persist server-side.
 */
export default function ShopActions({
  shopSlug,
  shopName,
  shopId,
}: {
  shopSlug: string;
  shopName: string;
  shopId: string;
}) {
  const session = useAppSession();
  const router = useRouter();

  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const loadLocalFlags = useCallback(() => {
    setLiked(
      typeof window !== "undefined" &&
        localStorage.getItem(`shop_liked_${shopSlug}`) === "1",
    );
    setFollowed(
      typeof window !== "undefined" &&
        localStorage.getItem(`shop_followed_${shopSlug}`) === "1",
    );
  }, [shopSlug]);

  const syncEngagement = useCallback(async () => {
    try {
      const e = await apiShops.getShopEngagement(shopId);
      if (session.isAuthenticated) {
        setLiked(Boolean(e.viewer_liked_shop));
        setFollowed(Boolean(e.viewer_following));
      } else {
        loadLocalFlags();
      }
    } catch {
      loadLocalFlags();
    }
  }, [shopId, session.isAuthenticated, loadLocalFlags]);

  useEffect(() => {
    if (!session.hydrated) return;
    Promise.resolve().then(() => {
      syncEngagement();
    });
  }, [session.hydrated, syncEngagement]);

  async function toggleLike() {
    const next = !liked;
    if (session.isAuthenticated) {
      try {
        if (next) await apiShops.likeShop(shopId);
        else await apiShops.unlikeShop(shopId);
        setLiked(next);
        await syncEngagement();
        notifyFeedEngagement();
        router.refresh();
      } catch {
        /* keep prior */
      }
    } else {
      setLiked(next);
      localStorage.setItem(`shop_liked_${shopSlug}`, next ? "1" : "0");
    }
  }

  async function toggleFollow() {
    const next = !followed;
    if (session.isAuthenticated) {
      try {
        if (next) await apiShops.followShop(shopId);
        else await apiShops.unfollowShop(shopId);
        setFollowed(next);
        await syncEngagement();
        notifyFeedEngagement();
        router.refresh();
      } catch {
        /* keep prior */
      }
    } else {
      setFollowed(next);
      localStorage.setItem(`shop_followed_${shopSlug}`, next ? "1" : "0");
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void toggleLike()}
        aria-label={liked ? "Unlike shop" : "Like shop"}
        aria-pressed={liked}
        className="dm-btn dm-btn-secondary dm-btn-sm"
        style={liked ? { color: "#e11d48", borderColor: "#e11d48" } : undefined}
      >
        <MaterialSymbol
          name="favorite"
          className="!text-sm"
          filled={liked}
          aria-hidden="true"
        />
        {liked ? "Liked" : "Like"}
      </button>

      <button
        type="button"
        onClick={() => void toggleFollow()}
        aria-label={followed ? "Unfollow shop" : "Follow shop"}
        aria-pressed={followed}
        className="dm-btn dm-btn-secondary dm-btn-sm"
        style={
          followed
            ? { color: "var(--accent)", borderColor: "var(--accent)" }
            : undefined
        }
      >
        <MaterialSymbol
          name={followed ? "how_to_reg" : "person_add"}
          className="!text-sm"
          filled={followed}
          aria-hidden="true"
        />
        {followed ? "Following" : "Follow"}
      </button>

      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label={shareState === "copied" ? "Link copied" : "Share shop"}
        className="dm-btn dm-btn-secondary dm-btn-sm"
        style={
          shareState === "copied"
            ? { color: "var(--success)", borderColor: "var(--success)" }
            : undefined
        }
      >
        <MaterialSymbol
          name={shareState === "copied" ? "check" : "share"}
          className="!text-sm"
          aria-hidden="true"
        />
        {shareState === "copied" ? "Copied" : "Share"}
      </button>
    </div>
  );
}
