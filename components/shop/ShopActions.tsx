"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, UserPlus, UserCheck, Share2, Check, Pencil } from "lucide-react";

import { apiShops } from "@/lib/api";

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

  // persist follow/like per shop in localStorage
  useEffect(() => {
    setLiked(localStorage.getItem(`shop_liked_${shopSlug}`) === "1");
    setFollowed(localStorage.getItem(`shop_followed_${shopSlug}`) === "1");
  }, [shopSlug]);

  // check if the current signed-in user owns this shop
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
      // user cancelled or API unavailable — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2200);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* edit — owner only */}
      {isOwner && (
        <Link
          href={`/shops/${shopSlug}/edit`}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-2 py-2 sm:px-3 text-xs font-medium dm-focus transition-all text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
          aria-label="Edit shop"
        >
          <Pencil className="size-3.5" />
          <span className="hidden sm:inline">Edit shop</span>
        </Link>
      )}

      {/* like */}
      <button
        type="button"
        onClick={toggleLike}
        aria-label={liked ? "Unlike shop" : "Like shop"}
        aria-pressed={liked}
        className={[
          "inline-flex items-center gap-1.5 rounded-2xl border px-2 py-2 sm:px-3 text-xs font-medium dm-focus transition-all",
          liked
            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70"
            : "border-border bg-surface text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
        ].join(" ")}
      >
        <Heart
          className={["size-3.5 transition-transform", liked ? "fill-current scale-110" : ""].join(" ")}
        />
        <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
      </button>

      {/* follow */}
      <button
        type="button"
        onClick={toggleFollow}
        aria-label={followed ? "Unfollow shop" : "Follow shop"}
        aria-pressed={followed}
        className={[
          "inline-flex items-center gap-1.5 rounded-2xl border px-2 py-2 sm:px-3 text-xs font-medium dm-focus transition-all",
          followed
            ? "border-border bg-foreground text-background hover:opacity-90"
            : "border-border bg-surface text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
        ].join(" ")}
      >
        {followed ? (
          <UserCheck className="size-3.5" />
        ) : (
          <UserPlus className="size-3.5" />
        )}
        <span className="hidden sm:inline">
          {followed ? "Following" : "Follow"}
        </span>
      </button>

      {/* share */}
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share shop"
        className={[
          "inline-flex items-center gap-1.5 rounded-2xl border px-2 py-2 sm:px-3 text-xs font-medium dm-focus transition-all",
          shareState === "copied"
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400"
            : "border-border bg-surface text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
        ].join(" ")}
      >
        {shareState === "copied" ? (
          <Check className="size-3.5" />
        ) : (
          <Share2 className="size-3.5" />
        )}
        <span className="hidden sm:inline">
          {shareState === "copied" ? "Copied!" : "Share"}
        </span>
      </button>
    </div>
  );
}
