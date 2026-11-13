"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";

import VerifyContactButton from "@/components/VerifyContactButton";
import * as apiShops from "@/lib/api/shops";

type Props = {
  shopId: string;
  /** The saved number (not the unsaved edit). The code goes to this number. */
  savedNumber: string;
  verified: boolean;
  registered: boolean | null | undefined;
  onVerified: (shop: apiShops.Shop) => void;
};

/** Owner proves the shop's WhatsApp number with a code sent on WhatsApp; until then buyers can't see it. */
export default function WhatsAppStatus({ shopId, savedNumber, verified, registered, onVerified }: Props) {
  if (!savedNumber) return null;

  if (verified || registered === true) {
    return (
      <p className="flex items-center gap-2 text-xs text-emerald-700" role="status">
        <CheckCircle2 className="size-3.5" aria-hidden /> Verified on WhatsApp. Buyers see a WhatsApp button.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="flex items-start gap-2 text-xs text-amber-700" role="status">
        <MessageCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Verify this number to show a WhatsApp button. We&apos;ll send a code to {savedNumber} on WhatsApp. Until
        then buyers message you in Midora.
      </p>
      <VerifyContactButton
        value={savedNumber}
        verified={false}
        label="WhatsApp number"
        sendCode={() => apiShops.sendShopWhatsAppCode(shopId)}
        confirmCode={async (code) => onVerified(await apiShops.verifyShopWhatsAppCode(shopId, code))}
      />
    </div>
  );
}
