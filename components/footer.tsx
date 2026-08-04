"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Facebook, Instagram, ChevronUp } from "lucide-react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const TikTokIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={`${className} shrink-0 fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.08-1.4-1.22-.8-2.15-2.02-2.58-3.41-.02 1.83.01 3.66-.02 5.49 0 2.21-.55 4.45-1.74 6.22-1.19 1.77-3.08 2.94-5.18 3.26-2.1.32-4.38-.07-6.09-1.34C1.045 17.58.125 15.28.175 12.87c.05-2.41 1.09-4.8 2.96-6.32 1.87-1.52 4.44-2.06 6.81-1.47.02 1.41.01 2.82.02 4.23-1.32-.41-2.83-.17-3.92.65-1.09.82-1.63 2.28-1.38 3.65.25 1.37 1.34 2.52 2.69 2.81 1.35.29 2.88-.12 3.73-1.22.85-1.1 1.02-2.61.97-3.98.02-4.07-.01-8.14.02-12.21z" />
  </svg>
);

type TrustBadge = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

const TRUST_BADGES: TrustBadge[] = [
  {
    icon: <MaterialSymbol name="verified_user" className="!text-[22px]" />,
    title: "Verified sellers only",
    desc: "Every shop is checked before it goes live.",
  },
  {
    icon: <WhatsAppIcon className="size-[22px]" />,
    title: "Chat on WhatsApp",
    desc: "Message sellers directly — no middlemen.",
  },
  {
    icon: <MaterialSymbol name="location_on" className="!text-[22px]" />,
    title: "Buy near you",
    desc: "Find items and shops close to home.",
  },
  {
    icon: <MaterialSymbol name="handshake" className="!text-[22px]" />,
    title: "Real deals, real people",
    desc: "No scams, no fake listings — just trade.",
  },
];

type LinkGroup = { heading: string; links: { label: string; href: string }[] };

const LINK_GROUPS: LinkGroup[] = [
  {
    heading: "Explore",
    links: [
      { label: "Shops", href: "/shops" },
      { label: "Products", href: "/products" },
      { label: "Categories", href: "/products" },
      { label: "All deals", href: "/products?q=deals" },
      { label: "Near me", href: "/products?sort=near_me" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Midora", href: "/aboutus" },
      { label: "How it works", href: "/onboarding" },
      { label: "Open a shop", href: "/open-shop" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact us", href: "/contactus" },
      { label: "Help Center", href: "/onboarding" },
      { label: "Safety tips", href: "/policies" },
      { label: "Report an issue", href: "/contactus" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/termsandconditions" },
      { label: "Privacy Policy", href: "/policies" },
      { label: "Cookies Policy", href: "/policies" },
      { label: "Seller Policy", href: "/policies" },
    ],
  },
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="w-full border-t border-border bg-surface-subtle">
      {/* 1 — Trust badges */}
      <section
        aria-label="Why shop on Midora"
        className="dm-container pt-8 pb-6 sm:pt-10"
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {TRUST_BADGES.map((b) => (
            <div
              key={b.title}
              className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs transition-shadow hover:shadow-md sm:gap-4 sm:p-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent sm:size-11">
                {b.icon}
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold leading-tight text-foreground sm:text-[15px]">
                  {b.title}
                </h4>
                <p className="mt-1 text-[12px] leading-snug text-muted sm:text-[13px]">
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2 — Newsletter */}
      <section aria-label="Newsletter signup" className="dm-container pb-10">
        <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-surface to-surface p-5 shadow-xs sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="flex items-start gap-4">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-sm sm:size-14">
                <MaterialSymbol name="mail" className="!text-[26px]" />
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border-2 border-surface bg-foreground">
                  <span className="size-1.5 rounded-full bg-accent" />
                </span>
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold leading-tight text-foreground sm:text-lg">
                  Stay in the loop
                </h3>
                <p className="mt-1 text-sm leading-snug text-muted">
                  Get the best deals, new arrivals and shopping tips — straight
                  to your inbox.
                </p>
              </div>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:shrink-0"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-64 sm:py-2.5"
              />
              <button
                type="submit"
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-surface sm:py-2.5"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 3 — Main links */}
      <div className="border-t border-border bg-surface">
        <div className="dm-container py-10 sm:py-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Brand column */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block" aria-label="Midora Online home">
                <Image
                  src="/logo.png"
                  alt="Midora Online"
                  width={140}
                  height={48}
                  className="h-7 w-auto"
                  priority
                />
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                The marketplace where African brands and shoppers connect —
                discover local shops, products and services in one place.
              </p>

              <div className="mt-5 space-y-2.5">
                <a
                  href="mailto:midoraonline@gmail.com"
                  className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
                >
                  <Mail className="size-4 text-accent" aria-hidden />
                  midoraonline@gmail.com
                </a>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <MapPin className="size-4 text-accent" aria-hidden />
                  Kampala, Uganda
                </div>
              </div>

              {/* Socials */}
              <div className="mt-5 flex items-center gap-2.5">
                {[
                  { href: "#", label: "Facebook", icon: <Facebook className="size-4" /> },
                  { href: "#", label: "Instagram", icon: <Instagram className="size-4" /> },
                  { href: "#", label: "TikTok", icon: <TikTokIcon /> },
                  { href: "#", label: "WhatsApp", icon: <WhatsAppIcon className="size-4" /> },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="grid size-9 place-items-center rounded-full border border-border bg-surface text-muted transition-all hover:border-accent hover:text-accent"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link groups — 2 cols on mobile, 4 on lg */}
            <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:col-span-8 lg:grid-cols-4">
              {LINK_GROUPS.map((group) => (
                <nav key={group.heading} aria-label={group.heading}>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {group.heading}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {group.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="text-sm text-muted transition-colors hover:text-accent"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 — Bottom bar */}
      <div className="border-t border-border bg-surface-subtle">
        <div className="dm-container flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-muted sm:text-[13px]">
            © {new Date().getFullYear()} Midora Online. All rights reserved.
          </p>
          <p className="text-xs text-muted sm:text-[13px]">
            Made with <span className="text-accent">♥</span> in Kampala, Uganda
          </p>
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="grid size-9 place-items-center rounded-full bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-surface-subtle"
          >
            <ChevronUp className="size-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
