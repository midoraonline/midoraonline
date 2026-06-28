"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { apiProducts } from "@/lib/api";
import { notifyFeedEngagement } from "@/lib/engagementEvents";
import { useAppSession } from "@/lib/state";

const btnBase =
  "group relative inline-flex items-center gap-1.5 rounded-full border transition-all duration-200 ease-out select-none";

export default function ProductLikeButton({
  productId,
  className = "",
  size = "default",
  variant = "default",
  initialLiked,
  initialLikeCount,
}: {
  productId: string;
  className?: string;
  size?: "default" | "compact";
  variant?: "default" | "floating" | "outline";
  initialLiked?: boolean;
  initialLikeCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppSession();
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [count, setCount] = useState<number | null>(initialLikeCount ?? null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const heartRef = useRef<HTMLSpanElement>(null);

  const sync = useCallback(async () => {
    try {
      const e = await apiProducts.getProductEngagement(productId);
      setLiked(Boolean(e.viewer_liked));
      setCount(typeof e.like_count === "number" ? e.like_count : 0);
    } catch {
      setCount(null);
    }
  }, [productId]);

  useEffect(() => {
    if (!session.hydrated) return;
    if (!session.isAuthenticated) return;
    if (initialLiked !== undefined && (initialLikeCount ?? 0) > 0) return;
    sync();
  }, [session.hydrated, session.isAuthenticated, sync, initialLiked, initialLikeCount]);

  async function toggle() {
    if (!session.isAuthenticated) {
      const nextPath = pathname && pathname.startsWith("/") ? pathname : `/products/${productId}`;
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (isPending) return;

    const prevLiked = liked;
    const prevCount = count;
    const next = !liked;

    // Optimistic update
    setLiked(next);
    setCount((c) => Math.max(0, (c ?? 0) + (next ? 1 : -1)));
    setIsPending(true);

    // Trigger heart pop animation
    if (next) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }

    try {
      if (next) {
        await apiProducts.likeProduct(productId);
      } else {
        await apiProducts.unlikeProduct(productId);
      }
      notifyFeedEngagement();
      void sync();
    } catch {
      // Rollback on error
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setIsPending(false);
    }
  }

  const sizeClasses = size === "compact" 
    ? "px-2 py-1 text-[11px]" 
    : "px-3 py-1.5 text-[13px]";

  const iconSize = size === "compact" ? "!text-[16px]" : "!text-[20px]";

  // Dynamic styles based on state
  const stateClasses = liked
    ? "border-rose-200 bg-rose-50 text-rose-600 shadow-sm shadow-rose-100"
    : "border-foreground/[0.08] bg-foreground/[0.03] text-foreground/70 hover:border-rose-200/60 hover:bg-rose-50/50 hover:text-rose-500";

  const disabledClasses = isPending ? "opacity-70 cursor-wait" : "cursor-pointer active:scale-95";

  const ariaLabel = session.isAuthenticated
    ? liked
      ? `Remove from watchlist. ${count ?? 0} likes`
      : `Save for later. ${count ?? 0} likes`
    : "Sign in to save for later";

  if (variant === "floating") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void toggle();
        }}
        className={`dm-focus flex size-9 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-105 active:scale-95 ${
          liked ? "text-rose-500" : "text-neutral-500"
        } ${className}`}
        aria-pressed={liked}
        title={liked ? "Remove from watchlist" : "Save for later"}
      >
        <MaterialSymbol name="favorite" className="!text-[20px]" filled={liked} />
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void toggle();
        }}
        className={`dm-focus flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100 ${
          liked ? "border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-50" : ""
        } ${className}`}
        aria-pressed={liked}
      >
        <MaterialSymbol name="favorite" className="!text-[16px]" filled={liked} />
        <span>{liked ? "Saved" : "Save"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={isPending}
      className={[
        btnBase,
        sizeClasses,
        stateClasses,
        disabledClasses,
        className,
      ].join(" ")}
      aria-pressed={liked}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span
        ref={heartRef}
        className={[
          "relative inline-flex leading-none transition-transform duration-200",
          isAnimating ? "animate-heart-pop" : "",
          liked ? "text-rose-500" : "",
        ].join(" ")}
      >
        <MaterialSymbol
          name="favorite"
          className={`${iconSize} leading-none`}
          filled={liked}
        />
        
        {/* Particle burst effect on like */}
        {isAnimating && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/30" />
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-rose-400"
                  style={{
                    animation: `heart-particle 400ms ease-out forwards`,
                    animationDelay: `${i * 16}ms`,
                    transform: `rotate(${i * 60}deg) translateY(-12px)`,
                  }}
                />
              ))}
            </span>
          </>
        )}
      </span>

      {count !== null && (
        <span
          className={[
            "tabular-nums font-medium transition-colors duration-200",
            liked ? "text-rose-600" : "text-foreground/50",
            isAnimating ? "animate-count-bump" : "",
          ].join(" ")}
        >
          {count.toLocaleString()}
        </span>
      )}
    </button>
  );
}