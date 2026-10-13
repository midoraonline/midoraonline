"use client";

import type { ProductStatus } from "@/lib/api/products";
import { StatusDot, type StatusTone } from "@/components/dashboard/ui";

export const STATUS_CONFIG: Record<ProductStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Live", tone: "ok" },
  pending_review: { label: "In review", tone: "warn" },
  rejected: { label: "Not approved", tone: "bad" },
  draft: { label: "Draft", tone: "neutral" },
  hidden: { label: "Hidden", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
  sold: { label: "Sold", tone: "neutral" },
  unavailable: { label: "Unavailable", tone: "neutral" },
  filled: { label: "Filled", tone: "neutral" },
  closed: { label: "Closed", tone: "neutral" },
};

export default function StatusBadge({
  status,
  is_published,
}: {
  status?: ProductStatus | null;
  is_published?: boolean | null;
}) {
  const cfg = (status ? STATUS_CONFIG[status] : null) ?? (is_published ? STATUS_CONFIG.active : STATUS_CONFIG.draft);
  return <StatusDot tone={cfg.tone}>{cfg.label}</StatusDot>;
}
