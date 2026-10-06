"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  Compass,
  MessageCircle,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  UserPlus,
} from "lucide-react";
import { type ReactNode } from "react";

const softCard = "rounded-lg border border-border bg-surface p-6 sm:p-8 shadow-xs transition-all hover:shadow-md hover:border-accent/40";

function Reveal({ children, delayMs = 0 }: { children: ReactNode; delayMs?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: delayMs / 1000, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function OnboardingPage() {
  return (
    <div className="w-full space-y-12 pb-12 sm:space-y-16 lg:space-y-20">

      {/* Hero Section */}
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white min-h-[380px] sm:min-h-[440px] flex items-center p-6 sm:p-12 lg:p-16">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero_lady_market.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          
          <div className="relative z-10 max-w-2xl space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 border border-orange-500/30 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
              <Sparkles className="size-3.5 shrink-0" aria-hidden />
              Brand-First Marketplace
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white">
              Your brand deserves the spotlight—not buried in an endless grid.
            </h1>
            <p className="max-w-md text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Discover products, services, and opportunities from local sellers. Merchants can build a storefront; shoppers can see who is behind each listing.
            </p>
            
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/open-shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 px-6 py-3 text-xs font-bold text-white transition-all shadow-lg hover:shadow-orange-600/15 active:scale-95 cursor-pointer"
              >
                Open your shop
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/shops"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-3 text-xs font-bold text-white backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
              >
                Explore shops
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {["Free plan available", "Optional shop verification", "Direct seller contact"].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/5 border border-white/5 px-3 py-1 text-[10px] font-bold text-neutral-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Why Midora Heading */}
      <section className="space-y-6" aria-labelledby="why-midora-heading">
        <Reveal>
          <div>
            <h2
              id="why-midora-heading"
              className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Why Midora Online
            </h2>
            <p className="mt-2 max-w-2xl text-xs text-muted sm:text-sm">
              Generic marketplaces optimize for the cheapest click. We optimize for{" "}
              <span className="font-semibold text-orange-600">brand memory</span>—so repeat customers know exactly who they bought from.
            </p>
          </div>
        </Reveal>
        
        {/* Core Value Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              body: "Clear contact paths and optional shop trust checks help buyers make informed decisions.",
              icon: Shield,
            },
          ].map((item, i) => (
            <Reveal key={item.title} delayMs={i * 80}>
              <motion.article 
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col rounded-lg border border-border bg-surface p-6 shadow-xs"
              >
                <div className="w-fit rounded-xl bg-accent/10 p-3 text-accent">
                  <item.icon className="size-6 shrink-0" aria-hidden />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{item.body}</p>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Two paths: Merchants vs Shoppers */}
      <section className="space-y-6" aria-labelledby="how-heading">
        <Reveal>
          <div>
            <h2
              id="how-heading"
              className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              How to use Midora
            </h2>
            <p className="mt-2 max-w-2xl text-xs text-muted sm:text-sm">
              Same platform, two simple paths—whether you sell or shop.
            </p>
          </div>
        </Reveal>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal delayMs={50}>
            <div className={`${softCard}`}>
              <p className="w-fit rounded-md bg-accent/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-accent">
                Merchants
              </p>
              <ol className="mt-5 space-y-4">
                {[
                  "Create an account or sign in. A shopper account can open a shop later.",
                  "Before your first shop or listing, verify one account phone or email if it is not already verified.",
                  "Open a storefront with the step-by-step form or AI concierge, or post directly with a personal seller profile.",
                  "Add products, services, or opportunities. If you have multiple shops, choose which storefront owns each listing.",
                  "Complete the publishing checks, then share your shop or listing with buyers.",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-sm font-bold text-accent">
                      {idx + 1}
                    </span>
                    <span className="pt-1 text-xs leading-relaxed text-foreground/80 sm:text-sm">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          
          <Reveal delayMs={100}>
            <div className={`${softCard}`}>
              <p className="w-fit rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Shoppers
              </p>
              <ol className="mt-5 space-y-4">
                {[
                  "Browse shops, products, services, and opportunities without signing in.",
                  "Compare listing details and shop information, including ratings and trust badges when available.",
                  "Contact the seller through Midora messages or WhatsApp when offered.",
                  "Agree on payment and delivery directly with the seller; Midora does not process checkout.",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {idx + 1}
                    </span>
                    <span className="pt-1 text-xs leading-relaxed text-foreground/80 sm:text-sm">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
        <p className="border-l-2 border-accent/50 pl-4 text-xs leading-relaxed text-foreground/80 sm:text-sm">
          Account contact verification is shared between opening a shop and posting listings. Shop identity or business verification is a separate, optional process for trust badges and some plan benefits; it is not the account OTP step.
        </p>
      </section>

      {/* Background Image Overlay CTA Section */}
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white min-h-[300px] flex items-center p-6 sm:p-12">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85"
            style={{ backgroundImage: "url('/hero_lady_market.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
          
          <div className="relative z-10 max-w-lg space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight">
              Ready to grow your business or browse Kampala&apos;s best?
            </h2>
            <p className="text-xs text-neutral-300 leading-normal max-w-sm">
              Start with the free plan; paid plans may offer higher limits and additional tools. Buyers contact sellers through the channels available on each listing.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/open-shop"
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs rounded-full transition-all shadow-lg hover:shadow-orange-600/10 cursor-pointer"
              >
                Get Started
              </Link>
              <Link
                href="/products"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs rounded-full backdrop-blur-xs transition-all cursor-pointer"
              >
                Browse Feed
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Analytics / Stats tracking Section */}
      <section className="space-y-6" aria-labelledby="stats-heading">
        <Reveal>
          <div>
            <h2
              id="stats-heading"
              className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Track your performance
            </h2>
            <p className="mt-2 max-w-2xl text-xs text-muted sm:text-sm">
              Analytics are available on eligible plans, with views into shop activity and listing engagement.
            </p>
          </div>
        </Reveal>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Shop views",
              body: "See how many visitors have landed on your storefront and which days drive the most traffic.",
              icon: BarChart2,
            },
            {
              title: "Listing engagement",
              body: "Track listing views and likes to see what your audience responds to.",
              icon: Package,
            },
            {
              title: "Follower growth",
              body: "Watch your follower count grow as returning shoppers subscribe to your brand.",
              icon: UserPlus,
            },
          ].map((item, i) => (
            <Reveal key={item.title} delayMs={i * 80}>
              <motion.article 
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col rounded-lg border border-border bg-surface p-6 shadow-xs"
              >
                <div className="w-fit rounded-xl bg-accent/10 p-3 text-accent">
                  <item.icon className="size-6 shrink-0" aria-hidden />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{item.body}</p>
              </motion.article>
            </Reveal>
          ))}
        </div>
        
        <Reveal>
          <p className="text-xs text-muted">
            Access your analytics from{" "}
            <Link
              href="/merchant"
              className="font-bold text-orange-600 underline-offset-2 hover:underline"
            >
              your merchant dashboard
            </Link>{" "}
            → select a shop → Analytics tab.
          </p>
        </Reveal>
      </section>

      {/* Merchant vs Shopper Detailed Grid */}
      <section className="space-y-6" aria-labelledby="value-heading">
        <Reveal>
          <div>
            <h2
              id="value-heading"
              className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Value we add
            </h2>
            <p className="mt-2 max-w-2xl text-xs text-muted sm:text-sm">
              One neutral mall, two audiences—each gets structure that respects their goals.
            </p>
          </div>
        </Reveal>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className={`${softCard}`}>
              <div className="flex items-center gap-2.5 text-foreground">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <Store className="size-5 shrink-0" aria-hidden />
                </div>
                <h3 className="font-bold text-sm sm:text-base">For merchants</h3>
              </div>
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-foreground/80 sm:text-sm">
                <li className="pl-1">
                  Faster launch than a bespoke site; stronger brand than a lone listing.
                </li>
                <li className="pl-1">
                  Room for story, visuals, and policy—so you look established.
                </li>
                <li className="pl-1">
                  One hub for discovery, questions, and repeat visits.
                </li>
                <li className="pl-1">
                  Analytics on eligible plans to track shop views, listing engagement, and follower growth.
                </li>
              </ul>
            </div>
          </Reveal>
          
          <Reveal delayMs={80}>
            <div className={`${softCard}`}>
              <div className="flex items-center gap-2.5 text-foreground">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
                  <ShoppingBag className="size-5 shrink-0" aria-hidden />
                </div>
                <h3 className="font-bold text-sm sm:text-base">For shoppers</h3>
              </div>
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-foreground/80 sm:text-sm">
                <li className="pl-1">See who you&apos;re buying from before you commit.</li>
                <li className="pl-1">
                  Browse products, services and opportunities with context—less guesswork, fewer regrets.
                </li>
                <li className="pl-1">
                  A calmer, more legible alternative to chaotic marketplaces.
                </li>
                <li className="pl-1">
                  Follow your favourite shops and get alerted to new listings.
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final contact CTA */}
      <Reveal>
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-accent/10 p-2 text-accent">
              <MessageCircle className="size-5" aria-hidden />
            </div>
            <p className="text-xs text-foreground/80 sm:text-sm">
              <span className="font-bold">Need a hand?</span>{" "}
              <span className="text-muted">Use the floating assistant or </span>
              <Link
                href="/contactus"
                className="font-bold text-accent underline-offset-2 hover:underline"
              >
                contact us
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:shrink-0 justify-end">
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-lg bg-surface-subtle px-5 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-border"
            >
              Browse shops
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md hover:shadow-orange-600/10 cursor-pointer"
            >
              <UserPlus className="size-4" aria-hidden />
              Get started
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
