import Image from "next/image";
import Link from "next/link";
import type { Shop } from "@/lib/api/shops";
import { locationDisplay, platformLabel } from "./shopUtils";
import { MapPin, Mail, Phone, ExternalLink } from "lucide-react";

export default function ShopFooter({ shop }: { shop: Shop }) {
  const location = locationDisplay(shop.location);

  return (
    <footer className="border-t border-border/80 bg-surface mt-auto">
      <div className="dm-container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              {shop.logo_url ? (
                <div className="relative size-9 overflow-hidden rounded-xl border border-border shrink-0">
                  <Image
                    src={shop.logo_url}
                    alt={`${shop.name} logo`}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
              ) : (
                <div className="size-9 rounded-xl border border-border bg-primary/5 grid place-items-center shrink-0">
                  <span className="text-xs font-bold text-foreground/30 select-none">
                    {shop.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="text-sm font-semibold tracking-tight">
                {shop.name}
              </p>
            </div>
            {(shop.about ?? shop.description) && (
              <p className="text-sm text-muted leading-relaxed">
                {shop.about ?? shop.description}
              </p>
            )}
            {location && (
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted">
                <MapPin className="size-3 shrink-0" />
                {location}
              </p>
            )}
          </div>

          {/* contact */}
          <div>
            <p className="text-sm font-semibold">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              {shop.shop_email && (
                <li>
                  <a
                    href={`mailto:${shop.shop_email}`}
                    className="inline-flex items-center gap-1.5 text-muted hover:text-foreground transition-colors"
                  >
                    <Mail className="size-3.5 shrink-0" />
                    {shop.shop_email}
                  </a>
                </li>
              )}
              {shop.whatsapp_number && (
                <li>
                  <a
                    href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted hover:text-foreground transition-colors"
                  >
                    <Phone className="size-3.5 shrink-0" />
                    {shop.whatsapp_number}
                  </a>
                </li>
              )}
              {shop.contacts?.map((c, i) => (
                <li key={i}>
                  <span className="text-muted">{c.label ?? c.type}: </span>
                  <span className="text-foreground/80">{c.value}</span>
                </li>
              ))}
              {shop.social_links?.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="size-3.5 shrink-0" />
                    {platformLabel(s.platform)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* platform */}
          <div>
            <p className="text-sm font-semibold">Platform</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  className="text-muted hover:text-foreground transition-colors"
                  href="/policies"
                >
                  Platform policies
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-foreground transition-colors"
                  href="/termsandconditions"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-foreground transition-colors"
                  href="/shops"
                >
                  Browse all shops
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-10 flex flex-col gap-3 border-t border-border/80 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {shop.name}. All rights reserved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 hover:text-foreground transition-colors dm-focus rounded-xl"
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
