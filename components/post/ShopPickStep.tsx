"use client";

import { PiCaretRightBold, PiInfoFill, PiSquaresFourFill, PiStorefrontFill } from "react-icons/pi";
import StepFrame from "@/components/post/StepFrame";
import { ShopAvatar } from "@/components/shop/ShopAvatar";
import type { ListingKind } from "@/lib/listingMeta";
import { shopAcceptsKind, shopTypeLabel } from "@/lib/shop/shopFit";
import type { UserShopSummary } from "@/lib/shop/personalShop";

const KIND_PLURAL: Record<ListingKind, string> = {
  product: "products",
  service: "services",
  opportunity: "opportunities",
};

const TILE =
  "dm-focus group flex w-full items-center gap-4 rounded-xl border-2 bg-surface px-4 py-4 text-left shadow-xs transition-colors";

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
          ? "Pick one of your shops, or post it on its own."
          : `None of your shops sell ${what}. You can still post it on its own.`
      }
      onBack={onBack}
      wide
      plain
    >
      {fitting.length > 0 ? (
        <>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <PiStorefrontFill className="size-4" aria-hidden /> Your shops
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fitting.map((shop) => (
              <button
                key={shop.id}
                type="button"
                onClick={() => onSelect(shop.id)}
                className={`${TILE} border-border hover:border-accent/60 hover:bg-accent/[0.03]`}
              >
                <ShopAvatar shop={shop} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-foreground">{shop.name}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{shopTypeLabel(shop.shop_type)}</span>
                </span>
                <PiCaretRightBold
                  className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </>
      ) : null}

      <div className={fitting.length > 0 ? "mt-5" : ""}>
        {fitting.length > 0 ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Or</p>
        ) : null}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`${TILE} border-dashed border-border-input hover:border-accent/60 hover:bg-accent/[0.03]`}
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent" aria-hidden>
            <PiSquaresFourFill className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-foreground">Post on its own</span>
            <span className="mt-0.5 block text-sm text-muted">
              Not under any shop. It shows in Other listings and you can move it to a shop later.
            </span>
          </span>
          <PiCaretRightBold
            className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
            aria-hidden
          />
        </button>
      </div>

      {skipped > 0 ? (
        <p className="mt-4 flex items-start gap-1.5 text-xs text-muted">
          <PiInfoFill className="mt-px size-3.5 shrink-0" aria-hidden />
          {skipped} of your shops {skipped === 1 ? "doesn't" : "don't"} sell {what}, so{" "}
          {skipped === 1 ? "it isn't" : "they aren't"} listed.
        </p>
      ) : null}
    </StepFrame>
  );
}
