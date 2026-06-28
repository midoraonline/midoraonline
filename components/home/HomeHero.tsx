import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white min-h-[380px] sm:min-h-[460px] flex items-center p-6 sm:p-12 lg:p-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero_lady_market.png')" }}
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent md:from-black/75 md:via-black/35 md:to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-xl space-y-6">
        <div className="space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white">
            Find what you <br />
            need near you – <br />
            <span className="text-orange-500">fast.</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-sm">
            Real sellers. Clear prices. <br />
            No scams. No stress.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/products"
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs rounded-full transition-all shadow-lg hover:shadow-orange-600/10 active:scale-95 cursor-pointer"
          >
            Browse Products
          </Link>
          <Link
            href="/open-shop"
            className="px-6 py-3 bg-black/60 border border-neutral-700 hover:border-neutral-500 text-white font-bold text-xs rounded-full backdrop-blur-xs transition-all hover:bg-black/80 active:scale-95 cursor-pointer"
          >
            Sell an Item
          </Link>
        </div>

        {/* Feature Icons (Orange Theme) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <MaterialSymbol name="verified_user" className="!text-sm" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-100 leading-none">Verified sellers</p>
              <p className="text-[9px] text-neutral-400 mt-0.5">Shop with confidence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <MaterialSymbol name="location_on" className="!text-sm" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-100 leading-none">Local deals</p>
              <p className="text-[9px] text-neutral-400 mt-0.5">Near you in Kampala</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <MaterialSymbol name="bolt" className="!text-sm" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-100 leading-none">Fast response</p>
              <p className="text-[9px] text-neutral-400 mt-0.5">Chat directly with sellers</p>
            </div>
          </div>
        </div>

        {/* Listings Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/45 backdrop-blur-xs text-[10px] font-semibold text-neutral-200 rounded-full border border-white/5 shadow-sm">
          <MaterialSymbol name="local_fire_department" className="!text-xs text-orange-500" />
          <span>128 new listings added today in Kampala</span>
        </div>
      </div>
    </section>
  );
}
