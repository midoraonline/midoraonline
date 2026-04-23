import Image from "next/image";
import Link from "next/link";
import type { Contact, Shop } from "@/lib/api/shops";
import type { Product } from "@/lib/api/products";
import { productMediaItems } from "@/lib/api/products";
import ShopHeroToolbar from "./ShopHeroToolbar";
import ShopActions from "./ShopActions";
import ShopHeaderAuth from "./ShopHeaderAuth";
import ShopHeroCarousel, { type HeroMedia } from "./ShopHeroCarousel";
import {
  filterDuplicateContacts,
  locationDisplay,
  platformLabel,
  type ShopQuickNavFlags,
} from "./shopUtils";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

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
  if (t === "whatsapp") return <WhatsAppIcon className="size-5 shrink-0" />;
  if (t === "email")
    return <MaterialSymbol name="mail" className="!text-[22px] leading-none" />;
  if (t === "phone")
    return <MaterialSymbol name="call" className="!text-[22px] leading-none" />;
  if (c.value.startsWith("http"))
    return <MaterialSymbol name="open_in_new" className="!text-[22px] leading-none" />;
  return <MaterialSymbol name="contact_mail" className="!text-[22px] leading-none" />;
}

/**
 * Plain icon control used inside the hero.  Colours are sourced from the CSS
 * vars set by `ShopHeroCarousel`, so a dark image gets white icons and a light
 * image gets foreground-coloured icons — without any JS on this component.
 */
const contactIconClass =
  "inline-flex items-center justify-center p-1.5 outline-none ring-0 shadow-none transition-colors focus:outline-none focus-visible:outline-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]";

const contactIconStyle: React.CSSProperties = {
  color: "var(--hero-icon)",
};

export default function ShopHeader({
  shop,
  quickNav,
  products = [],
}: {
  shop: Shop;
  quickNav: ShopQuickNavFlags;
  products?: Product[];
}) {
  const location = locationDisplay(shop.location);
  const heroContacts = filterDuplicateContacts(shop);

  // Harvest every product image + video + the shop logo as fallback so the
  // carousel always has *something* to show.  Duplicates are filtered by the
  // carousel.  We interleave videos naturally so they show up as slides.
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

  return (
    <>
      <header className="shop-header-fixed fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 lg:px-7">
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
                  {shop.category && (
                    <p className="hidden truncate text-[11px] leading-tight text-muted sm:block">
                      {shop.category}
                    </p>
                  )}
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

      {/*
        Hero: the carousel OWNS the section's layout.  It sets CSS custom
        properties (`--hero-text-strong`, `--hero-chip-bg`, etc.) on its
        wrapper so everything inside colours itself accordingly, with zero
        client-side state plumbing here.
      */}
      <ShopHeroCarousel
        media={media}
        className="shop-hero-section border-b border-white/[0.06]"
      >
        <div
          className="mx-auto w-full max-w-2xl space-y-4 px-3 pt-6 pb-14 text-center sm:max-w-3xl sm:space-y-5 sm:px-5 sm:pt-10 sm:pb-16 lg:max-w-3xl lg:px-7"
          style={{ color: "var(--hero-text-strong)" }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h1
              className="text-2xl font-semibold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-3xl"
              style={{ color: "var(--hero-text-strong)" }}
            >
              {shop.name}
            </h1>
            {shop.is_active ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
                style={{
                  background: "var(--hero-chip-bg)",
                  borderColor: "var(--hero-chip-border)",
                  color: "var(--hero-text-strong)",
                }}
              >
                <MaterialSymbol
                  name="verified"
                  className="!text-[14px] leading-none text-green-400"
                  filled
                />
                Verified
              </span>
            ) : (
              <span
                className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
                style={{
                  background: "var(--hero-chip-bg)",
                  borderColor: "var(--hero-chip-border)",
                  color: "var(--hero-text-quiet)",
                }}
              >
                Temporarily Closed
              </span>
            )}
          </div>

          {shop.description && (
            <p
              className="text-sm leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]"
              style={{ color: "var(--hero-text-soft)" }}
            >
              {shop.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            {shop.category && (
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm"
                style={{
                  background: "var(--hero-chip-bg)",
                  borderColor: "var(--hero-chip-border)",
                  color: "var(--hero-text-strong)",
                }}
              >
                {shop.category}
              </span>
            )}
            {shop.shop_type && (
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize backdrop-blur-sm"
                style={{
                  background: "var(--hero-chip-bg)",
                  borderColor: "var(--hero-chip-border)",
                  color: "var(--hero-text-strong)",
                }}
              >
                {shop.shop_type === "both" ? "Products & Services" : shop.shop_type}
              </span>
            )}
            {location && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm"
                style={{
                  background: "var(--hero-chip-bg)",
                  borderColor: "var(--hero-chip-border)",
                  color: "var(--hero-text-strong)",
                }}
              >
                <MaterialSymbol name="location_on" className="!text-[14px] shrink-0 leading-none" />
                {location}
              </span>
            )}
            {shop.availability?.hours && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm"
                style={{
                  background: "var(--hero-chip-bg)",
                  borderColor: "var(--hero-chip-border)",
                  color: "var(--hero-text-strong)",
                }}
              >
                <MaterialSymbol name="schedule" className="!text-[14px] shrink-0 leading-none" />
                {shop.availability.hours}
                {shop.availability.days ? ` · ${shop.availability.days}` : ""}
              </span>
            )}
          </div>

          <ShopHeroToolbar shopId={shop.id} shopSlug={shop.slug} quickNav={quickNav} />

          <div className="flex flex-wrap items-center justify-center gap-1">
            {shop.whatsapp_number && (
              <a
                href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={contactIconClass}
                style={contactIconStyle}
                title={`WhatsApp ${shop.whatsapp_number}`}
                aria-label={`Open WhatsApp ${shop.whatsapp_number}`}
              >
                <WhatsAppIcon className="size-5" />
              </a>
            )}
            {shop.shop_email && (
              <a
                href={`mailto:${shop.shop_email}`}
                className={contactIconClass}
                style={contactIconStyle}
                title={shop.shop_email}
                aria-label={`Email ${shop.shop_email}`}
              >
                <MaterialSymbol name="mail" className="!text-[22px] leading-none" />
              </a>
            )}
            {heroContacts.map((c, i) => {
              const { href, external } = contactHref(c);
              const label = c.label ?? c.type ?? c.value;
              return (
                <a
                  key={i}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className={contactIconClass}
                  style={contactIconStyle}
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
                  className={contactIconClass}
                  style={contactIconStyle}
                  title={label}
                  aria-label={`${label} (opens in new tab)`}
                >
                  <MaterialSymbol name="open_in_new" className="!text-[22px] leading-none" />
                </a>
              );
            })}
          </div>

          <p
            className="pt-1 text-center text-[11px]"
            style={{ color: "var(--hero-text-quiet)" }}
          >
            Powered by{" "}
            <Link
              href="/"
              className="font-semibold outline-none ring-0 shadow-none transition-colors focus:outline-none focus-visible:outline-none"
              style={{ color: "var(--hero-text-muted)" }}
            >
              Midora Online
            </Link>
          </p>
        </div>
      </ShopHeroCarousel>
    </>
  );
}
