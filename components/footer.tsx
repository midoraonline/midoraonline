"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin } from "lucide-react";

const exploreLinks = [
  { href: "/shops", label: "Shops" },
  { href: "/products", label: "Products" },
  { href: "/aboutus", label: "About Us" },
  { href: "/contactus", label: "Contact" },
];

const companyLinks = [
  { href: "/onboarding", label: "How it Works" },
  { href: "/open-shop", label: "Open a Shop" },
  { href: "/policies", label: "Policies" },
  { href: "/termsandconditions", label: "Terms & Conditions" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      {/* Main footer */}
      <div className="dm-container py-10 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Midora Online"
                width={150}
                height={51}
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              The marketplace where African brands and shoppers connect.
              Discover local shops, products, and services in one place.
            </p>

            {/* Contact info */}
            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href="mailto:midoraonline@gmail.com"
                className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                <Mail className="size-4 text-accent" />
                midoraonline@gmail.com
              </a>
              <div className="inline-flex items-center gap-2 text-sm text-muted">
                <MapPin className="size-4 text-accent" />
                Kampala, Uganda
              </div>
            </div>
          </div>

          {/* Explore links */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Explore
            </p>
            <ul className="mt-5 space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Company
            </p>
            <ul className="mt-5 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Stay Updated
            </p>
            <p className="mt-2 text-sm text-muted">
              Get the latest shops and deals delivered to your inbox.
            </p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="dm-input flex-1 text-sm"
                aria-label="Email for newsletter"
              />
              <button
                type="submit"
                className="dm-btn dm-btn-primary shrink-0 whitespace-nowrap text-xs"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-2 text-[11px] text-muted/70">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="dm-container flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Midora Online. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted">
              Rent a shop for{" "}
              <span className="font-semibold text-foreground">5,000 UGX/month</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
