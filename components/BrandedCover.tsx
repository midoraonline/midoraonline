import { listingToneClass } from "@/components/ListingTypeTag";

export type CoverTone = "service" | "opportunity";

const INTENT_ACCENT: Record<CoverTone, string> = {
  service: "text-listing-service-accent",
  opportunity: "text-listing-opportunity-accent",
};

/**
 * Coloured header for service/opportunity listings without a photo:
 * badge, intent text and title top-left, category illustration bottom-right.
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
  // Vertical cards can be short enough for the illustration to reach the title, so narrow it.
  const titleInset = visual && layout === "vertical" ? "pr-[38px] min-[400px]:pr-[44px] sm:pr-[58px] lg:pr-[66px]" : "pr-1";
  return (
    <div className={`absolute inset-0 flex flex-col items-start gap-1.5 p-2.5 text-left sm:p-3 ${listingToneClass(tone)}`}>
      <div className="flex min-h-6 max-w-full items-center gap-1 pr-10 sm:min-h-7">{badge}</div>
      {intentLabel ? (
        <p className={`line-clamp-2 max-w-full text-[13px] font-bold uppercase leading-tight tracking-wide ${INTENT_ACCENT[tone]}`}>
          {intentLabel}
        </p>
      ) : null}
      <h3
        title={title}
        className={`line-clamp-2 h-[38px] w-full overflow-hidden break-words text-base font-bold leading-[1.2] tracking-tight sm:h-[43px] sm:text-[18px] sm:leading-[1.18] ${titleInset}`}
      >
        {title}
      </h3>
      {visual ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={visual}
          alt=""
          aria-hidden
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute bottom-2.5 right-2.5 size-[30px] select-none min-[400px]:size-9 sm:bottom-3 sm:right-3 sm:size-12 lg:size-14"
        />
      ) : null}
    </div>
  );
}
