"use client";

import { useCallback, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { apiLeads, apiListingEvents } from "@/lib/api";

type Props = {
  shopId: string;
  productId: string;
  whatsappNumber: string;
  listingUrl?: string;
  title: string;
  children?: React.ReactNode;
};

export default function SellerContactConsent({
  shopId,
  productId,
  whatsappNumber,
  listingUrl,
  title,
  children,
}: Props) {
  const [showConsent, setShowConsent] = useState(false);
  const [consented, setConsented] = useState(false);

  const handleOpenWhatsApp = useCallback(() => {
    const text = `Hi, I'm interested in "${title}"${listingUrl ? `\n\n${listingUrl}` : ""}`;
    const encoded = encodeURIComponent(text);
    const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encoded}`;

    apiLeads.createLead(shopId, productId, "whatsapp").catch(() => {});
    apiListingEvents.recordListingEvent(productId, "whatsapp_clicked").catch(() => {});

    window.open(waUrl, "_blank", "noopener,noreferrer");
    setShowConsent(false);
  }, [shopId, productId, whatsappNumber, listingUrl, title]);

  if (consented) {
    return <>{children}</>;
  }

  return (
    <>
      <div onClick={() => setShowConsent(true)}>{children}</div>

      {showConsent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowConsent(false)}
        >
          <div
            className="dm-card w-full max-w-sm space-y-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MaterialSymbol name="security" className="!text-xl text-accent" />
                <h3 className="text-sm font-semibold">Contact Seller</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConsent(false)}
                className="text-foreground/50 hover:text-foreground"
              >
                <MaterialSymbol name="close" className="!text-lg" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-muted">
              You are about to contact the seller of <strong>{title}</strong> via WhatsApp.
              Your inquiry will be recorded so the seller can respond. Do you want to proceed?
            </p>

            <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700">
              <MaterialSymbol name="info" className="!text-base shrink-0" />
              <span>
                Only contact sellers for genuine inquiries. Fraudulent or spam messages may result in account suspension.
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConsent(false)}
                className="dm-pill dm-focus flex-1 border border-foreground/[0.12] px-4 py-2 text-xs font-semibold hover:bg-foreground/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConsented(true);
                  handleOpenWhatsApp();
                }}
                className="dm-pill dm-focus flex-1 bg-[#25D366] px-4 py-2 text-xs font-semibold text-white hover:brightness-95"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <WhatsAppIcon className="size-3.5" />
                  Proceed to WhatsApp
                </span>
              </button>
            </div>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5 size-3.5"
              />
              <span className="text-[10px] text-muted leading-relaxed">
                I understand that my inquiry will be recorded and I agree to the Terms of Service.
              </span>
            </label>
          </div>
        </div>
      )}
    </>
  );
}
