"use client";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { apiListingEvents } from "@/lib/api";

type Props = {
  waHref: string;
  productId: string;
  className?: string;
};

export default function ProductWhatsAppButton({
  waHref,
  productId,
  className = "",
}: Props) {
  const doOpen = () => {
    apiListingEvents.recordListingEvent(productId, "whatsapp_clicked").catch(() => {});
    window.open(waHref, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={doOpen}
      className={`dm-focus inline-flex items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 py-1.5 text-[10px] font-semibold text-white transition-[filter] hover:brightness-95 ${className}`}
    >
      <WhatsAppIcon className="size-3 shrink-0 text-white" />
      {"WhatsApp"}
    </button>
  );
}
