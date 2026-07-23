import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";

export default function HomeHero() {
  return (
    <section className="relative flex min-h-[190px] items-center overflow-hidden rounded-3xl bg-primary p-4 text-white sm:min-h-[230px] sm:p-6 lg:p-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero_lady_market.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/55 to-primary/10 md:from-primary/90 md:via-primary/45 md:to-transparent" />

      <div className="relative z-10 max-w-xl space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
            Find what you <br />
            need near you – 
            <span className="text-accent">fast.</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/products"
            className="rounded-full bg-accent px-5 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-accent-hover active:scale-95"
          >
            Browse Products
          </Link>
          <Link
            href="/open-shop"
            className="rounded-full border border-white/25 bg-white/10 px-5 py-2 text-xs font-bold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/15 active:scale-95"
          >
            Create a Shop
          </Link>
        </div>

        <div className="hidden grid-cols-3 gap-3 border-t border-white/10 pt-3 sm:grid">
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
