"use client";

import Image from "next/image";
import { ChevronRight, Tag } from "lucide-react";
import StepFrame, { OPTION_ROW } from "@/components/post/StepFrame";
import type { ListingKind } from "@/lib/listingMeta";
import { shopAcceptsKind, shopTypeLabel } from "@/lib/shop/shopFit";
import type { UserShopSummary } from "@/lib/shop/personalShop";

const KIND_PLURAL: Record<ListingKind, string> = {
  product: "products",
  service: "services",
  opportunity: "opportunities",
};

/** `onSelect(null)` is the "Other" choice: the ad belongs to no shop. */
export default function ShopPickStep({
  shops,
  kind,
  onSelect,
  onBack,
}: {
  shops: UserShopSummary[];
  kind: ListingKind | null;
  onSelect: (shopId: string | null) => void;
  onBack: () => void;
}) {
  const fitting = shops.filter((s) => shopAcceptsKind(s.shop_type, kind));
  const skipped = shops.length - fitting.length;
  const what = kind ? KIND_PLURAL[kind] : "ads";
  return (
    <StepFrame
      title="Where should this ad go?"
      subtitle={
        fitting.length > 0
          ? "Pick one of your shops, or choose Other to post it on its own."
          : `None of your shops sell ${what}. Post it on its own with Other.`
      }
      onBack={onBack}
      plain
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fitting.map((shop) => (
          <button key={shop.id} type="button" onClick={() => onSelect(shop.id)} className={OPTION_ROW}>
            {shop.logo_url ? (
              <Image src={shop.logo_url} alt="" width={40} height={40} className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-border" />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
                {shop.name.substring(0, 2).toUpperCase()}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{shop.name}</span>
              <span className="block truncate text-xs text-muted">{shopTypeLabel(shop.shop_type)}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
          </button>
        ))}
        <button type="button" onClick={() => onSelect(null)} className={OPTION_ROW}>
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-muted">
            <Tag className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">Other</span>
            <span className="block truncate text-xs text-muted">Not under any shop</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
        </button>
      </div>
      {skipped > 0 ? (
        <p className="mt-3 text-xs text-muted">
          {skipped} of your shops {skipped === 1 ? "doesn't" : "don't"} sell {what}, so {skipped === 1 ? "it isn't" : "they aren't"} listed.
        </p>
      ) : null}
    </StepFrame>
  );
}
