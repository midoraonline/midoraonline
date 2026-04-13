import Image from "next/image";
import Link from "next/link";
import type { Contact, Shop } from "@/lib/api/shops";
import { locationDisplay, platformLabel } from "./shopUtils";
import ShopActions from "./ShopActions";
import ShopHeaderAuth from "./ShopHeaderAuth";
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

/** Plain icon control — no fill, ring, or focus box */
const contactIcon =
  "inline-flex items-center justify-center p-1.5 text-foreground/70 outline-none ring-0 shadow-none transition-colors hover:text-foreground focus:outline-none focus-visible:outline-none";

function filterDuplicateContacts(shop: Shop) {
  const emailNorm = shop.shop_email?.trim().toLowerCase() ?? "";
  const waNorm = shop.whatsapp_number?.replace(/\D/g, "") ?? "";
  return (
    shop.contacts?.filter((c) => {
      const v = c.value.trim();
      if (emailNorm && v.toLowerCase() === emailNorm) return false;
      if (waNorm && v.replace(/\D/g, "") === waNorm) return false;
      return true;
    }) ?? []
  );
}

export default function ShopHeader({ shop }: { shop: Shop }) {
  const location = locationDisplay(shop.location);
  const heroContacts = filterDuplicateContacts(shop);

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

                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                  <ShopHeaderAuth />
                  <ShopActions shopSlug={shop.slug} shopName={shop.name} shopId={shop.id} />
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Single full-bleed glass panel: bar + body share bg (no strip of page color between) */}
      <section className="shop-hero-section shop-hero-panel relative z-0 box-border w-full min-w-0 pb-3 sm:pb-5">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-3 pt-6 text-center sm:max-w-3xl sm:space-y-5 sm:px-5 sm:pt-8 lg:max-w-3xl lg:px-7">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {shop.name}
            </h1>
            {shop.is_active ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2.5 py-1 text-xs font-semibold text-foreground/80">
                <MaterialSymbol
                  name="verified"
                  className="!text-[14px] leading-none text-green-600"
                  filled
                />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-foreground/[0.06] px-2.5 py-1 text-xs font-semibold text-foreground/50">
                Temporarily Closed
              </span>
            )}
          </div>

          {shop.description && (
            <p className="text-sm leading-relaxed text-muted">{shop.description}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            {shop.category && (
              <span className="inline-flex items-center rounded-full bg-foreground/[0.05] px-3 py-1 text-xs font-medium text-foreground/80">
                {shop.category}
              </span>
            )}
            {shop.shop_type && (
              <span className="inline-flex items-center rounded-full bg-foreground/[0.05] px-3 py-1 text-xs font-medium capitalize text-foreground/80">
                {shop.shop_type === "both"
                  ? "Products & Services"
                  : shop.shop_type}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 py-1 text-xs font-medium text-foreground/80">
                <MaterialSymbol name="location_on" className="!text-[14px] shrink-0 leading-none" />
                {location}
              </span>
            )}
            {shop.availability?.hours && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 py-1 text-xs font-medium text-foreground/80">
                <MaterialSymbol name="schedule" className="!text-[14px] shrink-0 leading-none" />
                {shop.availability.hours}
                {shop.availability.days ? ` · ${shop.availability.days}` : ""}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1">
            {shop.whatsapp_number && (
              <a
                href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={contactIcon}
                title={`WhatsApp ${shop.whatsapp_number}`}
                aria-label={`Open WhatsApp ${shop.whatsapp_number}`}
              >
                <WhatsAppIcon className="size-5" />
              </a>
            )}
            {shop.shop_email && (
              <a
                href={`mailto:${shop.shop_email}`}
                className={contactIcon}
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
                  className={contactIcon}
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
                  className={contactIcon}
                  title={label}
                  aria-label={`${label} (opens in new tab)`}
                >
                  <MaterialSymbol name="open_in_new" className="!text-[22px] leading-none" />
                </a>
              );
            })}
          </div>

          <p className="pt-1 text-center text-[11px] text-muted">
            Powered by{" "}
            <Link
              href="/"
              className="font-semibold text-foreground/60 outline-none ring-0 shadow-none transition-colors hover:text-foreground focus:outline-none focus-visible:outline-none"
            >
              Midora Online
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
