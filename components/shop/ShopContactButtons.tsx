"use client";

import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/state";
import { apiChat, apiShops } from "@/lib/api";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import TradeDisclaimer from "@/components/TradeDisclaimer";

type Props = {
  shopId: string;
  ownerId: string | null | undefined;
  whatsappNumber: string | null | undefined;
  waHref: string | null;
};

export default function ShopContactButtons({ shopId, ownerId, whatsappNumber, waHref }: Props) {
  const router = useRouter();
  const session = useAppSession();

  const recordWhatsAppClick = () => {
    apiShops.recordShopEvent(shopId, "whatsapp_clicked").catch(() => {});
  };

  const doCreateConversation = async () => {
    apiShops.recordShopEvent(shopId, "messaged").catch(() => {});
    if (!session.isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!ownerId) return;
    try {
      const conv = await apiChat.createConversation({
        seller_id: ownerId,
        shop_id: shopId,
      });
      if (!conv || "error" in conv) {
        return;
      }
      router.push(`/chat?conversation=${conv.id}`);
    } catch {}
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
            onConfirm={doCreateConversation}
          >
            {(open) => (
              <button
                type="button"
                onClick={open}
                className="dm-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-[filter] hover:brightness-95"
              >
                <MaterialSymbol name="chat" className="!text-sm shrink-0" />
                Message seller
              </button>
            )}
          </TradeDisclaimer>
        )}
      </div>
    </div>
  );
}