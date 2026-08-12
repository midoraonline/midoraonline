import { MaterialSymbol } from "@/components/MaterialSymbol";
import HeroActions from "@/components/home/HeroActions";

const HIGHLIGHTS = [
  { icon: "storefront", label: "Browse local shops" },
  { icon: "forum", label: "Chat with sellers" },
  { icon: "sell", label: "List your items free" },
] as const;

export default function HomeHero() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold leading-tight tracking-tight text-foreground sm:text-xl">
            Find what you need near you — <span className="text-accent">fast.</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted sm:text-[13px]">
            Discover verified local shops, message sellers, and list your own items in seconds.
          </p>
        </div>

        <HeroActions />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-2.5">
        {HIGHLIGHTS.map((item) => (
          <div
            key={item.icon}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted"
          >
            <MaterialSymbol name={item.icon} className="!text-sm text-accent" />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
