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
    <StepFrame title="Which shop is this for?" subtitle="The listing will appear on this shop's page." onBack={onBack}>
      <div className="space-y-2">
        {shops.map((shop) => (
          <button key={shop.id} type="button" onClick={() => onSelect(shop.id)} className={OPTION_ROW}>
            {shop.logo_url ? (
              <Image src={shop.logo_url} alt="" width={36} height={36} className="size-9 shrink-0 rounded-md object-cover" />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-xs font-medium text-muted">
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
