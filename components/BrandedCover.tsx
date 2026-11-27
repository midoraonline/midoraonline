import { listingToneClass } from "@/components/ListingTypeTag";

export type CoverTone = "service" | "opportunity";

const INTENT_ACCENT: Record<CoverTone, string> = {
  service: "text-listing-service-accent",
  opportunity: "text-listing-opportunity-accent",
};

/**
 * Coloured header for service/opportunity listings without a photo:
 * badge, intent text and title top-left, a large category illustration bleeding off the bottom-right.
 */
export default function BrandedCover({
  tone,
  title,
  intentLabel,
  badge,
  visual,
  layout = "vertical",
}: {
  tone: CoverTone;
  title: string;
  intentLabel?: string | null;
  /** Single temporary badge; the heart sits over the top-right corner. */
  badge?: React.ReactNode;
  visual?: string | null;
  layout?: "vertical" | "horizontal";
}) {
  return (
    <div className={`absolute inset-0 flex flex-col items-start gap-1 overflow-hidden p-2.5 text-left sm:gap-1.5 sm:p-3 ${listingToneClass(tone)}`}>
      {visual ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={visual}
          alt=""
          aria-hidden
          width={120}
          height={120}
          loading="lazy"
          decoding="async"
          className={`pointer-events-none absolute select-none transition-transform duration-500 ease-out group-hover:scale-105 ${
            layout === "horizontal"
              ? "-bottom-[12%] -right-[18%] w-[88%]"
              : "-bottom-[10%] -right-[6%] w-[60%] sm:w-[54%]"
          }`}
        />
      ) : null}
      <div className="relative flex min-h-6 max-w-full items-center gap-1 pr-10 sm:min-h-7">{badge}</div>
      {intentLabel ? (
        <p className={`relative line-clamp-2 max-w-full text-[11px] font-extrabold uppercase leading-tight tracking-wider sm:text-xs ${INTENT_ACCENT[tone]}`}>
          {intentLabel}
        </p>
      ) : null}
      <h3
        title={title}
        className="relative line-clamp-3 w-full break-words pr-2 text-[15px] font-bold leading-[1.2] tracking-tight sm:text-[17px]"
      >
        {title}
      </h3>
    </div>
  );
}
