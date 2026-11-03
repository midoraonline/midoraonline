"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { track } from "@/lib/analytics";

const btnBase =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-all duration-200 ease-out select-none cursor-pointer active:scale-95 border-foreground/[0.08] bg-foreground/[0.03] text-foreground/70 hover:border-accent/40 hover:bg-accent/5 hover:text-accent";

export default function ProductShareButton({
  title,
  url,
  productId,
  shopId,
  className = "",
}: {
  title: string;
  url: string;
  productId: string;
  shopId?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        track("listing:shared", { productId, shopId, method: "native" });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      track("listing:shared", { productId, shopId, method: "copy" });
      setState("copied");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      aria-label={state === "copied" ? "Link copied" : "Share this listing"}
      title={state === "copied" ? "Link copied" : "Share this listing"}
      className={[btnBase, state === "copied" ? "border-[color:var(--success)] text-[color:var(--success)]" : "", className].join(" ")}
    >
      <MaterialSymbol name={state === "copied" ? "check" : "share"} className="!text-[16px]" />
      {state === "copied" ? "Copied" : "Share"}
    </button>
  );
}
