"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Sparkles, PenLine } from "lucide-react";

import CreateShopConcierge from "@/components/createShopConcierge";
import OpenShopWizard from "@/components/openShopWizard";
import type { apiShops } from "@/lib/api";

type Mode = "quick" | "manual";

export default function MerchantNewShopPage() {
  const [mode, setMode] = useState<Mode>("quick");
  const [created, setCreated] = useState<apiShops.Shop | null>(null);

  if (created) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-primary p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-accent/30 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            You&apos;re live
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {created.name}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Shop created. Next: verify your business and add your first listings.
          </p>
          <div className="relative mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={`/merchant/shops/${created.id}/verification`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
            >
              Verify shop
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link
              href={`/merchant/shops/${created.id}`}
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/15"
            >
              Manage shop
            </Link>
            <Link
              href={`/shops/${encodeURIComponent(created.slug)}`}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 hover:text-white"
            >
              View public page
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreated(null)}
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          Create another shop
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Midora merchants
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Open your shop
        </h1>
        <p className="max-w-lg text-sm text-muted">
          Describe your business once — Midora AI drafts the name, story, and
          details. Or fill everything in yourself.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="How to create your shop"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface-subtle/80 p-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "quick"}
          onClick={() => setMode("quick")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
            mode === "quick"
              ? "bg-accent text-white shadow-md shadow-accent/25"
              : "text-foreground/70 hover:bg-background hover:text-foreground"
          }`}
        >
          <Sparkles className="size-4 shrink-0" aria-hidden />
          Create with AI
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "manual"}
          onClick={() => setMode("manual")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
            mode === "manual"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-foreground/70 hover:bg-background hover:text-foreground"
          }`}
        >
          <PenLine className="size-4 shrink-0" aria-hidden />
          Manual setup
        </button>
      </div>

      {mode === "quick" ? (
        <section className="overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-b from-accent/[0.07] via-background to-background shadow-sm">
          <div className="border-b border-accent/15 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/30">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  AI shop builder
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Chat in plain language. Review the draft, then publish.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <CreateShopConcierge onShopCreated={setCreated} />
          </div>
        </section>
      ) : (
        <OpenShopWizard />
      )}
    </div>
  );
}
