"use client";

import { ExternalLink } from "lucide-react";
import { track } from "@/lib/analytics";

/** "Apply on {host}": the poster's own application page, opened in a new tab. */
export default function ApplyLinkButton({
  href,
  host,
  productId,
  shopId,
  compact = false,
}: {
  href: string;
  host: string;
  productId: string;
  shopId?: string;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={() =>
        track("conversion:apply_link_click", { productId, shopId, host, clickSource: "product_detail" })
      }
      className={`dm-focus flex items-center justify-center gap-2 rounded-xl bg-accent font-bold text-white shadow-sm transition hover:bg-accent-hover active:scale-[0.99] ${
        compact ? "px-3.5 py-2.5 text-xs" : "w-full px-4 py-3 text-sm"
      }`}
    >
      <ExternalLink className={compact ? "size-3.5 shrink-0" : "size-4 shrink-0"} aria-hidden />
      <span className="truncate">{compact ? "Apply" : `Apply on ${host}`}</span>
    </a>
  );
}
