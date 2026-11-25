"use client";

import { intentPreview } from "@/lib/listingIntentForm";
import type { ListingDraft } from "@/lib/schemas/listingForm";

const PREVIEW_COVER: Record<string, string> = {
  product: "bg-listing-product text-listing-product-foreground",
  service: "bg-listing-service text-listing-service-foreground",
  opportunity: "bg-listing-opportunity text-listing-opportunity-foreground",
};

/** Desktop side preview in the post form. Intent text and CTA follow the card rules. */
export default function ListingPreviewCard({ draft }: { draft: ListingDraft }) {
  const cover = draft.image_urls.find((u) => !/\.(mp4|webm|mov)(\?|$)/i.test(u));
  const price = Number(String(draft.price_ugx).replace(/[^0-9.]/g, ""));
  const intent = draft.kind === "product" ? null : intentPreview(draft.kind, draft.meta, draft.category);
  const title = draft.title.trim() || "Your listing title";
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      <div className={`relative aspect-[4/3] ${cover ? "bg-surface-muted" : PREVIEW_COVER[draft.kind] ?? "bg-accent/10 text-accent"}`}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="size-full object-cover" />
        ) : intent ? (
          <div className="flex size-full flex-col items-start justify-start gap-1 p-4 text-left">
            {intent.intentLabel ? (
              <span className="text-[13px] font-bold uppercase tracking-wide">{intent.intentLabel}</span>
            ) : null}
            <span className="line-clamp-2 text-lg font-bold leading-tight" title={title}>{title}</span>
          </div>
        ) : (
          <div className="grid size-full place-items-center p-4 text-center">
            <span className="line-clamp-2 text-lg font-bold uppercase tracking-tight">
              {draft.category || draft.kind}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        {intent?.categoryLabel ? <p className="truncate text-xs font-medium text-muted">{intent.categoryLabel}</p> : null}
        <p className="line-clamp-2 text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {price > 0 ? `UGX ${new Intl.NumberFormat("en-UG").format(price)}` : "Price"}
        </p>
        <p className="truncate text-xs text-muted">{draft.location_name || "Location"}</p>
        {intent ? (
          <span className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white">
            {intent.ctaLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
