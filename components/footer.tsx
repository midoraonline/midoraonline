"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { BRAND_TAGLINE } from "@/lib/brand";
import { Mail, MapPin, ChevronUp } from "lucide-react";
import HomeFeedbackWidget from "@/components/home/HomeFeedbackWidget";

type LinkGroup = { heading: string; links: { label: string; href: string }[] };

const LINK_GROUPS: LinkGroup[] = [
  {
    heading: "Explore",
    links: [
      { label: "Shops", href: "/shops" },
      { label: "Browse listings", href: "/" },
      { label: "All deals", href: "/?q=deals" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Midora", href: "/aboutus" },
      { label: "How Midora works", href: "/onboarding" },
      { label: "Open a shop", href: "/open-shop" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact us", href: "/contactus" },
      { label: "Report a problem", href: "/contactus" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms and conditions", href: "/termsandconditions" },
      { label: "Policies", href: "/policies" },
    ],
  },
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="w-full border-t border-border bg-surface-subtle">
      {/* Main links */}
      <div className="bg-surface">
        <div className="dm-container py-8 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Brand column */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block" aria-label="Midora Online home">
                <Logo
                  alt="Midora Online"
                  width={140}
                  height={48}
                  className="h-7 w-auto"
                  priority
                />
              </Link>
              <p className="mt-3 font-display text-base font-bold tracking-tight text-accent">{BRAND_TAGLINE}</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                The marketplace where African sellers and buyers meet. Find local shops,
                products, services and opportunities in one place.
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
                    {group.heading === "Support" ? (
                      <li>
                        <HomeFeedbackWidget />
                      </li>
                    ) : null}
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
