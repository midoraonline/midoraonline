import { listingToneClass } from "@/components/ListingTypeTag";
import type { ListingTypeTagKind } from "@/lib/listingType";

const SUFFIX: Record<ListingTypeTagKind, string> = {
  product: "For sale",
  service: "Available",
  opportunity: "Open",
  job: "Wanted",
};

/** Image-slot cover for listings without a photo: the subcategory, big and bold. */
export default function BrandedCover({ kind, label }: { kind: ListingTypeTagKind; label: string }) {
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center ${listingToneClass(kind)}`}>
      <span className="pointer-events-none absolute -left-4 -top-4 size-16 rounded-full bg-current opacity-5" aria-hidden />
      <span className="pointer-events-none absolute -bottom-6 -right-6 size-20 rounded-full bg-current opacity-5" aria-hidden />
      <span className="line-clamp-2 break-words text-xl font-black uppercase leading-tight tracking-tight sm:text-2xl">
        {label}
      </span>
      <span className="rounded-full bg-surface/70 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-accent sm:text-sm">
        {SUFFIX[kind]}
      </span>
    </div>
  );
}
