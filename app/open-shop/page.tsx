"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, PenLine, Store, CheckCircle2, ShieldCheck } from "lucide-react";

import CreateShopConcierge from "@/components/createShopConcierge";
import OpenShopWizard from "@/components/openShopWizard";
import Logo from "@/components/Logo";
import { useAppSession } from "@/lib/state";
import type { apiShops } from "@/lib/api";

type CreationMode = "quick" | "manual";

export default function OpenShopPage() {
  const router = useRouter();
  const session = useAppSession();
  const [mode, setMode] = useState<CreationMode>("quick");
  const [createdShop, setCreatedShop] = useState<apiShops.Shop | null>(null);

  const stillResolving =
    !session.hydrated || (session.isAuthenticated && session.user === undefined);

  useEffect(() => {
    if (stillResolving) return;
    if (!session.isAuthenticated) {
      router.replace("/login?next=/open-shop");
    }
  }, [stillResolving, session.isAuthenticated, router]);

  if (stillResolving) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background p-6">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="dm-skeleton h-5 w-48 rounded-lg" />
          <p className="text-sm font-medium">Opening shop builder…</p>
        </div>
      </div>
    );
  }

  if (!session.isAuthenticated) return null;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Standalone Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-surface/80 px-4 sm:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo alt="Midora" width={100} height={32} className="h-8 w-auto rounded-xl transition-transform group-hover:scale-105" />
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted hidden sm:inline-block">
            Merchant Studio
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/merchant"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted hover:border-border-strong hover:text-foreground transition-all"
          >
            <ArrowLeft className="size-3.5" />
            Back to dashboard
          </Link>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="flex-1 w-full max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {createdShop ? (
          /* Created Success Screen */
          <div className="mx-auto max-w-xl space-y-6 pt-4">
            <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-primary via-primary/95 to-slate-900 p-8 text-white shadow-2xl">
              <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-accent/30 blur-3xl" />
              <div className="flex items-center gap-2 text-accent-light">
                <CheckCircle2 className="size-5 text-accent" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Shop Published</span>
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {createdShop.name}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Your storefront is live! Complete your verification to unlock trust badges.
              </p>

              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/merchant/shops/${createdShop.id}/verification`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/30 transition-all hover:bg-accent-hover hover:scale-[1.02]"
                >
                  <ShieldCheck className="size-4" />
                  Verify shop
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={`/merchant/shops/${createdShop.id}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  Manage shop
                </Link>
                <Link
                  href={`/shops/${encodeURIComponent(createdShop.slug)}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-medium text-white/70 hover:text-white hover:border-white/30 transition-all"
                >
                  View public page
                </Link>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setCreatedShop(null)}
                className="text-xs font-semibold text-muted hover:text-foreground transition-colors"
              >
                + Create another shop
              </button>
            </div>
          </div>
        ) : (
          /* Shop Builder Form View */
          <>
            {/* Header / Intro */}
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
                <Store className="size-3.5" />
                <span>Open Your Shop</span>
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Start selling on Midora
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-muted leading-relaxed">
                Describe your business once — our AI assistant will draft the store name, story, and details for you. Or customize everything manually.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div
              role="tablist"
              aria-label="Shop Creation Mode"
              className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface-subtle/80 p-1.5 max-w-lg shadow-sm"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "quick"}
                onClick={() => setMode("quick")}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold transition-all ${mode === "quick"
                    ? "bg-accent text-white shadow-md shadow-accent/25"
                    : "text-foreground/70 hover:bg-background hover:text-foreground"
                  }`}
              >
                <Sparkles className="size-4 shrink-0" />
                Create with AI
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "manual"}
                onClick={() => setMode("manual")}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold transition-all ${mode === "manual"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-foreground/70 hover:bg-background hover:text-foreground"
                  }`}
              >
                <PenLine className="size-4 shrink-0" />
                Manual setup
              </button>
            </div>

            {/* Active Mode Form Container */}
            <div className="w-full">
              {mode === "quick" ? (
                <section className="overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-b from-accent/[0.05] via-surface to-surface p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-start gap-4 border-b border-border/60 pb-5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/30">
                      <Sparkles className="size-6" />
                    </span>
                    <div>
                      <h2 className="font-display text-xl font-bold tracking-tight">
                        AI Shop Concierge
                      </h2>
                      <p className="mt-0.5 text-xs sm:text-sm text-muted">
                        Chat in plain English or Swahili/Luganda. Review your generated draft, then launch.
                      </p>
                    </div>
                  </div>

                  <CreateShopConcierge onShopCreated={setCreatedShop} />
                </section>
              ) : (
                <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
                  <OpenShopWizard />
                </section>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
