"use client";

/**
 * Shops directory loading skeleton
 * Mirrors: app/shops/page.tsx
 */

import { Search, Mail, MapPin } from "lucide-react";
import CategoryFilterBar from "@/components/browse/CategoryFilterBar";
import { Skeleton, ShopCardSkeleton } from "@/components/skeletons/Skeleton";
import { browseShopGridClass } from "@/lib/browseCategories";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const DUMMY_SHOP_CATEGORIES = [
  "Fashion & Apparel",
  "Electronics",
  "Home & Garden",
  "Groceries",
  "Services",
  "Beauty",
];

export default function ShopsDirectoryLoading() {
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true" aria-label="Loading shops">
      {/* Top bar — scrolls away naturally */}
      <div className="border-b border-border bg-surface/80">
        <div className="dm-container flex h-9 items-center justify-center sm:justify-between">
          <div className="hidden items-center gap-4 text-xs text-muted sm:flex">
            <span className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Mail className="size-3.5 text-accent" />
              midoraonline@gmail.com
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-accent" />
              Kampala, Uganda
            </span>
          </div>
          <div className="text-xs text-muted">
            Rent a shop for{" "}
            <span className="font-semibold text-foreground">5,000 UGX/month</span>
          </div>
        </div>
      </div>
      <Navbar />

      <main className="flex-1">
        <div className="dm-container py-5 sm:py-8 lg:py-10">
          <div className="w-full">
            {/* Page header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Browse Shops</h1>
                <Skeleton className="h-5 w-24" rounded="md" />
              </div>
              <p className="mt-1.5 text-sm text-muted">
                Discover verified sellers across Uganda — browse by category or search by name.
              </p>
            </div>

            {/* Search bar skeleton */}
            <div className="mb-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <div className="dm-input w-full rounded-xl border-border bg-surface py-2.5 pl-10 h-10">
                  <span className="text-sm text-muted/60">Loading search...</span>
                </div>
              </div>
            </div>

            {/* Category filter bar with dummy categories */}
            <CategoryFilterBar
              categories={DUMMY_SHOP_CATEGORIES}
              selected={null}
              onSelect={() => {}}
            />

            {/* Shop grid */}
            <div className="space-y-4">
              <div className={browseShopGridClass}>
                {Array.from({ length: 8 }, (_, i) => (
                  <ShopCardSkeleton key={i} delay={i + 1} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
