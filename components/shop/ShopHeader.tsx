import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Contact, Shop } from "@/lib/api/shops";
import type { Product } from "@/lib/api/products";
import { productMediaItems } from "@/lib/api/products";
import ShopActions from "./ShopActions";
import ShopHeroCarousel, { type HeroMedia } from "./ShopHeroCarousel";
import {
  filterDuplicateContacts,
  locationDisplay,
  platformLabel,
} from "./shopUtils";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { publicSiteOrigin } from "@/lib/publicSite";
import { shopInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import { getShopReviewStats } from "@/lib/api/reviews";
import StarRating from "@/components/StarRating";

function ShopLogo({ logoUrl, name }: { logoUrl?: string | null; name: string }) {
  if (logoUrl) {
    return (
      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-foreground/[0.08] sm:size-24">
        <Image src={logoUrl} alt={`${name} logo`} fill className="object-cover" priority sizes="96px" />
      </div>
    );
  }
  return (
    <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-foreground/[0.06] ring-2 ring-foreground/[0.08] sm:size-24">
      <span className="text-2xl font-bold text-foreground/30 select-none">
        {name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

function contactHref(c: Contact): { href: string; external?: boolean } {
  const v = c.value;
  const t = (c.type ?? "").toLowerCase();
  if (t === "email") return { href: `mailto:${v}` };
  if (t === "whatsapp") return { href: `https://wa.me/${v.replace(/\D/g, "")}`, external: true };
  if (t === "phone") return { href: `tel:${v.replace(/\s/g, "")}` };
  if (v.startsWith("http")) return { href: v, external: true };
  return { href: `tel:${v}` };
}

function ContactChipIcon({ c }: { c: Contact }) {
  const t = (c.type ?? "").toLowerCase();
  if (t === "whatsapp") return <WhatsAppIcon className="size-3.5 shrink-0" />;
  if (t === "email") return <MaterialSymbol name="mail" className="!text-sm leading-none" />;
  if (t === "phone") return <MaterialSymbol name="call" className="!text-sm leading-none" />;
  if (c.value.startsWith("http")) return <MaterialSymbol name="open_in_new" className="!text-sm leading-none" />;
  return <MaterialSymbol name="contact_mail" className="!text-sm leading-none" />;
}

function MetaChip({ immersive, children }: { immersive: boolean; children: ReactNode }) {
  if (immersive) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm"
        style={{
          background: "var(--hero-chip-bg)",
          borderColor: "var(--hero-chip-border)",
          color: "var(--hero-text-strong)",
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.1] bg-foreground/[0.05] px-3 py-1 text-xs font-medium text-foreground/90">
      {children}
    </span>
  );
}

export default async function ShopHeader({
  shop,
  products = [],
}: {
  shop: Shop;
  products?: Product[];
}) {
  const reviewStats = await getShopReviewStats(shop.id).catch(() => null);
  const location = locationDisplay(shop.location);
  const heroContacts = filterDuplicateContacts(shop);
  const secondaryContacts = heroContacts.filter(
    (c) => (c.type ?? "").toLowerCase() !== "whatsapp",
  );

  const publishedProducts = products.filter((p) => p.is_published !== false);
  const productCategoryLabels = [
    ...new Set(
      publishedProducts
        .map((p) => p.category?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  ].sort((a, b) => a.localeCompare(b));

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

  const categoryChipLabels =
    productCategoryLabels.length > 0
      ? productCategoryLabels
      : shop.category
        ? [shop.category]
        : [];

  // ── Back + actions row ──────────────────────────────────────────
  const topRow = (
    <div className="flex items-center justify-between px-4 pt-4 pb-1 sm:px-6 sm:pt-5">
      <Link
        href="/shops"
        className={
          immersive
            ? "inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/35"
            : "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        }
      >
        <MaterialSymbol name="arrow_back" className="!text-sm leading-none" />
        All shops
      </Link>
      <div className={immersive ? "rounded-xl bg-black/20 backdrop-blur-sm" : ""}>
        <ShopActions shopSlug={shop.slug} shopName={shop.name} shopId={shop.id} />
      </div>
    </div>
  );

  // ── Hero center content ─────────────────────────────────────────
  const centerContent = (
    <div
      className={
        immersive
          ? "mx-auto w-full max-w-2xl space-y-4 px-4 pt-4 pb-12 text-center sm:max-w-3xl sm:px-6 sm:pt-5 sm:pb-14"
          : "mx-auto w-full max-w-2xl space-y-4 px-4 pt-6 pb-10 text-center sm:max-w-3xl sm:px-6 sm:pt-8 sm:pb-12"
      }
      style={immersive ? { color: "var(--hero-text-strong)" } : undefined}
    >
      {/* Logo — only shown in plain hero; immersive uses product imagery */}
      {!immersive && (
        <div className="flex justify-center">
          <ShopLogo logoUrl={shop.logo_url} name={shop.name} />
        </div>
      )}

      {/* Shop name + verified badge */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <h1
          className={
            immersive
              ? "text-2xl font-semibold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-3xl"
              : "font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          }
          style={immersive ? { color: "var(--hero-text-strong)" } : undefined}
        >
          {shop.name}
        </h1>
        {shop.is_active ? (
          <span
            className={
              immersive
                ? "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
                : "inline-flex items-center gap-1 rounded-full border border-green-600/30 bg-green-600/10 px-2.5 py-1 text-xs font-semibold text-green-700"
            }
            style={
              immersive
                ? {
                    background: "var(--hero-chip-bg)",
                    borderColor: "var(--hero-chip-border)",
                    color: "var(--hero-text-strong)",
                  }
                : undefined
            }
          >
            <MaterialSymbol
              name="verified"
              className={`!text-[14px] leading-none ${immersive ? "text-green-400" : "text-green-600"}`}
              filled
            />
            Verified
          </span>
        ) : (
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={
              immersive
                ? {
                    background: "var(--hero-chip-bg)",
                    borderColor: "var(--hero-chip-border)",
                    color: "var(--hero-text-quiet)",
                  }
                : {
                    borderColor: "color-mix(in oklab, var(--foreground) 12%, transparent)",
                    color: "color-mix(in oklab, var(--foreground) 55%, transparent)",
                  }
            }
          >
            Temporarily Closed
          </span>
        )}
      </div>

      {/* Rating */}
      {reviewStats && reviewStats.total_reviews > 0 ? (
        <div className="flex justify-center">
          <span
            className={immersive ? "drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]" : ""}
            style={immersive ? { filter: "brightness(1.2)" } : undefined}
          >
            <StarRating
              rating={reviewStats.average_rating}
              count={reviewStats.total_reviews}
              size="sm"
            />
          </span>
        </div>
      ) : (
        <div className="flex justify-center">
          <StarRating rating={0} size="sm" placeholder />
        </div>
      )}

      {/* Description */}
      {shop.description ? (
        <p
          className={
            immersive
              ? "text-sm leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]"
              : "text-sm leading-relaxed text-muted"
          }
          style={immersive ? { color: "var(--hero-text-soft)" } : undefined}
        >
          {shop.description}
        </p>
      ) : null}

      {/* Meta chips: categories, type, location, hours */}
      {(categoryChipLabels.length > 0 ||
        shop.shop_type ||
        location ||
        shop.availability?.hours) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categoryChipLabels.map((cat) => (
            <MetaChip key={cat} immersive={immersive}>
              {cat}
            </MetaChip>
          ))}
          {shop.shop_type ? (
            <MetaChip immersive={immersive}>
              <span className="capitalize">
                {shop.shop_type === "both" ? "Products & Services" : shop.shop_type}
              </span>
            </MetaChip>
          ) : null}
          {location ? (
            <MetaChip immersive={immersive}>
              <MaterialSymbol name="location_on" className="!text-[14px] shrink-0 leading-none" />
              {location}
            </MetaChip>
          ) : null}
          {shop.availability?.hours ? (
            <MetaChip immersive={immersive}>
              <MaterialSymbol name="schedule" className="!text-[14px] shrink-0 leading-none" />
              {shop.availability.hours}
              {shop.availability.days ? ` · ${shop.availability.days}` : ""}
            </MetaChip>
          ) : null}
        </div>
      )}

      {/* Primary CTA: WhatsApp */}
      {waHref ? (
        <div className="mx-auto w-full max-w-sm space-y-2 pt-1">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-95"
          >
            <WhatsAppIcon className="size-4 shrink-0 text-white" />
            Contact on WhatsApp
          </a>
          {shop.is_active ? (
            <p
              className={`text-center text-xs ${!immersive ? "text-muted" : ""}`}
              style={immersive ? { color: "var(--hero-text-muted)" } : undefined}
            >
              <span
                className={
                  immersive ? "font-medium text-white/95" : "font-medium text-emerald-600"
                }
              >
                ✓ Verified seller
              </span>
            </p>
          ) : (
            <p
              className={`text-center text-xs ${!immersive ? "text-muted" : ""}`}
              style={immersive ? { color: "var(--hero-text-muted)" } : undefined}
            >
              Seller on Midora · Final sale happens in WhatsApp
            </p>
          )}
        </div>
      ) : null}

      {/* Secondary contacts: email, phone, social — shown as labelled chips */}
      {(shop.shop_email ||
        secondaryContacts.length > 0 ||
        (shop.social_links?.length ?? 0) > 0) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {shop.shop_email ? (
            <a
              href={`mailto:${shop.shop_email}`}
              className={
                immersive
                  ? "inline-flex items-center gap-1.5 rounded-lg bg-black/25 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm transition-colors hover:bg-black/35"
                  : "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              }
              title={shop.shop_email}
              aria-label={`Email ${shop.shop_email}`}
            >
              <MaterialSymbol name="mail" className="!text-sm leading-none shrink-0" />
              {shop.shop_email}
            </a>
          ) : null}
          {secondaryContacts.map((c, i) => {
            const { href, external } = contactHref(c);
            const label = c.label ?? c.value;
            return (
              <a
                key={i}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className={
                  immersive
                    ? "inline-flex items-center gap-1.5 rounded-lg bg-black/25 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm transition-colors hover:bg-black/35"
                    : "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                }
                title={label}
                aria-label={label}
              >
                <ContactChipIcon c={c} />
                {label}
              </a>
            );
          })}
          {shop.social_links?.map((s, i) => {
            const label = platformLabel(s.platform);
            return (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  immersive
                    ? "inline-flex items-center gap-1.5 rounded-lg bg-black/25 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm transition-colors hover:bg-black/35"
                    : "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                }
                title={label}
                aria-label={`${label} (opens in new tab)`}
              >
                <MaterialSymbol name="open_in_new" className="!text-sm leading-none shrink-0" />
                {label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );

  const heroContent = (
    <>
      {topRow}
      {centerContent}
    </>
  );

  return immersive ? (
    <ShopHeroCarousel
      media={media}
      className="border-b border-white/[0.06]"
      minHeightClass="min-h-[20rem] sm:min-h-[24rem] lg:min-h-[28rem]"
    >
      {heroContent}
    </ShopHeroCarousel>
  ) : (
    <section className="border-b border-foreground/[0.08] bg-gradient-to-b from-surface/60 to-background">
      {heroContent}
    </section>
  );
}
