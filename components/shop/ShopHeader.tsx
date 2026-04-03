import Image from "next/image";
import Link from "next/link";
import type { Shop } from "@/lib/api/shops";
import { locationDisplay, platformLabel } from "./shopUtils";
import ShopActions from "./ShopActions";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

function ShopLogo({
  logoUrl,
  name,
}: {
  logoUrl?: string | null;
  name: string;
}) {
  if (logoUrl) {
    return (
      <div className="relative size-8 overflow-hidden rounded-xl border border-border shrink-0">
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
    <div className="size-8 rounded-xl border border-border bg-foreground/5 grid place-items-center shrink-0">
      <span className="text-[11px] font-bold text-foreground/30 select-none">
        {name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

export default function ShopHeader({ shop }: { shop: Shop }) {
  const location = locationDisplay(shop.location);

  return (
    <>
      {/* ── sticky floating nav bar ──────────────────────────────────────
          Must be a direct sibling of the hero (not wrapped inside the same
          container) so that sticky positioning works for the full page scroll. */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur-md">
        <div className="dm-container">
          <div className="flex h-14 items-center gap-3">
            {/* back arrow — always visible, never shrinks */}
            <Link
              href="/shops"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground dm-focus rounded-xl px-2 py-1.5 transition-colors shrink-0"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Mall</span>
            </Link>

            {/* shop identity — flex-1 so it claims all remaining space and
                name truncates gracefully instead of being squeezed out */}
            <div className="flex-1 min-w-0 flex items-center gap-2.5 border-l border-border/60 pl-3">
              <ShopLogo logoUrl={shop.logo_url} name={shop.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight truncate leading-tight">
                  {shop.name}
                </p>
                {shop.category && (
                  <p className="text-[11px] text-muted truncate leading-tight hidden sm:block">
                    {shop.category}
                  </p>
                )}
              </div>
              {shop.is_active && (
                <CheckCircle2 className="size-3.5 text-green-600 shrink-0 hidden sm:block" />
              )}
            </div>

            {/* actions — shrink-0 so they never get compressed */}
            <div className="shrink-0">
              <ShopActions
                shopSlug={shop.slug}
                shopName={shop.name}
                shopId={shop.id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── hero banner ──────────────────────────────────────────────────── */}
      <div className="border-b border-border/60 bg-surface">
        <div className="dm-container py-8 sm:py-10">
          <div className="max-w-2xl space-y-4">
            {/* name + badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {shop.name}
              </h1>
              {shop.is_active ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground/80">
                  <CheckCircle2 className="size-3 text-green-600" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-semibold text-foreground/50">
                  Temporarily Closed
                </span>
              )}
            </div>

            {/* description */}
            {shop.description && (
              <p className="text-sm text-muted leading-relaxed">
                {shop.description}
              </p>
            )}

            {/* meta pills */}
            <div className="flex flex-wrap gap-2">
              {shop.category && (
                <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80">
                  {shop.category}
                </span>
              )}
              {shop.shop_type && (
                <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80 capitalize">
                  {shop.shop_type === "both"
                    ? "Products & Services"
                    : shop.shop_type}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80">
                  <MapPin className="size-3 shrink-0" />
                  {location}
                </span>
              )}
              {shop.availability?.hours && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80">
                  <Clock className="size-3 shrink-0" />
                  {shop.availability.hours}
                  {shop.availability.days
                    ? ` · ${shop.availability.days}`
                    : ""}
                </span>
              )}
            </div>

            {/* contact + social links */}
            <div className="flex flex-wrap items-center gap-2">
              {shop.whatsapp_number && (
                <a
                  href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 dm-focus transition-colors"
                >
                  <Phone className="size-3" />
                  WhatsApp
                </a>
              )}
              {shop.shop_email && (
                <a
                  href={`mailto:${shop.shop_email}`}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 dm-focus transition-colors"
                >
                  <Mail className="size-3" />
                  Email
                </a>
              )}
              {shop.contacts?.map((c, i) => (
                <a
                  key={i}
                  href={
                    c.type === "email"
                      ? `mailto:${c.value}`
                      : c.type === "phone" || c.type === "whatsapp"
                        ? `tel:${c.value}`
                        : c.value.startsWith("http")
                          ? c.value
                          : `tel:${c.value}`
                  }
                  target={c.value.startsWith("http") ? "_blank" : undefined}
                  rel={
                    c.value.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 dm-focus transition-colors"
                >
                  {c.label ?? c.value}
                </a>
              ))}
              {shop.social_links?.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 dm-focus transition-colors"
                >
                  <ExternalLink className="size-3" />
                  {platformLabel(s.platform)}
                </a>
              ))}
            </div>

            {/* powered by */}
            <p className="text-[11px] text-muted pt-1">
              Powered by{" "}
              <Link
                href="/"
                className="font-semibold text-foreground/60 hover:text-foreground transition-colors"
              >
                Midora Online
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
