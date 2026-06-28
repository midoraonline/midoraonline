"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import CategoryFilterBar from "@/components/browse/CategoryFilterBar";
import ProductFilters, {
  applyFilters,
  DEFAULT_FILTERS,
  type FilterState,
} from "@/components/browse/ProductFilters";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";
import { catEquals, collectCategoriesFromProducts } from "@/lib/browseCategories";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import HomeHeroSlider from "@/components/home/HomeHeroSlider";
import { useAppSession } from "@/lib/state";
import { apiProducts } from "@/lib/api";
import { FEED_ENGAGEMENT_EVENT } from "@/lib/engagementEvents";
import { homeFeedProductToCard } from "@/lib/homeFeedCards";
import { publicSiteOrigin } from "@/lib/publicSite";

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
  icon,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl">
          {icon}
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="dm-btn dm-btn-sm shrink-0 bg-accent px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-accent-hover"
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
    <div className="dm-card flex flex-col items-center justify-center gap-3 p-8 text-center sm:p-12">
      <MaterialSymbol name="inventory_2" className="!text-4xl text-muted/30" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

type Props = {
  initialProducts: ProductCardData[];
};

export default function HomeLanding({
  initialProducts,
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const session = useAppSession();
  const [showPopup, setShowPopup] = useState<"signed-in" | "unsigned" | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const refreshFeed = useCallback(async () => {
    try {
      const site = publicSiteOrigin();
      const data = await apiProducts.getHomeFeed(72);
      setProducts((data.algorithm ?? []).map((p) => homeFeedProductToCard(p, site)));
    } catch {
      /* keep current feed */
    }
  }, []);

  useEffect(() => {
    function onEngagement() {
      void refreshFeed();
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshFeed();
      }
    }
    window.addEventListener(FEED_ENGAGEMENT_EVENT, onEngagement);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener(FEED_ENGAGEMENT_EVENT, onEngagement);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshFeed]);



  useEffect(() => {
    if (!session.hydrated) return;
    
    const isDismissed = localStorage.getItem("midora_popup_dismissed") === "true";
    if (isDismissed) return;

    const timer = setTimeout(() => {
      if (session.isAuthenticated) {
        setShowPopup("signed-in");
      } else {
        setShowPopup("unsigned");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [session.hydrated, session.isAuthenticated]);

  const dismissPopup = () => {
    localStorage.setItem("midora_popup_dismissed", "true");
    setShowPopup(null);
  };

  const categories = useMemo(
    () => collectCategoriesFromProducts(products),
    [products],
  );

  const heroImages = useMemo(() => {
    const seen = new Set<string>();
    const imgs: string[] = [];
    for (const p of products) {
      if (p.imageUrl && !seen.has(p.imageUrl)) {
        seen.add(p.imageUrl);
        imgs.push(p.imageUrl);
        if (imgs.length >= 4) break;
      }
    }
    return imgs;
  }, [products]);

  const browseProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) {
      list = list.filter(
        (p) =>
          catEquals(p.category, selectedCategory) ||
          catEquals(p.shop.category, selectedCategory),
      );
    }
    list = applyFilters(list, filters);
    return list;
  }, [products, selectedCategory, filters]);

  const displayProducts = browseProducts;
  const categoryFilterActive = selectedCategory !== null;
  const filterHint = categoryFilterActive ? ` · ${selectedCategory}` : "";
  const anyFiltersActive =
    categoryFilterActive ||
    filters.sort !== DEFAULT_FILTERS.sort ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.availableNow ||
    filters.verifiedOnly ||
    filters.minRating !== null ||
    filters.location !== null;

  return (
    <div className="w-full relative">
      {/* Onboarding Popups */}
      {showPopup === "unsigned" && (
        <div className="mb-6 bg-orange-600 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-orange-500 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/20 rounded-xl shrink-0">
              <MaterialSymbol name="login" className="!text-xl" />
            </span>
            <div>
              <h4 className="font-bold text-sm">Unlock the full Midora experience!</h4>
              <p className="text-xs text-white/90 mt-0.5">Sign in to save items to your watchlist, chat directly with sellers, and view nearby recommendations.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
            <Link
              href="/login"
              className="bg-white text-orange-600 hover:bg-neutral-50 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap cursor-pointer"
            >
              Sign In
            </Link>
            <button
              onClick={dismissPopup}
              className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Dismiss"
            >
              <MaterialSymbol name="close" className="!text-lg" />
            </button>
          </div>
        </div>
      )}

      {showPopup === "signed-in" && (
        <div className="mb-6 bg-neutral-900 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-neutral-800 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl text-orange-500 shrink-0">
              <MaterialSymbol name="auto_awesome" className="!text-xl" filled />
            </span>
            <div>
              <h4 className="font-bold text-sm text-orange-400">Welcome to Midora! Here is how to stroll:</h4>
              <p className="text-xs text-neutral-300 mt-0.5">1. Select your location. 2. Stroll through the uneven feed layout. 3. Click &quot;Chat&quot; to contact verified shops instantly.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={dismissPopup}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Got it!
            </button>
            <button
              onClick={dismissPopup}
              className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Dismiss"
            >
              <MaterialSymbol name="close" className="!text-lg text-neutral-400" />
            </button>
          </div>
        </div>
      )}

      <div className="mb-5 sm:mb-6 lg:mb-8">
        <HomeHeroSlider bgImages={heroImages} />
      </div>

      <div className="w-full">
        <CategoryFilterBar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <ProductFilters
          products={products}
          filters={filters}
          onChange={setFilters}
        />

        {/* Quick Action Banners (Redesigned Banners Grid) */}
        {!categoryFilterActive && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, maxPrice: 100000 }));
                document.getElementById("products-feed")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-orange-500/[0.03] to-orange-500/[0.01] border border-orange-200/50 hover:border-orange-400 hover:shadow-sm hover:scale-[1.01] transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                    <MaterialSymbol name="sell" className="!text-xl" />
                  </span>
                  <MaterialSymbol name="arrow_forward" className="!text-lg text-orange-600 transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-4 font-bold text-neutral-800 text-sm">Hot Deals</h3>
                <p className="text-xs text-neutral-500 mt-1">Under UGX 100,000</p>
              </div>
              <span className="text-xs font-semibold text-orange-600 mt-4">Shop now</span>
            </button>

            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, sort: "most_viewed" }));
                document.getElementById("products-feed")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-orange-500/[0.03] to-orange-500/[0.01] border border-orange-200/50 hover:border-orange-400 hover:shadow-sm hover:scale-[1.01] transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                    <MaterialSymbol name="bolt" className="!text-xl" />
                  </span>
                  <MaterialSymbol name="arrow_forward" className="!text-lg text-orange-600 transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-4 font-bold text-neutral-800 text-sm">Fast Movers</h3>
                <p className="text-xs text-neutral-500 mt-1">Popular this week</p>
              </div>
              <span className="text-xs font-semibold text-orange-600 mt-4">Shop now</span>
            </button>

            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, sort: "newest" }));
                document.getElementById("products-feed")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-orange-500/[0.03] to-orange-500/[0.01] border border-orange-200/50 hover:border-orange-400 hover:shadow-sm hover:scale-[1.01] transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                    <MaterialSymbol name="new_releases" className="!text-xl" />
                  </span>
                  <MaterialSymbol name="arrow_forward" className="!text-lg text-orange-600 transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-4 font-bold text-neutral-800 text-sm">New Arrivals</h3>
                <p className="text-xs text-neutral-500 mt-1">Fresh items daily</p>
              </div>
              <span className="text-xs font-semibold text-orange-600 mt-4">Shop now</span>
            </button>

            <Link
              href="/open-shop"
              className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-orange-500/[0.03] to-orange-500/[0.01] border border-orange-200/50 hover:border-orange-400 hover:shadow-sm hover:scale-[1.01] transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                    <MaterialSymbol name="storefront" className="!text-xl" />
                  </span>
                  <MaterialSymbol name="arrow_forward" className="!text-lg text-orange-600 transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-4 font-bold text-neutral-800 text-sm">List More. Sell More</h3>
                <p className="text-xs text-neutral-500 mt-1">Grow your business</p>
              </div>
              <span className="text-xs font-semibold text-orange-600 mt-4">Open your shop</span>
            </Link>
          </div>
        )}

        <div id="products-feed" className="space-y-8 sm:space-y-10 lg:space-y-12">
          {anyFiltersActive && (
            <div className="flex items-center gap-2 rounded-xl bg-surface-subtle px-4 py-2.5 text-sm">
              <span className="text-muted">
                {categoryFilterActive ? (
                  <>
                    Filtered by{" "}
                    <span className="font-semibold text-foreground">{selectedCategory}</span>
                    {browseProducts.length > 0 && (
                      <span className="text-muted/80"> · {browseProducts.length} result{browseProducts.length !== 1 ? "s" : ""}</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{browseProducts.length} result{browseProducts.length !== 1 ? "s" : ""}</span>
                    <span className="text-muted/80"> with filters applied</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setFilters(DEFAULT_FILTERS);
                }}
                className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          <section className="space-y-4">
            <SectionHeader
              title={`All Products${filterHint}`}
              subtitle="Browse all listings from shops on Midora."
              href="/products"
              linkLabel="See all"
            />
            {displayProducts.length === 0 ? (
              <EmptyState
                message={
                  anyFiltersActive
                    ? "No products match your filters. Try adjusting your filters."
                    : "No products yet — check back soon."
                }
              />
            ) : (
              <>
                {/* Redesigned grid with uniform product cards */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {displayProducts.slice(0, 24).map((p) => {
                    return (
                      <div key={p.id} className="h-full">
                        <ProductCard product={p} layout="vertical" />
                      </div>
                    );
                  })}
                </div>
                {products.length > 0 && (
                  <div className="pt-2 text-center">
                    <Link
                      href="/products"
                      className="dm-btn dm-btn-primary inline-flex items-center gap-1.5 px-6"
                    >
                      View all products
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="dm-card relative overflow-hidden p-6 sm:flex sm:items-center sm:justify-between sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent blur-2xl" />
            </div>
            <div className="relative min-w-0">
              <p className="text-sm font-semibold text-foreground">New to Midora?</p>
              <p className="mt-1 text-sm text-muted">
                Learn how the platform works — for shoppers and merchants alike.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="dm-btn dm-btn-primary relative mt-4 inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-xs sm:mt-0"
            >
              How it works
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </section>
        </div>
      </div>

      {/* Sticky Feedback Button */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-3 rounded-l-xl shadow-lg flex items-center gap-1 cursor-pointer [writing-mode:vertical-lr] select-none"
      >
        <MaterialSymbol name="rate_review" className="!text-sm mb-1" />
        <span>Feedback</span>
      </button>

      {/* Feedback Modal */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <MaterialSymbol name="rate_review" className="text-orange-600" />
                Submit Feedback
              </h3>
              <button
                onClick={() => {
                  setFeedbackOpen(false);
                  setFeedbackSubmitted(false);
                  setFeedbackText("");
                }}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <MaterialSymbol name="close" className="!text-lg" />
              </button>
            </div>
            
            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mx-auto">
                  <MaterialSymbol name="check_circle" className="!text-xl" filled />
                </div>
                <h4 className="font-bold text-neutral-800 text-sm">Thank you!</h4>
                <p className="text-xs text-neutral-500">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you think or report an issue..."
                  className="w-full h-28 p-3 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-orange-500 resize-none"
                />
                <button
                  disabled={!feedbackText.trim()}
                  onClick={() => setFeedbackSubmitted(true)}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
