"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import type { FilterState } from "@/components/browse/ProductFilters";

type Props = {
  onApplyFilter: (partial: Partial<FilterState>) => void;
  onScrollToFeed: () => void;
};

const ACTIONS = [
  {
    key: "deals",
    icon: "sell",
    title: "Hot Deals",
    sub: "Under UGX 100,000",
    cta: "Shop now",
    filter: { maxPrice: 100000 } as Partial<FilterState>,
    href: null,
  },
  {
    key: "popular",
    icon: "bolt",
    title: "Fast Movers",
    sub: "Popular this week",
    cta: "Shop now",
    filter: { sort: "most_viewed" as const },
    href: null,
  },
  {
    key: "new",
    icon: "new_releases",
    title: "New Arrivals",
    sub: "Fresh items daily",
    cta: "Shop now",
    filter: { sort: "newest" as const },
    href: null,
  },
  {
    key: "sell",
    icon: "storefront",
    title: "List More. Sell More",
    sub: "Grow your business",
    cta: "Open your shop",
    filter: null,
    href: "/open-shop",
  },
] as const;

function ActionCard({
  icon,
  title,
  sub,
  cta,
  onClick,
  href,
}: {
  icon: string;
  title: string;
  sub: string;
  cta: string;
  onClick?: () => void;
  href?: string | null;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-xl bg-primary/5 p-2 text-primary ring-1 ring-primary/10">
          <MaterialSymbol name={icon} className="!text-lg text-accent" />
        </span>
        <MaterialSymbol
          name="arrow_forward"
          className="!text-base text-accent transition-transform group-hover:translate-x-0.5"
        />
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-bold text-primary">{title}</h3>
        <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
      </div>
      <span className="mt-3 text-[11px] font-semibold text-accent">{cta}</span>
    </>
  );

  const className =
    "group flex h-full min-h-[8.5rem] w-60 shrink-0 flex-col justify-between rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition-all hover:border-accent/35 hover:shadow-md sm:w-auto cursor-pointer";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export default function HomeQuickActions({ onApplyFilter, onScrollToFeed }: Props) {
  return (
    <div className="mb-8 flex gap-3 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-4">
      {ACTIONS.map((action) => (
        <ActionCard
          key={action.key}
          icon={action.icon}
          title={action.title}
          sub={action.sub}
          cta={action.cta}
          href={action.href}
          onClick={
            action.filter
              ? () => {
                  onApplyFilter(action.filter!);
                  onScrollToFeed();
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
