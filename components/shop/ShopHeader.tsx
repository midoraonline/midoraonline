import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Contact, Shop } from "@/lib/api/shops";
import type { Product } from "@/lib/api/products";
import { productMediaItems, productPrimaryImage } from "@/lib/api/products";
import { productPageSlug } from "@/lib/productUrl";
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

function formatFollowerCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
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
  backHref = "/shops",
  backLabel = "All shops",
}: {
  shop: Shop;
  products?: Product[];
  /** Where the top-left back arrow leads. Defaults to the shop browse. */
  backHref?: string;
  /** Label rendered next to the arrow. */
  backLabel?: string;
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

  // ── Back row — back arrow only; engagement + owner CTAs live below the hero ──────
  const topRow = (
    <div className="flex items-center px-4 pt-3 pb-1 sm:px-6 sm:pt-4">
      <Link
        href={backHref}
        className={
          immersive
            ? "inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/35"
            : "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        }
      >
        <MaterialSymbol name="arrow_back" className="!text-sm leading-none" aria-hidden="true" />
        {backLabel}
      </Link>
    </div>
  );

  // ── Hero center content ─────────────────────────────────────────
  const centerContent = (
    <div
      className={
        immersive
          ? "mx-auto w-full max-w-2xl space-y-3 px-4 pt-2 pb-8 text-center sm:max-w-3xl sm:px-6 sm:pt-3 sm:pb-10"
          : "mx-auto w-full max-w-2xl space-y-3 px-4 pt-4 pb-6 text-center sm:max-w-3xl sm:px-6 sm:pt-5 sm:pb-8"
      }
      style={immersive ? { color: "var(--hero-text-strong)" } : undefined}
    >
      {/* Identity: name, tight trust row */}
      <div className="flex flex-col items-center gap-3">
        <h1
          className={
            immersive
              ? "font-display text-3xl font-semibold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-4xl"
              : "font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          }
          style={immersive ? { color: "var(--hero-text-strong)" } : undefined}
        >
          {shop.name}
        </h1>

        {/* Compact trust row: Verified pill · followers · available now */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-xs">
          {shop.is_active ? (
            <>
              {shop.trust_badges?.includes("business_verified") ? (
                <MetaChip immersive={immersive}>
                  <MaterialSymbol
                    name="domain_verification"
                    className="!text-[14px] leading-none"
                    filled
                    aria-hidden="true"
                  />
                  Business Verified
                </MetaChip>
              ) : shop.trust_badges?.includes("identity_verified") ? (
                <MetaChip immersive={immersive}>
                  <MaterialSymbol
                    name="verified_user"
                    className="!text-[14px] leading-none"
                    filled
                    aria-hidden="true"
                  />
                  Verified
                </MetaChip>
              ) : (
                <MetaChip immersive={immersive}>
                  <MaterialSymbol
                    name="storefront"
                    className="!text-[14px] leading-none"
                    filled
                    aria-hidden="true"
                  />
                  Registered Shop
                </MetaChip>
              )}
            </>
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

          {typeof shop.follower_count === "number" && shop.follower_count > 0 ? (
            <MetaChip immersive={immersive}>
              <MaterialSymbol
                name="group"
                className="!text-[14px] leading-none"
                filled
                aria-hidden="true"
              />
              {formatFollowerCount(shop.follower_count)} followers
            </MetaChip>
          ) : null}

          {shop.available_now ? (
            <span
              className={
                immersive
                  ? "inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                  : "dm-pill dm-pill--success gap-1.5 px-2.5 py-1 text-xs font-semibold"
              }
            >
              <span className="relative flex size-2">
                <span
                  className="absolute inline-flex size-full animate-ping rounded-full opacity-75"
                  style={{ background: immersive ? "#fff" : "var(--success)" }}
                />
                <span
                  className="relative inline-flex size-2 rounded-full"
                  style={{ background: immersive ? "#fff" : "var(--success)" }}
                />
              </span>
              Available now
            </span>
          ) : null}
        </div>
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
      minHeightClass="min-h-[13rem] sm:min-h-[16rem] lg:min-h-[18rem]"
    >
      {heroContent}
    </ShopHeroCarousel>
  ) : (
    <section className="border-b border-border bg-surface">
      {heroContent}
    </section>
  );
}
