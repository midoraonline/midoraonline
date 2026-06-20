import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import StarRating from "@/components/StarRating";

export type ShopCardData = {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  tagline: string;
  verified?: boolean;
  logoUrl?: string | null;
  shopType?: string | null;
  viewCount?: number | null;
  whatsappNumber?: string | null;
  email?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
};

export default function ShopCard({ shop, className = "" }: { shop: ShopCardData; className?: string }) {
  const shopTypeLabel =
    shop.shopType === "both" ? "Products & Services"
    : shop.shopType === "service" ? "Services"
    : shop.shopType === "product" ? "Products"
    : null;

  return (
    <Link
      href={`/shops/${shop.slug}`}
      className={`dm-focus group flex flex-col rounded-2xl border border-border bg-background shadow-sm transition-all hover:border-border-strong hover:shadow-md ${className}`}
    >
      {/* Card body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Top row: logo + identity */}
        <div className="flex items-start gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface ring-1 ring-border sm:size-16">
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={`${shop.name} logo`}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <img
                src="/logo.png"
                alt="Midora Online"
                className="size-full object-contain p-1.5"
                loading="lazy"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-base">
                {shop.name}
              </h3>
              {shop.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <MaterialSymbol name="verified" className="!text-xs" filled />
                  Verified
                </span>
              )}
            </div>

            <p className="mt-0.5 text-[11px] font-medium text-muted sm:text-xs">
              {shop.category}
            </p>

            <div className="mt-1">
              {shop.rating != null && shop.rating > 0 ? (
                <StarRating rating={shop.rating} count={shop.reviewCount} size="xs" />
              ) : (
                <StarRating size="xs" placeholder rating={0} />
              )}
            </div>

            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted sm:text-xs">
              <MaterialSymbol name="location_on" className="!text-sm shrink-0" />
              <span className="truncate">{shop.location}</span>
            </p>
          </div>
        </div>

        {/* Tagline */}
        <p className={`mt-3 line-clamp-2 text-xs leading-relaxed sm:text-sm ${shop.tagline ? "text-muted" : "italic text-muted/40"}`}>
          {shop.tagline || "No description yet"}
        </p>

        {/* Contact badges — pinned to bottom of body to fill whitespace */}
        {(shop.whatsappNumber || shop.email) && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
            {shop.whatsappNumber && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/10 px-2.5 py-1 text-[10px] font-semibold text-[#1a9e4e]">
                <WhatsAppIcon className="size-3 shrink-0" />
                WhatsApp
              </span>
            )}
            {shop.email && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">
                <MaterialSymbol name="mail" className="!text-xs" />
                Email
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card footer: meta + visit CTA */}
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          {shopTypeLabel && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted">
              <MaterialSymbol name="storefront" className="!text-xs" />
              {shopTypeLabel}
            </span>
          )}
          {shop.viewCount != null && shop.viewCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted">
              <MaterialSymbol name="visibility" className="!text-xs" />
              {shop.viewCount}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted transition-colors group-hover:text-accent">
          Visit shop
          <MaterialSymbol name="arrow_forward" className="!text-sm transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
