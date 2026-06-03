import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Contact, Shop } from "@/lib/api/shops";
import type { Product } from "@/lib/api/products";
import { productMediaItems } from "@/lib/api/products";
import ShopActions from "./ShopActions";
import ShopHeaderAuth from "./ShopHeaderAuth";
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

function ShopLogo({
  logoUrl,
  name,
}: {
  logoUrl?: string | null;
  name: string;
}) {
  if (logoUrl) {
    return (
      <div className="relative size-8 shrink-0 overflow-hidden rounded-xl ring-1 ring-foreground/[0.06]">
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          className="object-cover"
          priority
          sizes="32px"
        />
      </div>
    );
  }

  return (
    <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-foreground/[0.06] ring-1 ring-foreground/[0.06]">
      <span className="text-[11px] font-bold text-foreground/30 select-none">
        {name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

function contactHref(c: Contact): { href: string; external?: boolean } {
  const v = c.value;
  const t = (c.type ?? "").toLowerCase();
  if (t === "email") return { href: `mailto:${v}` };
  if (t === "whatsapp")
    return { href: `https://wa.me/${v.replace(/\D/g, "")}`, external: true };
  if (t === "phone") return { href: `tel:${v.replace(/\s/g, "")}` };
  if (v.startsWith("http")) return { href: v, external: true };
  return { href: `tel:${v}` };
}

function ContactChipIcon({ c }: { c: Contact }) {
  const t = (c.type ?? "").toLowerCase();
  if (t === "whatsapp") return <WhatsAppIcon className="size-4 shrink-0" />;
  if (t === "email")
    return <MaterialSymbol name="mail" className="!text-[22px] leading-none" />;
  if (t === "phone")
    return <MaterialSymbol name="call" className="!text-[22px] leading-none" />;
  if (c.value.startsWith("http"))
    return <MaterialSymbol name="open_in_new" className="!text-[22px] leading-none" />;
  return <MaterialSymbol name="contact_mail" className="!text-[22px] leading-none" />;
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

const contactIconClass =
  "inline-flex items-center justify-center rounded-lg p-1.5 outline-none ring-0 shadow-none transition-colors focus:outline-none focus-visible:outline-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]";

const contactIconStyle: CSSProperties = {
  color: "var(--hero-icon)",
};

const plainContactIconClass =
  "inline-flex items-center justify-center rounded-lg p-1.5 text-foreground/65 outline-none ring-0 transition-colors hover:bg-foreground/[0.06] hover:text-foreground dm-focus";

export default function ShopHeader({
  shop,
  products = [],
}: {
  shop: Shop;
  products?: Product[];
}) {
  const location = locationDisplay(shop.location);
  const heroContacts = filterDuplicateContacts(shop);
  const secondaryContacts = heroContacts.filter((c) => (c.type ?? "").toLowerCase() !== "whatsapp");

  const publishedProducts = products.filter((p) => p.is_published !== false);
  const productCategoryLabels = [
    ...new Set(
      publishedProducts.map((p) => p.category?.trim()).filter((c): c is string => Boolean(c)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const usePlainHero = publishedProducts.length === 0;
  const immersive = !usePlainHero;
  const headerCategory = productCategoryLabels[0] ?? shop.category;

  const shopPageUrl = `${publicSiteOrigin()}/shops/${shop.slug}`;
  const waHref = shop.whatsapp_number
    ? shopInquiryWhatsAppUrl(shop.whatsapp_number, {
        shopName: shop.name,
        shopUrl: shopPageUrl,
      })
    : null;

  const productMedia: HeroMedia[] = products.flatMap((p) =>
    productMediaItems(p).map<HeroMedia>((m) =>
      m.kind === "video" ? { kind: "video", src: m.src } : { kind: "image", src: m.src }
    )
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

  const heroInner = (
    <div
      className={
        immersive
          ? "mx-auto w-full max-w-2xl space-y-3 px-3 pt-5 pb-10 text-center sm:max-w-3xl sm:space-y-4 sm:px-5 sm:pt-8 sm:pb-12 lg:max-w-3xl lg:px-7"
          : "mx-auto w-full max-w-2xl space-y-3 px-3 py-6 text-center text-foreground sm:max-w-3xl sm:space-y-4 sm:px-5 sm:py-8 lg:max-w-3xl lg:px-7"
      }
      style={immersive ? { color: "var(--hero-text-strong)" } : undefined}
    >
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
                : "inline-flex items-center gap-1 rounded-full border border-green-600/30 bg-green-600/10 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400"
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
              className={`!text-[14px] leading-none ${immersive ? "text-green-400" : ""}`}
              filled
            />
            Verified
          </span>
        ) : (
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
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

      {waHref ? (
        <div className="mx-auto w-full max-w-md space-y-1.5 px-1 pt-1">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="dm-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-[filter] hover:brightness-95"
          >
            <WhatsAppIcon className="size-3.5 shrink-0 text-white" />
            WhatsApp
          </a>
          {shop.is_active ? (
            <p
              className={`text-center text-xs ${!immersive ? "text-muted" : ""}`}
              style={immersive ? { color: "var(--hero-text-muted)" } : undefined}
            >
              <span
                className={
                  immersive ? "font-medium text-white/95" : "font-medium text-foreground/90"
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

      {shop.shop_email || secondaryContacts.length > 0 || (shop.social_links?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-1">
          {shop.shop_email ? (
            <a
              href={`mailto:${shop.shop_email}`}
              className={immersive ? contactIconClass : plainContactIconClass}
              style={immersive ? contactIconStyle : undefined}
              title={shop.shop_email}
              aria-label={`Email ${shop.shop_email}`}
            >
              <MaterialSymbol name="mail" className="!text-[22px] leading-none" />
            </a>
          ) : null}
          {secondaryContacts.map((c, i) => {
            const { href, external } = contactHref(c);
            const label = c.label ?? c.type ?? c.value;
            return (
              <a
                key={i}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className={immersive ? contactIconClass : plainContactIconClass}
                style={immersive ? contactIconStyle : undefined}
                title={label}
                aria-label={label}
              >
                <ContactChipIcon c={c} />
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
                className={immersive ? contactIconClass : plainContactIconClass}
                style={immersive ? contactIconStyle : undefined}
                title={label}
                aria-label={`${label} (opens in new tab)`}
              >
                <MaterialSymbol name="open_in_new" className="!text-[22px] leading-none" />
              </a>
            );
          })}
        </div>
      ) : null}

      <p
        className={`pt-1 text-center text-[11px] ${!immersive ? "text-muted" : ""}`}
        style={immersive ? { color: "var(--hero-text-quiet)" } : undefined}
      >
        Powered by{" "}
        <Link
          href="/"
          className={
            immersive
              ? "font-semibold outline-none ring-0 shadow-none transition-colors focus:outline-none focus-visible:outline-none"
              : "font-semibold text-foreground/90 underline-offset-2 transition-colors hover:underline dm-focus"
          }
          style={immersive ? { color: "var(--hero-text-muted)" } : undefined}
        >
          Midora Online
        </Link>
      </p>
    </div>
  );

  return (
    <>
      <header className="shop-header-fixed fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto w-full max-w-none px-3 sm:px-5 lg:px-8">
          <div className="shop-header-bar px-2 sm:px-3">
            <div className="flex h-14 items-center gap-2 sm:h-16 sm:gap-3">
              <Link
                href="/shops"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-xs text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground dm-focus"
              >
                <MaterialSymbol name="arrow_back" className="!text-[18px] leading-none" />
                <span className="hidden sm:inline">Shops</span>
              </Link>

              <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-1 sm:pl-2">
                <ShopLogo logoUrl={shop.logo_url} name={shop.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight tracking-tight">
                    {shop.name}
                  </p>
                  {headerCategory ? (
                    <p className="hidden truncate text-[11px] leading-tight text-muted sm:block">
                      {headerCategory}
                    </p>
                  ) : null}
                </div>
                {shop.is_active && (
                  <MaterialSymbol
                    name="verified"
                    className="hidden !text-[18px] leading-none shrink-0 text-green-600 sm:inline-block"
                    filled
                  />
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <ShopHeaderAuth />
                <ShopActions shopSlug={shop.slug} shopName={shop.name} shopId={shop.id} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {usePlainHero ? (
        <section className="shop-hero-section border-b border-foreground/[0.08] bg-gradient-to-b from-surface/50 to-background">
          {heroInner}
        </section>
      ) : (
        <ShopHeroCarousel
          media={media}
          className="shop-hero-section border-b border-white/[0.06]"
          minHeightClass="min-h-[15rem] sm:min-h-[19rem] lg:min-h-[22rem]"
        >
          {heroInner}
        </ShopHeroCarousel>
      )}
    </>
  );
}
