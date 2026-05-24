import Link from "next/link";
import { VerifiedIcon } from "@/components/icons/VerifiedIcon";

export type ShopCardData = {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  tagline: string;
  verified?: boolean;
  logoUrl?: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

export default function ShopCard({ shop }: { shop: ShopCardData }) {
  const initial = initials(shop.name);

  return (
    <Link
      href={`/shops/${shop.slug}`}
      className="dm-focus block dm-card dm-card-hover p-3 sm:p-5"
    >
      {/* Mobile: vertical stack · sm+: horizontal row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-foreground/[0.06] ring-1 ring-foreground/[0.06] sm:size-14 sm:rounded-xl">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={`${shop.name} logo`}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className="grid size-full place-items-center text-xs font-semibold tracking-tight text-foreground/45 sm:text-sm"
              aria-hidden
            >
              {initial}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-xs font-semibold tracking-tight sm:text-base">{shop.name}</h3>
            {shop.verified ? (
              <span className="inline-flex items-center rounded-full bg-foreground/[0.07] p-0.5 sm:p-1">
                <VerifiedIcon size={14} label={`${shop.name} is verified`} />
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted sm:mt-1 sm:text-sm">
            {shop.tagline}
          </p>

          <div className="mt-2 flex flex-wrap gap-1 sm:mt-3 sm:gap-2">
            <span className="inline-flex items-center rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted sm:px-3 sm:py-1 sm:text-xs">
              {shop.category}
            </span>
            <span className="inline-flex items-center rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted sm:px-3 sm:py-1 sm:text-xs">
              {shop.location}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
