"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";

const btnBase =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-all duration-200 ease-out select-none cursor-pointer active:scale-95 border-foreground/[0.08] bg-foreground/[0.03] text-foreground/70 hover:border-accent/40 hover:bg-accent/5 hover:text-accent";

export default function ProductShareButton({
  title,
  url,
  className = "",
}: {
  title: string;
  url: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      /* fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
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
