import { MessageCircle, Reply } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { CTA_LABEL, type CardCta } from "@/lib/listingIntent";

/** Intent text (e.g. JOB OPENING) and subcategory above the detail-page title. */
export default function ListingIntentLine({
  label,
  category,
  tone,
}: {
  label: string | null;
  category: string | null;
  tone: "service" | "opportunity";
}) {
  if (!label && !category) return null;
  const accent = tone === "service" ? "text-listing-service-accent" : "text-listing-opportunity-accent";
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
      {label ? <span className={`font-bold uppercase tracking-wide ${accent}`}>{label}</span> : null}
      {label && category ? <span className="text-muted/60" aria-hidden>·</span> : null}
      {category ? <span className="font-medium text-muted">{category}</span> : null}
    </p>
  );
}

/** Icon + label inside the green WhatsApp contact button, per the listing's CTA. */
export function WhatsAppCtaContent({ cta, iconClassName }: { cta: CardCta; iconClassName: string }) {
  const label = cta === "whatsapp" || cta === "view_details" ? "WhatsApp" : CTA_LABEL[cta];
  const icon =
    cta === "respond" ? (
      <Reply className={iconClassName} aria-hidden />
    ) : cta === "contact" ? (
      <MessageCircle className={iconClassName} aria-hidden />
    ) : (
      <WhatsAppIcon className={`${iconClassName} text-white`} />
    );
  return (
    <>
      {icon}
      {label}
    </>
  );
}
