"use client";

import { useCallback, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { apiLeads, apiListingEvents } from "@/lib/api";
import { track } from "@/lib/analytics";
import { notifyFeedEngagement } from "@/lib/engagementEvents";
import { whatsappDigits } from "@/lib/whatsappProduct";

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
    const waUrl = `https://wa.me/${whatsappDigits(whatsappNumber)}?text=${encoded}`;

    apiLeads.createLead(shopId, productId, "whatsapp").catch(() => {});
    apiListingEvents.recordListingEvent(productId, "whatsapp_clicked").catch(() => {});
    track("conversion:whatsapp_click", {
      productId,
      shopId,
      clickSource: "product_detail",
    });
    notifyFeedEngagement();

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
          className="z-modal fixed inset-0 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-contact-title"
          onClick={() => setShowConsent(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl border border-border bg-surface p-5 shadow-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <MaterialSymbol name="security" className="!text-lg" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="seller-contact-title" className="text-sm font-semibold text-foreground">
                  Contact seller
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  Opening WhatsApp for <strong className="text-foreground">{title}</strong>.
                  Your inquiry is logged so the seller can follow up.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConsent(false)}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
              >
                <MaterialSymbol name="close" className="!text-base" />
              </button>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              Only genuine inquiries please — spam or fraud may suspend your account.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowConsent(false)}
                className="dm-btn dm-btn-ghost dm-btn-sm flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConsented(true);
                  handleOpenWhatsApp();
                }}
                className="dm-btn dm-btn-sm flex-1 gap-1.5 text-white shadow-sm hover:brightness-95"
                style={{ background: "#25D366" }}
              >
                <WhatsAppIcon className="size-3.5" />
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
