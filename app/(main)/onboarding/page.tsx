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

const softCard = "rounded-3xl border border-neutral-200/60 bg-white p-6 sm:p-8 shadow-xs transition-all hover:shadow-md hover:border-orange-200/50";

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
    <div className="mx-auto w-full max-w-5xl space-y-12 sm:space-y-16 lg:space-y-20 pb-12">

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
              Midora Online is built so shoppers meet <span className="font-bold text-orange-400">shops first</span>, then products. Merchants get a custom storefront; customers get discovery that feels human.
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
              {["From 5,000 UGX/mo", "Verified-ready", "Policies & trust"].map((t) => (
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
              className="font-display text-2xl font-bold tracking-tight text-neutral-850 sm:text-3xl"
            >
              Why Midora Online
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-neutral-500">
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
              body: "Policies, verification, and clear contact paths help buyers commit with confidence.",
              icon: Shield,
            },
          ].map((item, i) => (
            <Reveal key={item.title} delayMs={i * 80}>
              <motion.article 
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className={`flex h-full flex-col p-6 bg-white border border-neutral-200/70 rounded-3xl shadow-xs`}
              >
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl w-fit">
                  <item.icon className="size-6 shrink-0" aria-hidden />
                </div>
                <h3 className="mt-4 font-bold text-neutral-850 text-sm">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">{item.body}</p>
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
              className="font-display text-2xl font-bold tracking-tight text-neutral-850 sm:text-3xl"
            >
              How to use Midora
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-neutral-500">
              Same platform, two simple paths—whether you sell or shop.
            </p>
          </div>
        </Reveal>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal delayMs={50}>
            <div className={`${softCard}`}>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md w-fit">
                Merchants
              </p>
              <ol className="mt-5 space-y-4">
                {[
                  "Create your account and choose merchant.",
                  "Open a shop—name, story, logo, and policies.",
                  "Add products and publish your storefront.",
                  "Share your shop link; customers browse you first.",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 border border-orange-100 text-sm font-bold text-orange-600">
                      {idx + 1}
                    </span>
                    <span className="pt-1 text-xs sm:text-sm leading-relaxed text-neutral-600">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          
          <Reveal delayMs={100}>
            <div className={`${softCard}`}>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-fit">
                Shoppers
              </p>
              <ol className="mt-5 space-y-4">
                {[
                  "Browse shops or jump straight to products.",
                  "Open a shop you like—read their story and policies.",
                  "Contact the merchant directly to place an order.",
                  "Return to the same brand next time—no anonymous SKUs.",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-sm font-bold text-emerald-600">
                      {idx + 1}
                    </span>
                    <span className="pt-1 text-xs sm:text-sm leading-relaxed text-neutral-600">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
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
              Create a shop space, publish your products, and chat directly with customers via WhatsApp. No fees, no fuss.
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
              className="font-display text-2xl font-bold tracking-tight text-neutral-850 sm:text-3xl"
            >
              Track your performance
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-neutral-500">
              Every shop comes with built-in analytics so you always know how your shop is performing.
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
              title: "Product engagement",
              body: "Track views and likes per product so you know what your audience actually wants.",
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
                className={`flex h-full flex-col p-6 bg-white border border-neutral-200/70 rounded-3xl shadow-xs`}
              >
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl w-fit">
                  <item.icon className="size-6 shrink-0" aria-hidden />
                </div>
                <h3 className="mt-4 font-bold text-neutral-850 text-sm">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">{item.body}</p>
              </motion.article>
            </Reveal>
          ))}
        </div>
        
        <Reveal>
          <p className="text-xs text-neutral-500">
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
              className="font-display text-2xl font-bold tracking-tight text-neutral-850 sm:text-3xl"
            >
              Value we add
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-neutral-500">
              One neutral mall, two audiences—each gets structure that respects their goals.
            </p>
          </div>
        </Reveal>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className={`${softCard}`}>
              <div className="flex items-center gap-2.5 text-neutral-850">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Store className="size-5 shrink-0" aria-hidden />
                </div>
                <h3 className="font-bold text-sm sm:text-base">For merchants</h3>
              </div>
              <ul className="mt-4 space-y-3 text-xs sm:text-sm leading-relaxed text-neutral-600">
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
                  Built-in analytics to track shop views, product engagement, and follower growth.
                </li>
              </ul>
            </div>
          </Reveal>
          
          <Reveal delayMs={80}>
            <div className={`${softCard}`}>
              <div className="flex items-center gap-2.5 text-neutral-850">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShoppingBag className="size-5 shrink-0" aria-hidden />
                </div>
                <h3 className="font-bold text-sm sm:text-base">For shoppers</h3>
              </div>
              <ul className="mt-4 space-y-3 text-xs sm:text-sm leading-relaxed text-neutral-600">
                <li className="pl-1">See who you&apos;re buying from before you commit.</li>
                <li className="pl-1">
                  Browse products with context—less guesswork, fewer regrets.
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
        <section className={`flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between bg-white border border-neutral-200/70 rounded-3xl shadow-xs`}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl shrink-0">
              <MessageCircle className="size-5" aria-hidden />
            </div>
            <p className="text-xs sm:text-sm text-neutral-600">
              <span className="font-bold">Need a hand?</span>{" "}
              <span className="text-neutral-500">Use the floating assistant or </span>
              <Link
                href="/contactus"
                className="font-bold text-orange-600 underline-offset-2 hover:underline"
              >
                contact us
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:shrink-0 justify-end">
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-100 hover:bg-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-700 transition-colors"
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
