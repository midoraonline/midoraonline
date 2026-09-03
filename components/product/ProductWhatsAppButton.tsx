"use client";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { apiListingEvents } from "@/lib/api";
import { track } from "@/lib/analytics";
import { notifyFeedEngagement } from "@/lib/engagementEvents";
import TradeDisclaimer from "@/components/TradeDisclaimer";

type Props = {
  waHref: string;
  productId: string;
  shopId?: string;
  category?: string;
  hasDiscount?: boolean;
  clickSource?: "product_detail" | "shop_page" | "search_result";
  className?: string;
};

export default function ProductWhatsAppButton({
  waHref,
  productId,
  shopId,
  category,
  hasDiscount,
  clickSource = "product_detail",
  className = "",
}: Props) {
  const doOpen = () => {
    apiListingEvents.recordListingEvent(productId, "whatsapp_clicked").catch(() => {});
    if (shopId) {
      track("conversion:whatsapp_click", {
        productId,
        shopId,
        category,
        hasDiscount,
        clickSource,
      });
    }
    notifyFeedEngagement();
    window.open(waHref, "_blank", "noopener,noreferrer");
  };

  return (
    <TradeDisclaimer type="whatsapp" onConfirm={doOpen}>
      {(open) => (
        <button
          type="button"
          onClick={open}
          className={`dm-focus inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-[11px] font-semibold text-white transition-[filter] hover:brightness-95 ${className}`}
        >
          <WhatsAppIcon className="size-3.5 shrink-0 text-white" />
          WhatsApp
        </button>
      )}
    </TradeDisclaimer>
  );
}
