"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { apiShops } from "@/lib/api";
import { useAppSession } from "@/lib/state";
import { canManageShopStorefront } from "@/lib/shop/storefront-access";
import { recordShopEvent } from "@/lib/api/shops";

const baseIcon =
  "inline-flex size-9 items-center justify-center rounded-lg text-orange-600/70 outline-none ring-0 shadow-none transition-all duration-200 focus:outline-none focus-visible:outline-none";

const hoverNeutral = "hover:bg-orange-500/18 hover:text-orange-600";

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
  const canManage = canManageShopStorefront(session, shopId);

  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const loadLocalFlags = useCallback(() => {
    setLiked(typeof window !== "undefined" && localStorage.getItem(`shop_liked_${shopSlug}`) === "1");
    setFollowed(
      typeof window !== "undefined" && localStorage.getItem(`shop_followed_${shopSlug}`) === "1"
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
    // Defer syncEngagement to prevent cascading renders
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
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2200);
    } catch {
    }
  }

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {canManage && (
        <Link
          href={`/shops/${shopSlug}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 px-2.5 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-500/20 hover:border-orange-500/50 dm-focus"
          title="Edit shop"
          aria-label="Edit shop"
        >
          <MaterialSymbol name="edit" className="!text-[16px] leading-none" />
          <span className="hidden sm:inline">Edit</span>
        </Link>
      )}

      <button
        type="button"
        onClick={() => void toggleLike()}
        aria-label={liked ? "Unlike shop" : "Like shop"}
        aria-pressed={liked}
        title={liked ? "Unlike" : "Like"}
        className={[
          baseIcon,
          liked
            ? "text-rose-600 hover:bg-rose-100/90 hover:text-rose-700"
            : hoverNeutral,
        ].join(" ")}
      >
        <MaterialSymbol
          name="favorite"
          className="!text-[20px] leading-none sm:!text-[22px]"
          filled={liked}
        />
      </button>

      <button
        type="button"
        onClick={() => void toggleFollow()}
        aria-label={followed ? "Unfollow shop" : "Follow shop"}
        aria-pressed={followed}
        title={followed ? "Following" : "Follow"}
        className={[
          baseIcon,
          followed
            ? "text-orange-600 hover:bg-orange-500/15 hover:text-orange-700"
            : hoverNeutral,
        ].join(" ")}
      >
        <MaterialSymbol
          name={followed ? "how_to_reg" : "person_add"}
          className="!text-[20px] leading-none sm:!text-[22px]"
          filled={followed}
        />
      </button>

      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label={shareState === "copied" ? "Link copied" : "Share shop"}
        title={shareState === "copied" ? "Copied" : "Share"}
        className={[
          baseIcon,
          shareState === "copied"
            ? "text-green-700 hover:bg-emerald-100/90 hover:text-green-800"
            : hoverNeutral,
        ].join(" ")}
      >
        {shareState === "copied" ? (
          <MaterialSymbol name="check" className="!text-[20px] leading-none sm:!text-[22px]" />
        ) : (
          <MaterialSymbol name="share" className="!text-[20px] leading-none sm:!text-[22px]" />
        )}
      </button>
    </div>
  );
}
