"use client";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import MessageSellerButton from "@/components/chat/MessageSellerButton";
import TradeDisclaimer from "@/components/TradeDisclaimer";
import { apiShops } from "@/lib/api";

type Props = {
  shopId: string;
  ownerId: string | null | undefined;
  whatsappNumber: string | null | undefined;
  waHref: string | null;
};

export default function ShopContactButtons({ shopId, ownerId, whatsappNumber, waHref }: Props) {
  const recordWhatsAppClick = () => {
    apiShops.recordShopEvent(shopId, "whatsapp_clicked").catch(() => {});
  };

  const recordMessageClick = () => {
    apiShops.recordShopEvent(shopId, "messaged").catch(() => {});
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-2 pt-1">
      <div className="flex gap-2">
        {waHref && (
          <TradeDisclaimer
            type="whatsapp"
            onConfirm={() => {
              recordWhatsAppClick();
              window.open(waHref, "_blank", "noopener,noreferrer");
            }}
          >
            {(open) => (
              <button
                type="button"
                onClick={open}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-95"
              >
                <WhatsAppIcon className="size-4 shrink-0 text-white" />
                WhatsApp
              </button>
            )}
          </TradeDisclaimer>
        )}
        {ownerId && (
          <TradeDisclaimer
            type="message"
            onConfirm={() => {
              recordMessageClick();
            }}
          >
            {(open) => (
              <div className="flex-1" onClick={open}>
                <MessageSellerButton
                  sellerId={ownerId}
                  shopId={shopId}
                  className="w-full"
                />
              </div>
            )}
          </TradeDisclaimer>
        )}
      </div>
    </div>
  );
}