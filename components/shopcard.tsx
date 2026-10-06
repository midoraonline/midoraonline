import Link from "next/link";
import CategoryDisplay from "@/components/CategoryDisplay";
import Logo from "@/components/Logo";
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
    shop.shopType === "both" ? "Products and services"
    : shop.shopType === "service" ? "Services"
    : shop.shopType === "product" ? "Products"
    : null;

  return (
    <Link
      href={`/shops/${shop.slug}`}
      className={`dm-focus group flex min-w-0 flex-col rounded-xl border border-border bg-background shadow-sm transition-colors hover:border-border-strong ${className}`}
    >
      {/* Card body */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        {/* Top row: logo + identity */}
        <div className="flex min-w-0 items-start gap-2">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface ring-1 ring-border sm:size-12">
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={`${shop.name} logo`}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <Logo
                alt="Midora Online"
                fill
                className="object-contain p-1.5"
                sizes="48px"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-col items-start gap-1">
              <h3 className="w-full truncate text-xs font-semibold text-foreground transition-colors group-hover:text-accent sm:text-sm">
                {shop.name}
              </h3>
              {shop.verified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <MaterialSymbol name="verified" className="!text-[11px]" filled />
                  Verified
                </span>
              )}
            </div>

            <div className="mt-1 truncate text-[10px] sm:text-[11px]">
              <CategoryDisplay label={shop.category} variant="compact" />
            </div>

            <div className="mt-1">
              {shop.rating != null && shop.rating > 0 ? (
                <StarRating rating={shop.rating} count={shop.reviewCount} size="xs" />
              ) : (
                null
              )}
            </div>

            <p className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-muted sm:text-[11px]">
              <MaterialSymbol name="location_on" className="!text-sm shrink-0" />
              <span className="truncate">{shop.location}</span>
            </p>
          </div>
        </div>

        {shop.tagline ? (
          <p className="mt-2 line-clamp-1 text-[10px] leading-relaxed text-muted sm:text-xs">
            {shop.tagline}
          </p>
        ) : null}

        {(shop.whatsappNumber || shop.email) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {shop.whatsappNumber && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/10 px-2 py-0.5 text-[9px] font-semibold text-[#1a9e4e]">
                <WhatsAppIcon className="size-2.5 shrink-0" />
                WhatsApp
              </span>
            )}
            {shop.email && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-semibold text-accent">
                <MaterialSymbol name="mail" className="!text-[11px]" />
                Email
              </span>
            )}
          </div>
        )}
      </div>
      {shopTypeLabel ? (
        <div className="border-t border-border/60 px-2.5 py-1.5 text-[9px] text-muted sm:px-3.5">
          <span className="inline-flex items-center gap-1">
            <MaterialSymbol name="storefront" className="!text-[11px]" />
            {shopTypeLabel}
          </span>
        </div>
      ) : null}
    </Link>
  );
}
