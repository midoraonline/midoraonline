"use client";

import type { ProductStatus } from "@/lib/api/products";

type StatusMeta = {
  label: string;
  pillClass: string;
  dot?: "pulse" | "solid" | "none";
};

export const STATUS_CONFIG: Record<ProductStatus, StatusMeta> = {
  active: {
    label: "Live",
    pillClass:
      "bg-[color:var(--success)]/12 text-[color:var(--success)] ring-1 ring-inset ring-[color:var(--success)]/25",
    dot: "solid",
  },
  pending_review: {
    label: "Reviewing",
    pillClass:
      "bg-[color:var(--warning)]/12 text-[color:var(--warning)] ring-1 ring-inset ring-[color:var(--warning)]/25",
    dot: "pulse",
  },
  rejected: {
    label: "Not approved",
    pillClass:
      "bg-[color:var(--error)]/12 text-[color:var(--error)] ring-1 ring-inset ring-[color:var(--error)]/25",
    dot: "solid",
  },
  draft: {
    label: "Draft",
    pillClass:
      "bg-foreground/[0.06] text-foreground/70 ring-1 ring-inset ring-foreground/10",
  },
  hidden: {
    label: "Hidden",
    pillClass:
      "bg-foreground/[0.06] text-foreground/70 ring-1 ring-inset ring-foreground/10",
  },
  expired: {
    label: "Expired",
    pillClass:
      "bg-foreground/[0.06] text-foreground/60 ring-1 ring-inset ring-foreground/10",
  },
  sold: {
    label: "Sold",
    pillClass:
      "bg-foreground/[0.06] text-foreground/60 ring-1 ring-inset ring-foreground/10",
  },
};

export default function StatusBadge({
  status,
  is_published,
}: {
  status?: ProductStatus | null;
  is_published?: boolean | null;
}) {
  const cfg = status ? STATUS_CONFIG[status] : null;
  const resolved = cfg ?? (is_published ? STATUS_CONFIG.active : STATUS_CONFIG.draft);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${resolved.pillClass}`}
    >
      {resolved.dot === "pulse" ? (
        <span className="relative inline-flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : resolved.dot === "solid" ? (
        <span className="inline-flex size-1.5 rounded-full bg-current" />
      ) : null}
      {resolved.label}
    </span>
  );
}
