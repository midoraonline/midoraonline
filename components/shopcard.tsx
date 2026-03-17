import Link from "next/link";

export type ShopCardData = {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  tagline: string;
  verified?: boolean;
};

export default function ShopCard({ shop }: { shop: ShopCardData }) {
  return (
    <Link
      href={`/shops/${shop.slug}`}
      className="block dm-card dm-card-hover p-5 dm-focus"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">
              {shop.name}
            </h3>
            {shop.verified ? (
              <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground/80">
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">{shop.tagline}</p>
        </div>

        <div
          className="grid size-10 place-items-center rounded-2xl bg-foreground/5 text-foreground/80"
          aria-hidden
        >
          ↗
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80">
          {shop.category}
        </span>
        <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80">
          {shop.location}
        </span>
      </div>
    </Link>
  );
}