"use client";

import { ChevronRight } from "lucide-react";
import { intentPreview } from "@/lib/listingIntentForm";
import type { ListingKind, ListingMeta } from "@/lib/listingMeta";

/** Review line for services/opportunities: category → intent label → title → CTA. */
export default function IntentPreviewBlock({
  kind,
  meta,
  category,
  title,
}: {
  kind: ListingKind;
  meta: ListingMeta;
  category: string;
  title: string;
}) {
  if (kind === "product") return null;
  const p = intentPreview(kind, meta, category);
  const rows: { label: string; value: string | null; strong?: boolean }[] = [
    { label: "Category", value: p.categoryLabel },
    { label: "Card label", value: p.intentLabel, strong: true },
    { label: "Title", value: title.trim() || null },
    { label: "Button", value: p.ctaLabel },
  ];
  return (
    <section aria-label="How buyers will see it" className="rounded-xl border border-border bg-surface-subtle/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">How buyers will see it</p>
      <ol className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm" aria-live="polite">
        {rows.map((row, i) => (
          <li key={row.label} className="flex min-w-0 items-center gap-1.5">
            {i > 0 ? <ChevronRight className="size-3.5 shrink-0 text-muted" aria-hidden /> : null}
            <span className="sr-only">{row.label}: </span>
            <span
              className={`min-w-0 truncate ${
                row.value ? (row.strong ? "font-semibold uppercase tracking-wide text-accent" : "text-foreground") : "text-muted"
              }`}
              title={row.value ?? undefined}
            >
              {row.value ?? (row.label === "Card label" ? "Not chosen yet" : `No ${row.label.toLowerCase()} yet`)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
