"use client";

import Image from "next/image";
import { ArrowRight, Store } from "lucide-react";
import StepFrame from "@/components/post/StepFrame";
import type { UserShopSummary } from "@/lib/shop/personalShop";

export default function ShopPickStep({
  shops,
  onSelect,
  onBack,
}: {
  shops: UserShopSummary[];
  onSelect: (shopId: string) => void;
  onBack: () => void;
}) {
  return (
    <StepFrame
      title="Which shop is this for?"
      subtitle="You have more than one shop. Pick the storefront that owns this listing."
      onBack={onBack}
      wide
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shops.map((shop) => (
          <button
            key={shop.id}
            type="button"
            onClick={() => onSelect(shop.id)}
            className="dm-focus group flex min-h-40 flex-col justify-between gap-5 rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:border-accent/50 hover:bg-surface-subtle sm:p-5"
          >
            <span className="flex min-w-0 items-center gap-3">
              {shop.logo_url ? (
                <Image
                  src={shop.logo_url}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 shrink-0 rounded-xl border border-border object-cover"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-base font-bold text-accent">
                  {shop.name.substring(0, 2).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  <Store className="size-3.5" aria-hidden />
                  Storefront
                </span>
                <span className="block truncate text-base font-semibold text-foreground">{shop.name}</span>
                <span className="block truncate text-xs text-muted">Shop link · /shops/{shop.slug}</span>
              </span>
            </span>
            <span className="flex items-center justify-between border-t border-border pt-3 text-xs font-semibold text-accent">
              Use this shop
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </button>
        ))}
      </div>
    </StepFrame>
  );
}
