"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAppSession } from "@/lib/state";
import { apiChat, apiShops } from "@/lib/api";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import TradeDisclaimer from "@/components/TradeDisclaimer";

type Props = {
  shopId: string;
  ownerId: string | null | undefined;
  whatsappNumber?: string | null | undefined;
  waHref: string | null;
  /** When true, secondary Message CTA uses light-on-dark hero styles. */
  immersive?: boolean;
};

/** Storefront contact CTAs — WhatsApp primary, Midora message secondary. */
export default function ShopContactButtons({
  shopId,
  ownerId,
  waHref,
  immersive = false,
}: Props) {
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
      if (!conv || "error" in conv) return;
      router.push(`/chat?conversation=${conv.id}`);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-2 pt-1">
      {waHref ? (
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
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#22c35e] active:scale-[0.99]"
            >
              <WhatsAppIcon className="size-4 shrink-0 text-white" />
              Chat on WhatsApp
            </button>
          )}
        </TradeDisclaimer>
      ) : null}

      {ownerId ? (
        <TradeDisclaimer type="message" onConfirm={doCreateConversation}>
          {(open) => (
            <button
              type="button"
              onClick={open}
              className={
                immersive
                  ? "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/18"
                  : "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-foreground/[0.04]"
              }
            >
              <MessageCircle className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Message on Midora
            </button>
          )}
        </TradeDisclaimer>
      ) : null}
    </div>
  );
}
