"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import StepFrame, { OPTION_ROW } from "@/components/post/StepFrame";
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
    <StepFrame title="Which shop is this for?" subtitle="The listing will appear on this shop's page." onBack={onBack} plain>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shops.map((shop) => (
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
              <span className="block truncate text-xs text-muted">/shops/{shop.slug}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
          </button>
        ))}
      </div>
    </StepFrame>
  );
}
