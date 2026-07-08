import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";

export default function HomeHero() {
  return (
    <section className="relative flex min-h-[380px] items-center overflow-hidden rounded-3xl bg-primary p-6 text-white sm:min-h-[460px] sm:p-12 lg:p-16">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero_lady_market.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/55 to-primary/10 md:from-primary/90 md:via-primary/45 md:to-transparent" />

      <div className="relative z-10 max-w-xl space-y-6">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            <MaterialSymbol name="storefront" className="!text-xs text-accent" />
            Uganda&apos;s trusted marketplace
          </p>
          <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Find what you <br />
            need near you – <br />
            <span className="text-accent">fast.</span>
          </h1>
          <p className="max-w-sm text-xs leading-relaxed text-white/75 sm:text-sm">
            Real sellers. Clear prices. No scams. No stress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/products"
            className="rounded-full bg-accent px-6 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-accent-hover active:scale-95"
          >
            Browse Products
          </Link>
          <Link
            href="/open-shop"
            className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-xs font-bold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/15 active:scale-95"
          >
            Sell an Item
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-3">
          {[
            { icon: "verified_user", title: "Verified sellers", sub: "Shop with confidence" },
            { icon: "location_on", title: "Local deals", sub: "Near you in Kampala" },
            { icon: "bolt", title: "Fast response", sub: "Chat with sellers" },
          ].map((item) => (
            <div key={item.icon} className="flex items-center gap-2">
              <span className="shrink-0 rounded-lg bg-accent/15 p-1.5 text-accent">
                <MaterialSymbol name={item.icon} className="!text-sm" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold leading-none text-white">{item.title}</p>
                <p className="mt-0.5 text-[9px] text-white/55">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
