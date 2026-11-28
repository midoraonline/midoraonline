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
              Shops first
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white">
              Give your business its own shop, not just another listing.
            </h1>
            <p className="max-w-md text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Find listings from sellers near you. Sellers can open a shop, and buyers can see who is behind each listing.
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
              {["Free plan", "Optional shop verification", "Contact sellers directly"].map((t) => (
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
              Why Midora
            </h2>
            <p className="mt-2 max-w-2xl text-xs text-muted sm:text-sm">
              Many marketplaces only show the cheapest item. We help buyers{" "}
              <span className="font-semibold text-orange-600">remember your shop</span>, so they know who they bought from and can come back.
            </p>
          </div>
        </Reveal>
        
        {/* Core Value Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Discovery, not noise",
              body: "Every shop gets its own page. Browsing feels like walking through a market, not reading a long list.",
              icon: Compass,
            },
            {
              title: "Built for growing businesses",
              body: "Cheaper and easier than building your own website, with more room to show your business than a single listing.",
              icon: Sparkles,
            },
            {
              title: "Trust by design",
              body: "Clear contact details and optional shop verification help buyers decide who to trust.",
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
              One place, two simple paths: one for selling, one for buying.
            </p>
          </div>
        </Reveal>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal delayMs={50}>
            <div className={`${softCard}`}>
              <p className="w-fit rounded-md bg-accent/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-accent">
                Sellers
              </p>
              <ol className="mt-5 space-y-4">
                {[
                  "Create an account or sign in. Any account can open a shop later.",
                  "Before your first shop or listing, confirm your phone number or email with a code. This helps keep fake sellers off Midora.",
                  "Open a shop with the step-by-step form or our AI helper. Or post listings on your own, without a shop.",
                  "Add listings. If you have more than one shop, choose which shop each listing goes in.",
                  "After a quick check, your listing goes live. Share your shop or listing with buyers.",
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
                Buyers
              </p>
              <ol className="mt-5 space-y-4">
                {[
                  "Browse shops and listings without signing in.",
                  "Compare listings and shops, including ratings and verified badges where shops have them.",
                  "Message the seller on Midora, or chat on WhatsApp if the seller offers it.",
                  "Agree on payment and delivery with the seller. Midora doesn't take payment for items, so meet in a safe place and check the item before you pay.",
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
          You only confirm your phone number or email once, for both opening a shop and posting listings. Shop verification (identity or business) is separate and optional. It gives your shop a badge and some plan benefits.
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
              Ready to grow your business, or find something near you?
            </h2>
            <p className="text-xs text-neutral-300 leading-normal max-w-sm">
              Start on the free plan. Paid plans let you add more shops and listings, and some include analytics.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/open-shop"
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs rounded-full transition-all shadow-lg hover:shadow-orange-600/10 cursor-pointer"
              >
                Open your shop
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs rounded-full backdrop-blur-xs transition-all cursor-pointer"
              >
                Browse listings
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
              Some plans include analytics, so you can see how your shop and listings are doing.
            </p>
          </div>
        </Reveal>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Shop views",
              body: "See how many people visited your shop and which days were busiest.",
              icon: BarChart2,
            },
            {
              title: "Listing views and likes",
              body: "See views and likes on each listing, so you know what buyers like.",
              icon: Package,
            },
            {
              title: "Followers",
              body: "See how many buyers follow your shop.",
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
            To see analytics, go to{" "}
            <Link
              href="/merchant"
              className="font-bold text-orange-600 underline-offset-2 hover:underline"
            >
              your dashboard
            </Link>
            , choose a shop, then open Analytics.
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
              What you get
            </h2>
            <p className="mt-2 max-w-2xl text-xs text-muted sm:text-sm">
              For sellers and buyers alike.
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
                <h3 className="font-bold text-sm sm:text-base">For sellers</h3>
              </div>
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-foreground/80 sm:text-sm">
                <li className="pl-1">
                  Quicker to start than your own website, and it shows more of your business than a single listing.
                </li>
                <li className="pl-1">
                  Space for your story, photos and policies, so buyers can trust you.
                </li>
                <li className="pl-1">
                  One place for buyers to find you, ask questions and come back.
                </li>
                <li className="pl-1">
                  Analytics on some plans: shop views, listing views and likes, and followers.
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
                <h3 className="font-bold text-sm sm:text-base">For buyers</h3>
              </div>
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-foreground/80 sm:text-sm">
                <li className="pl-1">See who you&apos;re buying from before you decide.</li>
                <li className="pl-1">
                  See full details on each listing, so there are fewer surprises.
                </li>
                <li className="pl-1">
                  A calmer, easier place to shop than crowded marketplaces.
                </li>
                <li className="pl-1">
                  Follow shops you like and find them again easily.
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
              <span className="text-muted">Use the chat assistant or </span>
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
              Create account
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
