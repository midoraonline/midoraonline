import Image from "next/image";
import Link from "next/link";
import type { Shop } from "@/lib/api/shops";
import { locationDisplay, platformLabel } from "./shopUtils";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const footerIcon =
  "inline-flex items-center justify-center p-1.5 text-foreground/70 outline-none ring-0 shadow-none transition-colors hover:text-foreground focus:outline-none focus-visible:outline-none";

const footerLink =
  "block rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-foreground";

export default function ShopFooter({ shop }: { shop: Shop }) {
  const location = locationDisplay(shop.location);

  return (
    <footer className="mt-auto border-t border-foreground/[0.06] bg-surface/40 backdrop-blur-xl">
      <div className="dm-container py-6 sm:py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-3">
              {shop.logo_url ? (
                <div className="relative size-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-foreground/[0.06]">
                  <Image
                    src={shop.logo_url}
                    alt={`${shop.name} logo`}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
              ) : (
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/[0.06] ring-1 ring-foreground/[0.06]">
                  <span className="select-none text-xs font-bold text-foreground/30">
                    {shop.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="text-sm font-semibold tracking-tight">{shop.name}</p>
            </div>
            {location && (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                <MaterialSymbol name="location_on" className="!text-[14px] leading-none" />
                {location}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Reach out</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {shop.shop_email && (
                <a
                  href={`mailto:${shop.shop_email}`}
                  className={footerIcon}
                  title={shop.shop_email}
                  aria-label={`Email ${shop.shop_email}`}
                >
                  <MaterialSymbol name="mail" className="!text-[22px] leading-none" />
                </a>
              )}
              {shop.whatsapp_number && (
                <a
                  href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerIcon}
                  title={`WhatsApp ${shop.whatsapp_number}`}
                  aria-label={`WhatsApp ${shop.whatsapp_number}`}
                >
                  <WhatsAppIcon className="size-5" />
                </a>
              )}
              {shop.social_links?.map((s, i) => {
                const label = platformLabel(s.platform);
                return (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={footerIcon}
                    title={label}
                    aria-label={`${label} (opens in new tab)`}
                  >
                    <MaterialSymbol name="open_in_new" className="!text-[22px] leading-none" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Platform</p>
            <ul className="mt-3 space-y-1">
              <li>
                <Link href="/policies" className={footerLink}>
                  Platform policies
                </Link>
              </li>
              <li>
                <Link href="/termsandconditions" className={footerLink}>
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/shops" className={footerLink}>
                  Browse all shops
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/80 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {shop.name}. All rights reserved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted outline-none ring-0 shadow-none transition-colors hover:text-foreground focus:outline-none focus-visible:outline-none"
          >
            <Image
              src="/logo.png"
              alt="Midora Online"
              width={20}
              height={20}
              className="rounded-md"
            />
            <span>
              Powered by{" "}
              <span className="font-semibold text-foreground/80">
                Midora Online
              </span>
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
