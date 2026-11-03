"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { track } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import TradeDisclaimer from "@/components/TradeDisclaimer";
import SignInPrompt from "@/components/SignInPrompt";

type Props = {
  shopId: string;
  ownerId: string | null | undefined;
  whatsappNumber?: string | null | undefined;
  whatsappVerified?: boolean | null;
  waHref: string | null;
  /** When true, secondary Message CTA uses light-on-dark hero styles. */
  immersive?: boolean;
};

/** Storefront contact CTAs — WhatsApp primary, Midora message secondary. */
export default function ShopContactButtons({
  shopId,
  ownerId,
  waHref,
  whatsappVerified,
  immersive = false,
}: Props) {
  const router = useRouter();
  const session = useAppSession();
  const [askSignIn, setAskSignIn] = useState(false);

  const recordWhatsAppClick = () => {
    track("conversion:whatsapp_click", { shopId, clickSource: "shop_page" });
  };

  const doCreateConversation = async () => {
    if (session.hydrated && !session.isAuthenticated) {
      setAskSignIn(true);
      return;
    }
    if (!ownerId) return;
    try {
      const conv = await apiChat.createConversation({
        seller_id: ownerId,
        shop_id: shopId,
      });
      if (!conv || "error" in conv) return;
      track("listing:messaged", { shopId });
      router.push(`/chat?conversation=${conv.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setAskSignIn(true);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-2 pt-1">
      {waHref ? (
        <TradeDisclaimer
          type="whatsapp"
          whatsappVerified={whatsappVerified ?? undefined}
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
              WhatsApp
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
                  ? "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold backdrop-blur-sm transition hover:brightness-110"
                  : "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-foreground/[0.04]"
              }
              style={
                immersive
                  ? {
                      borderColor: "var(--hero-chip-border)",
                      background: "var(--hero-chip-bg)",
                      color: "var(--hero-text-strong)",
                    }
                  : undefined
              }
            >
              <MessageCircle className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Message on Midora
            </button>
          )}
        </TradeDisclaimer>
      ) : null}
      {askSignIn ? (
        <SignInPrompt action="message this seller" onClose={() => setAskSignIn(false)} />
      ) : null}
    </div>
  );
}
