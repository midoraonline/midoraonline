"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { apiShops } from "@/lib/api";

const baseIcon =
  "inline-flex size-9 items-center justify-center rounded-lg text-foreground/70 outline-none ring-0 shadow-none transition-all duration-200 focus:outline-none focus-visible:outline-none";

/** Default + cool accent wash on hover */
const hoverNeutral = "hover:bg-accent/18 hover:text-accent";

export default function ShopActions({
  shopSlug,
  shopName,
  shopId,
}: {
  shopSlug: string;
  shopName: string;
  shopId: string;
}) {
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setLiked(localStorage.getItem(`shop_liked_${shopSlug}`) === "1");
    setFollowed(localStorage.getItem(`shop_followed_${shopSlug}`) === "1");
  }, [shopSlug]);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("midora_access_token")
        : null;
    if (!token) return;

    let cancelled = false;
    apiShops
      .myShops(token)
      .then((result) => {
        if (!cancelled) {
          setIsOwner(result.items.some((s) => s.id === shopId));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  function toggleLike() {
    const next = !liked;
    setLiked(next);
    localStorage.setItem(`shop_liked_${shopSlug}`, next ? "1" : "0");
  }

  function toggleFollow() {
    const next = !followed;
    setFollowed(next);
    localStorage.setItem(`shop_followed_${shopSlug}`, next ? "1" : "0");
  }

  async function handleShare() {
    const url = `${window.location.origin}/shops/${shopSlug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: shopName, url });
        return;
      }
    } catch {
      // fall through
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2200);
    } catch {
      // no-op
    }
  }

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {isOwner && (
        <Link
          href={`/shops/${shopSlug}/edit`}
          className={`${baseIcon} ${hoverNeutral}`}
          title="Edit shop"
          aria-label="Edit shop"
        >
          <MaterialSymbol name="edit" className="!text-[20px] leading-none sm:!text-[22px]" />
        </Link>
      )}

      <button
        type="button"
        onClick={toggleLike}
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
        onClick={toggleFollow}
        aria-label={followed ? "Unfollow shop" : "Follow shop"}
        aria-pressed={followed}
        title={followed ? "Following" : "Follow"}
        className={[
          baseIcon,
          followed
            ? "text-primary hover:bg-primary/15 hover:text-primary"
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
        onClick={handleShare}
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
