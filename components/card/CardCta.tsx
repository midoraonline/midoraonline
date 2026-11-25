"use client";

import Link from "next/link";
import { FileText, MessageCircle, Reply } from "lucide-react";
import MessageSellerButton from "@/components/chat/MessageSellerButton";
import TradeDisclaimer from "@/components/TradeDisclaimer";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { track } from "@/lib/analytics";
import { CTA_LABEL, type CardCta as CtaKey } from "@/lib/listingIntent";

const ICON = "size-3.5 shrink-0 sm:size-4";

function ctaIcon(cta: CtaKey, viaWhatsApp: boolean) {
  if (cta === "respond") return <Reply className={ICON} aria-hidden />;
  if (cta === "contact") return <MessageCircle className={ICON} aria-hidden />;
  if (cta === "view_details") return <FileText className={ICON} aria-hidden />;
  // Apply now keeps the WhatsApp icon (spec decision) unless it opens Midora messages.
  return viaWhatsApp || cta === "apply" ? (
    <WhatsAppIcon className={`${ICON} text-white`} />
  ) : (
    <MessageCircle className={ICON} aria-hidden />
  );
}

export type CardCtaProps = {
  cta: CtaKey;
  waHref: string | null;
  applicationLink: { href: string; host: string } | null;
  productId: string;
  productHref: string;
  shopId?: string;
  sellerId?: string | null;
  category?: string;
  hasDiscount?: boolean;
  compact?: boolean;
};

/** Card action button: label, icon and behaviour follow the listing's CTA key. */
export default function CardCta({
  cta,
  waHref,
  applicationLink,
  productId,
  productHref,
  shopId,
  sellerId,
  category,
  hasDiscount,
  compact = false,
}: CardCtaProps) {
  const base = `dm-focus flex w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-white transition-colors active:scale-[0.98] ${
    compact ? "py-2" : "py-2.5"
  }`;
  const accent = `${base} bg-accent hover:bg-accent-hover`;
  const green = `${base} bg-[#25D366] hover:bg-[#22c35e] active:bg-[#1fae53]`;
  const label = CTA_LABEL[cta];

  if (cta === "view_details") {
    return (
      <Link href={productHref} className={accent}>
        {ctaIcon(cta, false)}
        {label}
      </Link>
    );
  }

  if (cta === "apply" && applicationLink) {
    return (
      <a
        href={applicationLink.href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={accent}
        title={`Apply on ${applicationLink.host}`}
        onClick={() =>
          track("conversion:apply_link_click", {
            productId,
            shopId,
            host: applicationLink.host,
            clickSource: "search_result",
          })
        }
      >
        {ctaIcon(cta, false)}
        {label}
      </a>
    );
  }

  if (waHref) {
    return (
      <TradeDisclaimer
        type="whatsapp"
        onConfirm={() => {
          if (shopId) {
            track("conversion:whatsapp_click", {
              productId,
              shopId,
              category,
              hasDiscount,
              clickSource: "search_result",
            });
          }
          window.open(waHref, "_blank", "noopener,noreferrer");
        }}
      >
        {(open) => (
          <button type="button" onClick={open} className={`${green} cursor-pointer`}>
            {ctaIcon(cta, true)}
            {label}
          </button>
        )}
      </TradeDisclaimer>
    );
  }

  const fallbackLabel = cta === "whatsapp" ? "Message seller" : label;
  const fallbackIcon = cta === "respond" ? ctaIcon(cta, false) : <MessageCircle className={ICON} aria-hidden />;
  if (sellerId) {
    return (
      <MessageSellerButton
        sellerId={sellerId}
        shopId={shopId}
        productId={productId}
        buttonClassName={accent}
        label={fallbackLabel}
        icon={fallbackIcon}
      />
    );
  }
  return (
    <Link href={productHref} className={accent}>
      {fallbackIcon}
      {fallbackLabel}
    </Link>
  );
}
