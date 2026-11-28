"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";

import VerifyContactButton from "@/components/VerifyContactButton";
import * as apiShops from "@/lib/api/shops";

type Props = {
  shopId: string;
  /** The number stored on the shop. */
  savedNumber: string;
  /** The number currently in the form, saved or not. The code goes to this one. */
  draftNumber: string;
  verified: boolean;
  registered: boolean | null | undefined;
  /** A changed number was saved while sending the code; the parent should reset its verified state. */
  onNumberSaved: (whatsappNumber: string) => void;
  onVerified: (shop: apiShops.Shop) => void;
};

/** Owner proves the shop's WhatsApp number with a code sent on WhatsApp; until then buyers can't see it. */
export default function WhatsAppStatus({
  shopId,
  savedNumber,
  draftNumber,
  verified,
  registered,
  onNumberSaved,
  onVerified,
}: Props) {
  const draft = draftNumber.trim();
  const saved = savedNumber.trim();
  if (!draft) return null;
  const changed = draft !== saved;

  if (!changed && (verified || registered === true)) {
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
        {changed
          ? `Verify ${draft} to show a WhatsApp button. We'll save this number and send a code to it on WhatsApp.`
          : `Verify this number to show a WhatsApp button. We'll send a code to ${draft} on WhatsApp.`}{" "}
        Until then, buyers can message you on Midora.
      </p>
      <VerifyContactButton
        value={draft}
        verified={false}
        label="WhatsApp number"
        sendCode={async () => {
          const sent = await apiShops.sendShopWhatsAppCode(shopId, changed ? draft : undefined);
          if (changed) onNumberSaved(sent.whatsapp_number);
        }}
        confirmCode={async (code) => onVerified(await apiShops.verifyShopWhatsAppCode(shopId, code))}
      />
    </div>
  );
}
