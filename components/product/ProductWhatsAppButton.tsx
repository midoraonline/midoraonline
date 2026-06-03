"use client";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import TradeDisclaimer from "@/components/TradeDisclaimer";
import { apiListingEvents } from "@/lib/api";

type Props = {
  waHref: string;
  productId: string;
  standalone?: boolean;
  className?: string;
};

export default function ProductWhatsAppButton({
  waHref,
  productId,
  standalone,
  className = "",
}: Props) {
  const doOpen = () => {
    apiListingEvents.recordListingEvent(productId, "whatsapp_clicked").catch(() => {});
    window.open(waHref, "_blank", "noopener,noreferrer");
  };

  return (
    <TradeDisclaimer type="whatsapp" onConfirm={doOpen}>
      {(open) => (
        <button
          type="button"
          onClick={open}
          className={`dm-focus inline-flex items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 py-1.5 text-[10px] font-semibold text-white transition-[filter] hover:brightness-95 ${className}`}
        >
          <WhatsAppIcon className="size-3 shrink-0 text-white" />
          {standalone && "WhatsApp"}
        </button>
      )}
    </TradeDisclaimer>
  );
}
