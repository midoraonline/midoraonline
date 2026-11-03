import { listingToneClass } from "@/components/ListingTypeTag";
import type { ListingTypeTagKind } from "@/lib/listingType";

const SUFFIX: Record<ListingTypeTagKind, string> = {
  product: "For sale",
  service: "Available",
  opportunity: "Open",
  job: "Wanted",
};

/** Image-slot cover for listings without a photo: the listing title, big and bold. */
export default function BrandedCover({
  kind,
  title,
  category,
}: {
  kind: ListingTypeTagKind;
  title: string;
  category?: string | null;
}) {
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center ${listingToneClass(kind)}`}>
      <span className="pointer-events-none absolute -left-4 -top-4 size-16 rounded-full bg-current opacity-5" aria-hidden />
      <span className="pointer-events-none absolute -bottom-6 -right-6 size-20 rounded-full bg-current opacity-5" aria-hidden />
      {category ? (
        <span className="line-clamp-1 max-w-full text-[10px] font-bold uppercase tracking-wider opacity-70 sm:text-xs">
          {category}
        </span>
      ) : null}
      <span className="line-clamp-4 max-w-full break-words text-base font-black leading-tight tracking-tight sm:text-xl">
        {title}
      </span>
      <span className="rounded-full bg-surface/70 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-accent sm:text-sm">
        {SUFFIX[kind]}
      </span>
    </div>
  );
}
