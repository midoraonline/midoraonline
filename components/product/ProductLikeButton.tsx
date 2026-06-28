"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { apiProducts } from "@/lib/api";
import { useAppSession } from "@/lib/state";

const btnBase =
  "inline-flex items-center gap-1 rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-2 py-1 text-[11px] font-semibold text-foreground/85 transition-colors hover:bg-foreground/[0.08] dm-focus";

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
    Promise.resolve().then(() => {
      sync();
    });
  }, [session.hydrated, session.isAuthenticated, sync, initialLiked, initialLikeCount]);

  async function toggle() {
    if (!session.isAuthenticated) {
      const nextPath = pathname && pathname.startsWith("/") ? pathname : `/products/${productId}`;
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    const prevLiked = liked;
    const prevCount = count;
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, (c ?? 0) + (next ? 1 : -1)));
    try {
      if (next) await apiProducts.likeProduct(productId);
      else await apiProducts.unlikeProduct(productId);
      void sync();
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    }
  }

  const iconClass = size === "compact" ? "!text-[16px]" : "!text-[18px]";

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
      className={[btnBase, liked ? "border-rose-300/40 bg-rose-500/10 text-rose-700" : "", className].join(" ")}
      aria-pressed={liked}
      title={session.isAuthenticated ? (liked ? "Remove from watchlist" : "Save for later") : "Sign in to save for later"}
    >
      <MaterialSymbol name="favorite" className={`${iconClass} leading-none`} filled={liked} />
      {count !== null && (
        <span className="tabular-nums text-[11px] text-muted">{count}</span>
      )}
    </button>
  );
}
