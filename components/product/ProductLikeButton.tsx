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
}: {
  productId: string;
  className?: string;
  /** `compact` for tight card rows */
  size?: "default" | "compact";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppSession();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState<number | null>(null);

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
    // Defer sync to prevent cascading renders
    Promise.resolve().then(() => {
      sync();
    });
  }, [session.hydrated, sync]);

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

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      className={[btnBase, liked ? "border-rose-300/40 bg-rose-500/10 text-rose-700" : "", className].join(
        " "
      )}
      aria-pressed={liked}
      title={session.isAuthenticated ? (liked ? "Remove from watchlist" : "Save for later — stuff I'm watching") : "Sign in to save for later"}
    >
      <MaterialSymbol name="favorite" className={`${iconClass} leading-none`} filled={liked} />
      {count !== null && (
        <span className="tabular-nums text-[11px] text-muted">{count}</span>
      )}
    </button>
  );
}
