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
  { href: "/shops", label: "Browse shops", desc: "Discover brands" },
  { href: "/products", label: "Browse products", desc: "Shop the catalog" },
  { href: "/open-shop", label: "Open a shop", desc: "Go live fast" },
  { href: "/register", label: "Create account", desc: "Merchants & shoppers" },
  { href: "/login", label: "Sign in", desc: "Access your space" },
  { href: "/aboutus", label: "About us", desc: "Our story" },
  { href: "/contactus", label: "Contact", desc: "We reply quickly" },
  { href: "/policies", label: "Policies", desc: "Trust & clarity" },
  { href: "/midora-info", label: "Midora info", desc: "Ask the assistant" },
];

const softCard =
  "rounded-3xl bg-foreground/[0.025] transition-colors duration-300 hover:bg-foreground/[0.04] motion-reduce:transition-none";

export default function HomeLanding() {
  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20">
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl">
          <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:p-10">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-foreground/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
                <Sparkles className="size-3.5 shrink-0" aria-hidden />
                Brand-first mall
              </p>
              <h1 className="font-display mt-6 text-pretty text-3xl font-semibold leading-[1.12] tracking-tight text-foreground sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
                Your brand deserves the spotlight—not buried in an endless product grid.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                Midora Online is built so shoppers meet <span className="font-semibold text-foreground">shops first</span>,
                then products. Merchants get a clear storefront; customers get discovery that feels human.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/open-shop"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Open your shop
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/shops"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground/[0.07] px-6 py-3.5 text-sm font-semibold text-foreground transition-colors duration-300 hover:bg-foreground/[0.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/20"
                >
                  Explore shops
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {["From 5,000 UGX/mo", "Verified-ready", "Policies & trust"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-foreground/[0.06] px-3 py-1.5 text-xs font-semibold text-foreground/75"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className={`flex flex-col gap-4 p-5 sm:p-6 ${softCard}`}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/55">Why it works</p>
              <ul className="space-y-5 text-sm leading-relaxed text-foreground">
                <li className="flex gap-3">
                  <Store className="mt-0.5 size-5 shrink-0 text-foreground/50" aria-hidden />
                  <span>
                    <strong className="text-foreground">Shop pages</strong> carry your story, logo, and policies—before
                    anyone clicks “buy.”
                  </span>
                </li>
                <li className="flex gap-3">
                  <Package className="mt-0.5 size-5 shrink-0 text-foreground/50" aria-hidden />
                  <span>
                    <strong className="text-foreground">Products</strong> sit inside that brand context, so discovery
                    builds recognition.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Zap className="mt-0.5 size-5 shrink-0 text-foreground/50" aria-hidden />
                  <span>
                    <strong className="text-foreground">Fast setup</strong> for merchants; a calmer browse for shoppers.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="space-y-8" aria-labelledby="why-midora-heading">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="why-midora-heading" className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Why Midora Online
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
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
              icon: Compass,
            },
            {
              title: "Built for emerging brands",
              body: "Lower overhead than a custom site, more personality than a bare listing.",
              icon: Sparkles,
            },
            {
              title: "Trust by design",
              body: "Policies, verification, and clear contact paths help buyers commit with confidence.",
              icon: Shield,
            },
          ].map((item, i) => (
            <Reveal key={item.title} delayMs={i * 70}>
              <article className={`flex h-full flex-col p-6 sm:p-7 ${softCard}`}>
                <item.icon className="size-8 text-foreground/45" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="space-y-8" aria-labelledby="how-heading">
        <Reveal>
          <div>
            <h2 id="how-heading" className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              How to use Midora
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
              Same platform, two simple paths—whether you sell or shop.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal delayMs={40}>
            <div className={`p-6 sm:p-7 ${softCard}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/55">Merchants</p>
              <ol className="mt-5 space-y-4">
                {[
                  "Create your account and choose merchant.",
                  "Open a shop—name, story, logo, and policies.",
                  "Add products and publish your storefront.",
                  "Share your shop link; customers browse you first.",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/[0.08] text-sm font-bold text-foreground/80">
                      {idx + 1}
                    </span>
                    <span className="pt-1 text-sm leading-relaxed text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          <Reveal delayMs={100}>
            <div className={`p-6 sm:p-7 ${softCard}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/55">Shoppers</p>
              <ol className="mt-5 space-y-4">
                {[
                  "Browse shops or jump to products.",
                  "Open a shop you like—read their story and policies.",
                  "Add items to cart and check out when ready.",
                  "Return to the same brand next time—no anonymous SKUs.",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/[0.08] text-sm font-bold text-foreground/80">
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

      <section className="space-y-8" aria-labelledby="value-heading">
        <Reveal>
          <div>
            <h2 id="value-heading" className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Value we add
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
              One neutral mall, two audiences—each gets structure that respects their goals.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal>
            <div className={`h-full p-6 sm:p-8 ${softCard}`}>
              <div className="flex items-center gap-2 text-foreground">
                <Store className="size-6 text-foreground/50" aria-hidden />
                <h3 className="font-display text-xl font-semibold">For merchants</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
                <li className="pl-1">Faster launch than a bespoke site; stronger brand than a lone listing.</li>
                <li className="pl-1">Room for story, visuals, and policy—so you look established.</li>
                <li className="pl-1">One hub for discovery, questions, and repeat visits.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delayMs={80}>
            <div className={`h-full p-6 sm:p-8 ${softCard}`}>
              <div className="flex items-center gap-2 text-foreground">
                <ShoppingBag className="size-6 text-foreground/50" aria-hidden />
                <h3 className="font-display text-xl font-semibold">For shoppers</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
                <li className="pl-1">See who you&apos;re buying from before you commit.</li>
                <li className="pl-1">Browse products with context—less guesswork, fewer regrets.</li>
                <li className="pl-1">A calmer, more legible alternative to chaotic marketplaces.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="space-y-8 pb-2" aria-labelledby="links-heading">
        <Reveal>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="links-heading" className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Quick links
            </h2>
            <p className="text-sm text-muted">Jump anywhere in one tap.</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {quickLinks.map((item, i) => (
            <Reveal key={item.href} delayMs={(i % 4) * 50}>
              <Link
                href={item.href}
                className={`group flex h-full flex-col p-4 transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5 ${softCard}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{item.label}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
                </span>
                <span className="mt-1.5 text-xs text-muted">{item.desc}</span>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 ${softCard}`}>
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 size-5 shrink-0 text-foreground/45" aria-hidden />
              <p className="text-sm text-foreground">
                <span className="font-semibold">Need a hand?</span>{" "}
                <span className="text-muted">Use the floating assistant or </span>
                <Link href="/contactus" className="font-semibold text-foreground underline-offset-2 hover:underline">
                  contact us
                </Link>
                .
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 sm:self-center"
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
