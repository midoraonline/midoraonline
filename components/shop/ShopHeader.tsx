import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Shop } from "@/lib/api/shops";
import type { Product } from "@/lib/api/products";
import { productMediaItems } from "@/lib/api/products";
import ShopHeroCarousel, { type HeroMedia } from "./ShopHeroCarousel";
import { locationDisplay } from "./shopUtils";
import { ArrowLeft, MapPin } from "lucide-react";
import { publicSiteOrigin } from "@/lib/publicSite";
import { shopInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import ShopHeaderRating from "@/components/shop/ShopHeaderRating";
import ShopContactButtons from "@/components/shop/ShopContactButtons";
import { VerifiedIcon } from "@/components/icons/VerifiedIcon";
import {
  resolveShopTrustLevel,
  SHOP_TRUST_LABEL,
} from "@/lib/productCardMap";

/**
 * Public shop storefront hero — brand-first mini-site header.
 * Pattern: logo + name + trust + location + WhatsApp (Etsy/Shopify storefront),
 * not a product buy-box.
 */
export default async function ShopHeader({
  shop,
  products = [],
  backHref = "/shops",
  backLabel = "All shops",
}: {
  shop: Shop;
  products?: Product[];
  backHref?: string;
  backLabel?: string;
}) {
  const location = locationDisplay(shop.location);
  const publishedProducts = products.filter((p) => p.is_published !== false);
  const usePlainHero = publishedProducts.length === 0;
  const immersive = !usePlainHero;

  const shopPageUrl = `${publicSiteOrigin()}/shops/${shop.slug}`;
  const waHref = shop.whatsapp_number
    ? shopInquiryWhatsAppUrl(shop.whatsapp_number, {
        shopName: shop.name,
        shopUrl: shopPageUrl,
      })
    : null;

  const productMedia: HeroMedia[] = products.flatMap((p) =>
    productMediaItems(p).map<HeroMedia>((m) =>
      m.kind === "video" ? { kind: "video", src: m.src } : { kind: "image", src: m.src },
    ),
  );
  const media: HeroMedia[] = productMedia.length
    ? productMedia
    : shop.logo_url
      ? [{ kind: "image", src: shop.logo_url }]
      : [];

  const trustLevel = resolveShopTrustLevel(shop.trust_badges);
  const showTrust = shop.is_active !== false && trustLevel !== "registered";
  const shopLive = shop.available_now === true;
  const listingCount = publishedProducts.length;

  const chipStyle = immersive
    ? ({
        background: "var(--hero-chip-bg)",
        borderColor: "var(--hero-chip-border)",
        color: "var(--hero-text-strong)",
      } as CSSProperties)
    : undefined;

  const Meta = ({ children }: { children: ReactNode }) =>
    immersive ? (
      <span
        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium backdrop-blur-sm"
        style={chipStyle}
      >
        {children}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-md bg-accent/[0.06] px-2 py-1 text-[11px] font-medium text-foreground/80 ring-1 ring-accent/10">
        {children}
      </span>
    );

  const heroBody = (
    <>
      <div className="flex items-center px-4 pt-3 pb-1 sm:px-6 sm:pt-4">
        <Link
          href={backHref}
          className={
            immersive
              ? "inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/40"
              : "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          }
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
          {backLabel}
        </Link>
      </div>

      <div
        className={
          immersive
            ? "mx-auto w-full max-w-lg space-y-3.5 px-4 pb-8 pt-2 text-center sm:max-w-xl sm:px-6 sm:pb-10 sm:pt-3"
            : "mx-auto w-full max-w-lg space-y-3.5 px-4 pb-6 pt-4 text-center sm:max-w-xl sm:px-6 sm:pb-8 sm:pt-5"
        }
        style={immersive ? { color: "var(--hero-text-strong)" } : undefined}
      >
        {/* Brand mark — storefront identity */}
        <div className="flex flex-col items-center gap-2.5">
          <div
            className={
              immersive
                ? "relative size-16 overflow-hidden rounded-2xl bg-white/15 ring-2 ring-white/35 shadow-lg backdrop-blur-sm sm:size-[4.5rem]"
                : "relative size-16 overflow-hidden rounded-2xl bg-surface-subtle ring-2 ring-accent/20 shadow-sm sm:size-[4.5rem]"
            }
          >
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt=""
                fill
                className="object-cover"
                sizes="72px"
                priority
              />
            ) : (
              <div
                className={`flex size-full items-center justify-center text-xl font-bold sm:text-2xl ${
                  immersive ? "text-white" : "text-accent"
                }`}
              >
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1
            className={
              immersive
                ? "font-display text-2xl font-semibold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-3xl"
                : "font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            }
            style={immersive ? { color: "var(--hero-text-strong)" } : undefined}
          >
            {shop.name}
          </h1>
        </div>

        {/* Trust + location + live — scannable storefront meta */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {!shop.is_active ? (
            <Meta>Temporarily closed</Meta>
          ) : showTrust ? (
            <Meta>
              <VerifiedIcon
                className={
                  trustLevel === "business"
                    ? immersive
                      ? "!text-[13px] text-white"
                      : "!text-[13px] text-accent"
                    : immersive
                      ? "!text-[13px] text-sky-200"
                      : "!text-[13px] text-sky-600"
                }
                size={13}
                label={SHOP_TRUST_LABEL[trustLevel]}
              />
              {trustLevel === "business" ? "Business verified" : "Identity verified"}
            </Meta>
          ) : null}

          {shopLive ? (
            <span
              className={
                immersive
                  ? "inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
                  : "inline-flex items-center gap-1.5 rounded-md bg-emerald-600/10 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20"
              }
            >
              <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden />
              Live now
            </span>
          ) : null}

          {location ? (
            <Meta>
              <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden />
              <span className="max-w-[12rem] truncate sm:max-w-none">{location}</span>
            </Meta>
          ) : null}

          {listingCount > 0 ? (
            <Meta>
              {listingCount} listing{listingCount === 1 ? "" : "s"}
            </Meta>
          ) : null}
        </div>

        <ShopHeaderRating shopId={shop.id} immersive={immersive} />

        {shop.description ? (
          <p
            className={
              immersive
                ? "mx-auto line-clamp-3 max-w-md text-sm leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
                : "mx-auto line-clamp-3 max-w-md text-sm leading-relaxed text-muted"
            }
            style={immersive ? { color: "var(--hero-text-soft)" } : undefined}
          >
            {shop.description}
          </p>
        ) : null}

        {/* Primary storefront CTA */}
        {waHref || shop.owner_id ? (
          <ShopContactButtons
            shopId={shop.id}
            ownerId={shop.owner_id}
            whatsappNumber={shop.whatsapp_number}
            waHref={waHref}
            immersive={immersive}
          />
        ) : null}
      </div>
    </>
  );

  return immersive ? (
    <ShopHeroCarousel
      media={media}
      className="border-b border-white/[0.06]"
      minHeightClass="min-h-[14rem] sm:min-h-[17rem] lg:min-h-[19rem]"
    >
      {heroBody}
    </ShopHeroCarousel>
  ) : (
    <section className="border-b border-border bg-surface">{heroBody}</section>
  );
}
