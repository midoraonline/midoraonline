"use client";

import Image from "next/image";
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
    >
      <div className="grid gap-3">
        {shops.map((shop) => (
          <button
            key={shop.id}
            type="button"
            onClick={() => onSelect(shop.id)}
            className="dm-focus flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left hover:border-accent/40"
          >
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {shop.name.substring(0, 2).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">{shop.name}</span>
              <span className="block truncate text-xs text-muted">Shop storefront</span>
            </span>
          </button>
        ))}
      </div>
    </StepFrame>
  );
}
