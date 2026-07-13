import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Contact, Shop } from "@/lib/api/shops";
import type { Product } from "@/lib/api/products";
import { productMediaItems, productPrimaryImage } from "@/lib/api/products";
import { productPageSlug } from "@/lib/productUrl";
import ShopActions from "./ShopActions";
import ShopHeroCarousel, { type HeroMedia } from "./ShopHeroCarousel";
import {
  filterDuplicateContacts,
  locationDisplay,
  platformLabel,
} from "./shopUtils";
import CategoryDisplay from "@/components/CategoryDisplay";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { whatsappDigits } from "@/lib/whatsappProduct";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { publicSiteOrigin } from "@/lib/publicSite";
import { shopInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import ShopHeaderRating from "@/components/shop/ShopHeaderRating";
import ShopContactButtons from "@/components/shop/ShopContactButtons";

function ShopLogo({ logoUrl, name }: { logoUrl?: string | null; name: string }) {
  if (logoUrl) {
    return (
      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-foreground/[0.08] sm:size-24">
        <Image src={logoUrl} alt={`${name} logo`} fill className="object-cover" priority sizes="96px" />
      </div>
    );
  }
  return (
    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-foreground/[0.08] sm:size-24">
      <Image src="/logo.png" alt="Midora Online" fill className="object-contain p-2" priority sizes="96px" />
    </div>
  );
}

function contactHref(c: Contact): { href: string; external?: boolean } {
  const v = c.value;
  const t = (c.type ?? "").toLowerCase();
  if (t === "email") return { href: `mailto:${v}` };
  if (t === "whatsapp") return { href: `https://wa.me/${whatsappDigits(v)}`, external: true };
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
        {shop.available_now ? (
          <span
            className={
              immersive
                ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-sm"
                : "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
            }
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Available now
          </span>
        ) : null}
        {shop.is_active ? (
          <div className="flex flex-wrap items-center gap-2">
            {shop.trust_badges?.includes("business_verified") && (
              <span
                key="business_verified"
                className={
                  immersive
                    ? "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
                    : "inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent"
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
                  name="domain_verification"
                  className={`!text-[14px] leading-none ${immersive ? "text-white" : ""}`}
                  filled
                />
                Business Verified
              </span>
            )}
            {shop.trust_badges?.includes("identity_verified") && (
              <span
                key="identity_verified"
                className={
                  immersive
                    ? "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
                    : "inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700"
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
                  name="verified_user"
                  className={`!text-[14px] leading-none ${immersive ? "text-emerald-400" : "text-emerald-600"}`}
                  filled
                />
                Identity Verified
              </span>
            )}
            {(!shop.trust_badges || (!shop.trust_badges.includes("business_verified") && !shop.trust_badges.includes("identity_verified"))) && (
              <span
                className={
                  immersive
                    ? "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
                    : "inline-flex items-center gap-1 rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-2.5 py-1 text-xs font-semibold text-foreground/80"
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
                  name="storefront"
                  className="!text-[14px] leading-none"
                  filled
                />
                Registered Shop
              </span>
            )}
          </div>
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
      <div className={`flex justify-center ${immersive ? "drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]" : ""}`}
        style={immersive ? { filter: "brightness(1.2)" } : undefined}>
        <ShopHeaderRating shopId={shop.id} />
      </div>

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
              <CategoryDisplay label={cat} variant="inline" immersive={immersive} />
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

      {/* Primary CTAs: WhatsApp + Native messaging */}
      {(waHref || shop.owner_id) ? (
        <ShopContactButtons
          shopId={shop.id}
          ownerId={shop.owner_id}
          whatsappNumber={shop.whatsapp_number}
          waHref={waHref}
        />
      ) : null}
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
                {(shop.trust_badges?.includes("identity_verified") || shop.trust_badges?.includes("business_verified")) ? "✓ Verified seller" : "Seller on Midora"}
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

      {/* Promoted products */}
      {publishedProducts.filter((p) => p.boosted).length > 0 && (
        <div className="pt-2">
          <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${immersive ? "text-white/60" : "text-muted"}`}>
            Promoted
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
            {publishedProducts
              .filter((p) => p.boosted)
              .slice(0, 6)
              .map((p) => {
                const imgSrc = productPrimaryImage(p);
                return (
                  <Link
                    key={p.id}
                    href={`/products/${productPageSlug(p)}`}
                    className={`group flex w-28 shrink-0 snap-start flex-col overflow-hidden rounded-xl text-left ${immersive ? "bg-white/10 backdrop-blur-sm" : "border border-border bg-surface"}`}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-foreground/[0.04]">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={p.title}
                          width={112}
                          height={84}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-muted">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className={`truncate text-[11px] font-medium ${immersive ? "text-white/90" : "text-foreground"}`}>
                        {p.title}
                      </p>
                      <p className={`text-[10px] font-semibold ${immersive ? "text-white/70" : "text-foreground/70"}`}>
                        UGX {(p.price_ugx ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

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
