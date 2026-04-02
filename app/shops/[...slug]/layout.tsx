import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import ShopChatWidget from "@/components/shopChatWidget";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function locationDisplay(loc: Shop["location"]): string {
  if (typeof loc === "string") return loc;
  if (loc && typeof loc === "object" && "display" in loc)
    return String((loc as { display?: string }).display ?? "Online");
  return "Online";
}

function platformLabel(platform?: string | null): string {
  if (!platform) return "Link";
  return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
}

async function fetchShop(slug: string): Promise<Shop | null> {
  try {
    return await apiShops.bySlug(slug);
  } catch {
    return null;
  }
}

// ─── metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  const shop = await fetchShop(slugValue);

  if (!shop) {
    return {
      title: "Shop not found | Midora Online",
    };
  }

  const title = `${shop.name} | Midora Online`;
  const description =
    shop.description ??
    shop.about ??
    `Discover ${shop.name} on Midora Online — brand-first shopping across Africa.`;
  const url = `https://www.midoraonline.com/shops/${shop.slug}`;
  const images = shop.logo_url
    ? [{ url: shop.logo_url, alt: shop.name }]
    : [{ url: "https://www.midoraonline.com/logo.png", alt: "Midora Online" }];

  return {
    title,
    description,
    keywords: [
      shop.name,
      shop.category ?? "",
      locationDisplay(shop.location),
      "Midora Online",
      "Uganda",
      "online shop",
      "Africa",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Midora Online",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
    alternates: {
      canonical: url,
    },
  };
}

// ─── shop header ─────────────────────────────────────────────────────────────

function ShopHeader({ shop }: { shop: Shop }) {
  const location = locationDisplay(shop.location);
  const hasLogo = Boolean(shop.logo_url);

  return (
    <header className="border-b border-border bg-surface">
      {/* top bar */}
      <div className="dm-container">
        <div className="flex h-11 items-center justify-between gap-4 border-b border-border/50 text-xs text-muted">
          <Link
            href="/shops"
            className="inline-flex items-center gap-1.5 hover:text-foreground dm-focus rounded-xl px-2 py-1 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to Mall
          </Link>
          <span className="hidden sm:block">
            Powered by{" "}
            <Link
              href="/"
              className="font-semibold text-foreground/80 hover:text-foreground transition-colors dm-focus rounded"
            >
              Midora Online
            </Link>
          </span>
        </div>
      </div>

      {/* banner */}
      <div className="dm-container py-6 sm:py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          {/* logo */}
          <div className="shrink-0">
            {hasLogo ? (
              <div className="relative size-20 sm:size-24 overflow-hidden rounded-2xl border border-border shadow-sm">
                <Image
                  src={shop.logo_url!}
                  alt={`${shop.name} logo`}
                  fill
                  className="object-cover"
                  priority
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="size-20 sm:size-24 rounded-2xl border border-border bg-foreground/5 grid place-items-center shadow-sm">
                <span className="text-2xl sm:text-3xl font-bold text-foreground/30 select-none">
                  {shop.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                {shop.name}
              </h1>
              {shop.is_active ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground/80">
                  <CheckCircle2 className="size-3 text-green-600" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-semibold text-foreground/60">
                  Temporarily Closed
                </span>
              )}
            </div>

            {shop.description && (
              <p className="mt-2 text-sm text-muted max-w-xl leading-relaxed">
                {shop.description}
              </p>
            )}

            {/* meta pills */}
            <div className="mt-3 flex flex-wrap gap-2">
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
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80">
                  <MapPin className="size-3 shrink-0" />
                  {location}
                </span>
              )}
              {shop.availability?.hours && (
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80">
                  <Clock className="size-3 shrink-0" />
                  {shop.availability.hours}
                  {shop.availability.days ? ` · ${shop.availability.days}` : ""}
                </span>
              )}
            </div>

            {/* contacts + social */}
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
                  target={c.value.startsWith("http") ? "_blank" : undefined}
                  rel={
                    c.value.startsWith("http") ? "noopener noreferrer" : undefined
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
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── shop footer ─────────────────────────────────────────────────────────────

function ShopFooter({ shop }: { shop: Shop }) {
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
                <div className="size-9 rounded-xl border border-border bg-foreground/5 grid place-items-center shrink-0">
                  <span className="text-xs font-bold text-foreground/30 select-none">
                    {shop.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="text-sm font-semibold tracking-tight">{shop.name}</p>
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

// ─── layout ──────────────────────────────────────────────────────────────────

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  const shop = await fetchShop(slugValue);

  if (!shop) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ShopHeader shop={shop} />

      <main className="flex-1">
        <div className="dm-container py-8">{children}</div>
      </main>

      <ShopFooter shop={shop} />

      <ShopChatWidget shopId={shop.id} shopName={shop.name} />
    </div>
  );
}
