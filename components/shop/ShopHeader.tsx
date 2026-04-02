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
  size = "lg",
}: {
  logoUrl?: string | null;
  name: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "sm" ? "size-8" : "size-20 sm:size-24";
  const textSize = size === "sm" ? "text-[11px]" : "text-2xl sm:text-3xl";
  const radius = size === "sm" ? "rounded-xl" : "rounded-2xl";

  if (logoUrl) {
    return (
      <div
        className={`relative ${dim} overflow-hidden ${radius} border border-border shadow-sm shrink-0`}
      >
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          className="object-cover"
          priority
          sizes={size === "sm" ? "32px" : "96px"}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dim} ${radius} border border-border bg-foreground/5 grid place-items-center shadow-sm shrink-0`}
    >
      <span
        className={`${textSize} font-bold text-foreground/30 select-none`}
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

export default function ShopHeader({ shop }: { shop: Shop }) {
  const location = locationDisplay(shop.location);

  return (
    <header>
      {/* ── floating sticky nav bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur-md">
        <div className="dm-container">
          <div className="flex h-14 items-center justify-between gap-3">
            {/* left: back + compact identity */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/shops"
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground dm-focus rounded-xl px-2 py-1.5 transition-colors shrink-0"
              >
                <ArrowLeft className="size-3.5" />
                <span className="hidden sm:inline">Mall</span>
              </Link>

              <div className="hidden sm:flex items-center gap-2.5 min-w-0 border-l border-border/60 pl-3">
                <ShopLogo logoUrl={shop.logo_url} name={shop.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight truncate">
                    {shop.name}
                  </p>
                  {shop.category && (
                    <p className="text-[11px] text-muted truncate">
                      {shop.category}
                    </p>
                  )}
                </div>
                {shop.is_active && (
                  <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />
                )}
              </div>
            </div>

            {/* right: interactive actions */}
            <ShopActions shopSlug={shop.slug} shopName={shop.name} />
          </div>
        </div>
      </div>

      {/* ── hero banner ──────────────────────────────────────────────────── */}
      <div className="border-b border-border/60 bg-surface">
        <div className="dm-container py-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* logo */}
            <ShopLogo logoUrl={shop.logo_url} name={shop.name} size="lg" />

            {/* info */}
            <div className="flex-1 min-w-0">
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
                <p className="mt-2.5 text-sm text-muted max-w-xl leading-relaxed">
                  {shop.description}
                </p>
              )}

              {/* meta pills */}
              <div className="mt-4 flex flex-wrap gap-2">
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
              <div className="mt-4 flex flex-wrap items-center gap-2">
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
                    target={
                      c.value.startsWith("http") ? "_blank" : undefined
                    }
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

              {/* powered by (mobile only — desktop shows in sticky bar) */}
              <p className="mt-5 text-[11px] text-muted sm:hidden">
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
      </div>
    </header>
  );
}
