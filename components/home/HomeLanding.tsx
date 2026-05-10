"use client";

import Link from "next/link";
import { ArrowRight, Search, Store, X } from "lucide-react";
import { useMemo, useState } from "react";

import ShopCard from "@/components/shopcard";
import ProductCard from "@/components/productcard";
import type { Shop } from "@/lib/api/shops";
import type { ProductCardData } from "@/components/productcard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function locationDisplay(loc: unknown): string {
  if (typeof loc === "string") return loc;
  if (loc && typeof loc === "object" && "display" in loc)
    return String((loc as { display?: string }).display ?? "Online");
  return "Online";
}

function matchesQuery(text: string, q: string): boolean {
  return text.toLowerCase().includes(q.toLowerCase());
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="dm-pill dm-focus inline-flex shrink-0 items-center gap-1.5 bg-foreground/[0.07] px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="dm-card p-6 sm:p-8">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  initialShops: Shop[];
  initialProducts: ProductCardData[];
  mostViewed: ProductCardData[];
};

export default function HomeLanding({ initialShops, initialProducts, mostViewed }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const isSearching = q.length > 0;

  const filteredShops = useMemo(() => {
    if (!isSearching) return initialShops.filter((s) => s.is_active !== false);
    return initialShops.filter(
      (s) =>
        s.is_active !== false &&
        (matchesQuery(s.name, q) ||
          matchesQuery(s.description ?? "", q) ||
          matchesQuery(s.category ?? "", q) ||
          matchesQuery(locationDisplay(s.location), q)),
    );
  }, [initialShops, q, isSearching]);

  const filteredProducts = useMemo(() => {
    if (!isSearching) return initialProducts.slice(0, 12);
    return initialProducts.filter(
      (p) =>
        matchesQuery(p.title, q) ||
        matchesQuery(p.shop.name, q),
    );
  }, [initialProducts, q, isSearching]);

  const shopsToShow = isSearching ? filteredShops : filteredShops.slice(0, 9);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 sm:space-y-14">

      {/* ── Hero + Search ───────────────────────────────────────────────── */}
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-foreground/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
              <Store className="size-3.5 shrink-0" aria-hidden />
              Uganda&apos;s brand-first mall
            </p>
            <h1 className="font-display text-3xl font-semibold leading-[1.12] tracking-tight sm:text-4xl">
              Discover shops & products on Midora
            </h1>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              Browse verified shops and their listings — search by name, category, or keyword.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shops and products…"
              aria-label="Search shops and products"
              className="dm-input w-full py-3 pl-11 pr-11 text-sm"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Quick CTAs */}
          {!isSearching && (
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/shops"
                className="dm-pill dm-focus bg-foreground/[0.07] px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
              >
                All shops
              </Link>
              <Link
                href="/products"
                className="dm-pill dm-focus bg-foreground/[0.07] px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
              >
                All products
              </Link>
              <Link
                href="/merchant/new"
                className="dm-pill dm-focus bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Open a shop
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Search results label ─────────────────────────────────────────── */}
      {isSearching && (
        <p className="text-sm text-muted">
          Showing results for{" "}
          <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
          {" "}—{" "}
          <button
            onClick={() => setQuery("")}
            className="font-semibold text-foreground underline-offset-2 hover:underline"
          >
            clear
          </button>
        </p>
      )}

      {/* ── Most Viewed Products (hidden while searching) ────────────────── */}
      {!isSearching && mostViewed.length > 0 && (
        <section className="space-y-5">
          <SectionHeader
            title="Trending Products"
            subtitle="The products getting the most attention right now."
            href="/products"
            linkLabel="See all products"
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            {mostViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Shops ───────────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeader
          title={isSearching ? `Shops matching "${q}"` : "Featured Shops"}
          subtitle={isSearching ? undefined : "Verified storefronts from across Uganda."}
          href={isSearching ? undefined : "/shops"}
          linkLabel={isSearching ? undefined : "See all shops"}
        />
        {shopsToShow.length === 0 ? (
          <EmptyState
            message={
              isSearching
                ? `No shops match "${q}". Try a different keyword.`
                : "No active shops yet — check back soon."
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
              {shopsToShow.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={{
                    id: shop.id,
                    slug: shop.slug,
                    name: shop.name,
                    category: shop.category ?? "Shop",
                    location: locationDisplay(shop.location),
                    tagline: shop.description ?? "",
                    verified: shop.is_active ?? true,
                    logoUrl: shop.logo_url ?? null,
                  }}
                />
              ))}
            </div>
            {!isSearching && filteredShops.length > 9 && (
              <div className="pt-1 text-center">
                <Link
                  href="/shops"
                  className="dm-pill dm-focus inline-flex items-center gap-1.5 bg-foreground/[0.07] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
                >
                  View all {filteredShops.length} shops
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Products ────────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeader
          title={isSearching ? `Products matching "${q}"` : "Latest Products"}
          subtitle={isSearching ? undefined : "Browse listings from shops on Midora. Shop logos appear on each card."}
          href={isSearching ? undefined : "/products"}
          linkLabel={isSearching ? undefined : "See all products"}
        />
        {filteredProducts.length === 0 ? (
          <EmptyState
            message={
              isSearching
                ? `No products match "${q}". Try a different keyword.`
                : "No products yet — check back soon."
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.slice(0, isSearching ? undefined : 12).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {!isSearching && initialProducts.length > 12 && (
              <div className="pt-1 text-center">
                <Link
                  href="/products"
                  className="dm-pill dm-focus inline-flex items-center gap-1.5 bg-foreground/[0.07] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
                >
                  View all {initialProducts.length} products
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Onboarding nudge ────────────────────────────────────────────── */}
      {!isSearching && (
        <section className="dm-card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">New to Midora?</p>
            <p className="mt-1 text-sm text-muted">
              Learn how the platform works — for shoppers and merchants alike.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="dm-pill dm-focus inline-flex shrink-0 items-center gap-2 bg-foreground/[0.07] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
          >
            How it works
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      )}
    </div>
  );
}
