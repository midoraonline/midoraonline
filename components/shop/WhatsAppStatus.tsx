"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, TriangleAlert } from "lucide-react";

import * as apiShops from "@/lib/api/shops";

type Props = {
  shopId: string;
  /** The saved number (not the unsaved edit). */
  savedNumber: string;
  verified: boolean;
  registered: boolean | null | undefined;
};

type View = "checking" | apiShops.WhatsAppCheckStatus;

function knownView(verified: boolean, registered: boolean | null | undefined): View {
  if (verified || registered === true) return "on_whatsapp";
  if (registered === false) return "not_on_whatsapp";
  return "checking";
}

/** Tells the owner whether buyers can see their number, and what happens when they can't. */
export default function WhatsAppStatus({ shopId, savedNumber, verified, registered }: Props) {
  // The async answer is tied to the number it was asked about, so a changed number never shows a stale one.
  const [answer, setAnswer] = useState<{ number: string; status: apiShops.WhatsAppCheckStatus } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const known = knownView(verified, registered);
  const view: View = known !== "checking" ? known : answer?.number === savedNumber ? answer.status : "checking";

  useEffect(() => {
    if (!savedNumber || known !== "checking") return;
    let active = true;
    apiShops
      .checkShopWhatsApp(shopId)
      .then((r) => active && setAnswer({ number: savedNumber, status: r.status }))
      .catch(() => active && setAnswer({ number: savedNumber, status: "unavailable" }));
    return () => {
      active = false;
    };
  }, [shopId, savedNumber, known, attempt]);

  if (!savedNumber) return null;

  if (view === "checking") {
    return (
      <p className="flex items-center gap-2 text-xs text-muted" role="status">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> Checking that this number is on WhatsApp…
      </p>
    );
  }
  if (view === "on_whatsapp") {
    return (
      <p className="flex items-center gap-2 text-xs text-emerald-700" role="status">
        <CheckCircle2 className="size-3.5" aria-hidden /> On WhatsApp. Buyers see a WhatsApp button.
      </p>
    );
  }
  if (view === "not_on_whatsapp") {
    return (
      <p className="flex items-start gap-2 text-xs text-amber-700" role="status">
        <MessageCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        This number isn&apos;t on WhatsApp, so it stays hidden. Buyers will message you in Midora instead. Use a
        number that has WhatsApp to show the button.
      </p>
    );
  }
  return (
    <p className="flex items-start gap-2 text-xs text-amber-700" role="status">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        We couldn&apos;t check this number just now, so it stays hidden and buyers message you in Midora.{" "}
        <button
          type="button"
          onClick={() => {
            setAnswer(null);
            setAttempt((n) => n + 1);
          }}
          className="font-semibold underline underline-offset-2"
        >
          Check again
        </button>
      </span>
    </p>
  );
}
