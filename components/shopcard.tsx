import Link from "next/link";

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
      className="dm-focus block dm-card dm-card-hover p-5 sm:p-6"
    >
      <div className="flex gap-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-foreground/[0.06] ring-1 ring-foreground/[0.06] sm:size-[3.75rem]">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={`${shop.name} logo`}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className="grid size-full place-items-center text-sm font-semibold tracking-tight text-foreground/45"
              aria-hidden
            >
              {initial}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">{shop.name}</h3>
            {shop.verified ? (
              <span className="inline-flex items-center rounded-full bg-foreground/[0.07] px-2.5 py-1 text-xs font-semibold text-foreground/80">
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{shop.tagline}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-foreground/[0.06] px-3 py-1 text-xs font-medium text-muted">
              {shop.category}
            </span>
            <span className="inline-flex items-center rounded-full bg-foreground/[0.06] px-3 py-1 text-xs font-medium text-muted">
              {shop.location}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
