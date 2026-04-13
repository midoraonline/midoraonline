"use client";

import Link from "next/link";
import {
  ArrowRight,
  Compass,
  MessageCircle,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  UserPlus,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`home-reveal ${shown ? "home-reveal--in" : ""} ${className}`}
      style={{ transitionDelay: shown ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

const quickLinks = [
  { href: "/shops", label: "Browse shops", desc: "Discover brands", tone: "primary" as const },
  { href: "/products", label: "Browse products", desc: "Shop the catalog", tone: "accent" as const },
  { href: "/open-shop", label: "Open a shop", desc: "Go live fast", tone: "primary" as const },
  { href: "/register", label: "Create account", desc: "Merchants & shoppers", tone: "secondary" as const },
  { href: "/login", label: "Sign in", desc: "Access your space", tone: "secondary" as const },
  { href: "/aboutus", label: "About us", desc: "Our story", tone: "accent" as const },
  { href: "/contactus", label: "Contact", desc: "We reply quickly", tone: "primary" as const },
  { href: "/policies", label: "Policies", desc: "Trust & clarity", tone: "accent" as const },
  { href: "/midora-info", label: "Midora info", desc: "Ask the assistant", tone: "secondary" as const },
];

const toneBorder = {
  primary: "border-primary/15 hover:border-primary/30 hover:bg-primary/[0.04]",
  accent: "border-accent/18 hover:border-accent/32 hover:bg-accent/[0.05]",
  secondary: "border-secondary/12 hover:border-secondary/25 hover:bg-secondary/[0.04]",
};

export default function HomeLanding() {
  return (
    <div className="space-y-10 sm:space-y-14 lg:space-y-16">
      {/* Hero — bordered frame, brand colors */}
      <Reveal>
        <section className="relative overflow-hidden border border-primary/35 bg-surface">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.45]"
            style={{
              background:
                "linear-gradient(135deg, rgba(74,103,103,0.12) 0%, transparent 42%, rgba(102,121,143,0.14) 100%)",
            }}
          />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10 lg:p-10">
            <div>
              <p className="inline-flex items-center gap-2 border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                <Sparkles className="size-3.5 shrink-0" aria-hidden />
                Brand-first mall
              </p>
              <h1 className="font-display mt-5 text-pretty text-3xl font-semibold leading-[1.12] tracking-tight text-primary sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
                Your brand deserves the spotlight—not buried in an endless product grid.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
                Midora Online is built so shoppers meet <span className="font-semibold text-foreground">shops first</span>,
                then products. Merchants get a clear storefront; customers get discovery that feels human.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/open-shop"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Open your shop
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/shops"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent bg-surface px-6 py-3.5 text-sm font-semibold text-accent transition-colors duration-300 hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Explore shops
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {["From 5,000 UGX/mo", "Verified-ready", "Policies & trust"].map((t) => (
                  <span
                    key={t}
                    className="border border-secondary/25 bg-background px-3 py-1.5 text-xs font-semibold text-secondary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4 border border-primary/25 bg-background/80 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Why it works</p>
              <ul className="space-y-4 text-sm leading-relaxed text-foreground">
                <li className="flex gap-3 border-l-2 border-accent pl-4">
                  <Store className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <strong className="text-foreground">Shop pages</strong> carry your story, logo, and policies—before
                    anyone clicks “buy.”
                  </span>
                </li>
                <li className="flex gap-3 border-l-2 border-primary pl-4">
                  <Package className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                  <span>
                    <strong className="text-foreground">Products</strong> sit inside that brand context, so discovery
                    builds recognition.
                  </span>
                </li>
                <li className="flex gap-3 border-l-2 border-secondary pl-4">
                  <Zap className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden />
                  <span>
                    <strong className="text-foreground">Fast setup</strong> for merchants; a calmer browse for shoppers.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Why Midora Online */}
      <section className="space-y-6" aria-labelledby="why-midora-heading">
        <Reveal>
          <div className="flex flex-col gap-3 border-l-2 border-primary pl-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="why-midora-heading" className="font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                Why Midora Online
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-secondary sm:text-base">
                Generic marketplaces optimize for the cheapest click. We optimize for{" "}
                <span className="font-medium text-foreground">brand memory</span>—so repeat customers know who they bought
                from.
              </p>
            </div>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Discovery, not noise",
              body: "Shops are first-class. Browsing feels like walking a mall, not scraping a spreadsheet.",
              border: "border-accent/45",
              icon: Compass,
            },
            {
              title: "Built for emerging brands",
              body: "Lower overhead than a custom site, more personality than a bare listing.",
              border: "border-primary/45",
              icon: Sparkles,
            },
            {
              title: "Trust by design",
              body: "Policies, verification, and clear contact paths help buyers commit with confidence.",
              border: "border-secondary/40",
              icon: Shield,
            },
          ].map((item, i) => (
            <Reveal key={item.title} delayMs={i * 70}>
              <article
                className={`flex h-full flex-col border ${item.border} bg-surface p-5 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6`}
              >
                <item.icon className="size-8 text-primary" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section className="space-y-6" aria-labelledby="how-heading">
        <Reveal>
          <div className="border-l-2 border-accent pl-4">
            <h2 id="how-heading" className="font-display text-2xl font-semibold tracking-tight text-accent sm:text-3xl">
              How to use Midora
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-secondary sm:text-base">
              Same platform, two simple paths—whether you sell or shop.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal delayMs={40}>
            <div className="border border-primary/30 bg-surface p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Merchants</p>
              <ol className="mt-5 space-y-4">
                {[
                  "Create your account and choose merchant.",
                  "Open a shop—name, story, logo, and policies.",
                  "Add products and publish your storefront.",
                  "Share your shop link; customers browse you first.",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center border border-primary bg-primary/10 text-sm font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="pt-1 text-sm leading-relaxed text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="border border-accent/35 bg-surface p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Shoppers</p>
              <ol className="mt-5 space-y-4">
                {[
                  "Browse shops or jump to products.",
                  "Open a shop you like—read their story and policies.",
                  "Add items to cart and check out when ready.",
                  "Return to the same brand next time—no anonymous SKUs.",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center border border-accent bg-accent/10 text-sm font-bold text-accent">
                      {idx + 1}
                    </span>
                    <span className="pt-1 text-sm leading-relaxed text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Value */}
      <section className="space-y-6" aria-labelledby="value-heading">
        <Reveal>
          <div className="border-l-2 border-secondary pl-4">
            <h2 id="value-heading" className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Value we add
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-secondary sm:text-base">
              One neutral mall, two audiences—each gets structure that respects their goals.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal>
            <div className="h-full border border-primary/35 bg-primary/[0.07] p-6 sm:p-8">
              <div className="flex items-center gap-2 text-primary">
                <Store className="size-6" aria-hidden />
                <h3 className="font-display text-xl font-semibold">For merchants</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
                <li className="border-l-2 border-primary/50 pl-3">Faster launch than a bespoke site; stronger brand than a lone listing.</li>
                <li className="border-l-2 border-accent/50 pl-3">Room for story, visuals, and policy—so you look established.</li>
                <li className="border-l-2 border-secondary/50 pl-3">One hub for discovery, questions, and repeat visits.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="h-full border border-accent/40 bg-accent/[0.08] p-6 sm:p-8">
              <div className="flex items-center gap-2 text-accent">
                <ShoppingBag className="size-6" aria-hidden />
                <h3 className="font-display text-xl font-semibold">For shoppers</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
                <li className="border-l-2 border-accent/55 pl-3">See who you&apos;re buying from before you commit.</li>
                <li className="border-l-2 border-primary/45 pl-3">Browse products with context—less guesswork, fewer regrets.</li>
                <li className="border-l-2 border-secondary/45 pl-3">A calmer, more legible alternative to chaotic marketplaces.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Quick links */}
      <section className="space-y-6 pb-2" aria-labelledby="links-heading">
        <Reveal>
          <div className="flex flex-col gap-2 border-b border-primary/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="links-heading" className="font-display text-2xl font-semibold tracking-tight text-primary">
              Quick links
            </h2>
            <p className="text-sm text-secondary">Jump anywhere in one tap.</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {quickLinks.map((item, i) => (
            <Reveal key={item.href} delayMs={(i % 4) * 50}>
              <Link
                href={item.href}
                className={`group flex h-full flex-col border bg-surface p-4 transition-all duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5 ${toneBorder[item.tone]}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{item.label}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                </span>
                <span className="mt-1.5 text-xs text-secondary">{item.desc}</span>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="flex flex-col gap-3 border border-secondary/30 bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">Need a hand?</span>{" "}
                <span className="text-secondary">Use the floating assistant or </span>
                <Link href="/contactus" className="font-semibold text-accent underline-offset-2 hover:underline">
                  contact us
                </Link>
                .
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 sm:self-center"
            >
              <UserPlus className="size-4" aria-hidden />
              Get started
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
