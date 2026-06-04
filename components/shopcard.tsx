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
      className="dm-focus block dm-card dm-card-hover p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-subtle ring-1 ring-border sm:size-16">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={`${shop.name} logo`}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className="grid size-full place-items-center text-sm font-semibold tracking-tight text-foreground/35"
              aria-hidden
            >
              {initial}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-semibold tracking-tight sm:text-base">{shop.name}</h3>
            {shop.verified ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 p-0.5 sm:p-1">
                <VerifiedIcon size={14} label={`${shop.name} is verified`} />
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted sm:text-sm">
            {shop.tagline}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-surface-subtle px-2.5 py-1 text-[10px] font-medium text-foreground/70 ring-1 ring-border sm:px-3 sm:text-xs">
              {shop.category}
            </span>
            <span className="inline-flex items-center rounded-full bg-surface-subtle px-2.5 py-1 text-[10px] font-medium text-foreground/70 ring-1 ring-border sm:px-3 sm:text-xs">
              {shop.location}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
