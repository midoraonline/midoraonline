"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import WhatsAppStatus from "@/components/shop/WhatsAppStatus";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type { Shop } from "@/lib/api/shops";
import { displayPhone } from "@/lib/shop/contactCheck";

const LINK = "dm-focus rounded text-sm font-medium text-accent underline-offset-2 hover:underline";
const SKIP_NOTE = "Many buyers prefer WhatsApp. Without it, buyers can still message you on Midora.";

/** WhatsApp for this shop/profile, proved with a code sent on WhatsApp (not the account SMS check). */
export default function WhatsAppContactRow({
  shopId,
  number,
  verified,
  suggestedNumber,
  skipped,
  onSkip,
  onNumberSaved,
  onVerified,
}: {
  shopId: string | null;
  number: string | null;
  verified: boolean;
  /** Prefill when the shop has no WhatsApp number yet (account phone). */
  suggestedNumber: string | null;
  skipped: boolean;
  onSkip: (skip: boolean) => void;
  onNumberSaved: (number: string) => void;
  onVerified: (shop: Shop) => void;
}) {
  const [editing, setEditing] = useState(!verified);
  const [draft, setDraft] = useState(number ?? suggestedNumber ?? "");
  const saved = number ?? "";

  const heading = (
    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <WhatsAppIcon className="size-4 text-[color:var(--success)]" /> WhatsApp
    </p>
  );

  if (verified && !editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          {heading}
          <p className="flex items-center gap-1.5 text-sm text-foreground">
            <CheckCircle2 className="size-4 text-[color:var(--success)]" aria-label="Verified" />
            {displayPhone(saved)}
          </p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className={LINK}>
          Change number
        </button>
      </div>
    );
  }

  if (skipped) {
    return (
      <div className="space-y-1">
        {heading}
        <p className="text-sm text-muted">{SKIP_NOTE}</p>
        <button type="button" onClick={() => onSkip(false)} className={LINK}>
          Add WhatsApp
        </button>
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="space-y-1">
        {heading}
        <p className="text-sm text-muted">
          You can verify WhatsApp in your profile after your first listing goes live. {SKIP_NOTE}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {heading}
      <label htmlFor="contacts-whatsapp" className="sr-only">
        WhatsApp number
      </label>
      <PhoneNumberInput id="contacts-whatsapp" value={draft} onChange={setDraft} />
      <WhatsAppStatus
        shopId={shopId}
        savedNumber={saved}
        draftNumber={draft}
        verified={verified}
        registered={null}
        onNumberSaved={onNumberSaved}
        onVerified={(shop) => {
          setEditing(false);
          onVerified(shop);
        }}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {verified ? (
          <button
            type="button"
            onClick={() => {
              setDraft(saved);
              setEditing(false);
            }}
            className={LINK}
          >
            Keep {displayPhone(saved)}
          </button>
        ) : (
          <button type="button" onClick={() => onSkip(true)} className={LINK}>
            Skip for now
          </button>
        )}
      </div>
      {!verified ? <p className="text-xs text-muted">{SKIP_NOTE}</p> : null}
    </div>
  );
}
