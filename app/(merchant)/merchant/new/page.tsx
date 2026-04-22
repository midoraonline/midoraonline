"use client";

import Link from "next/link";
import { useState } from "react";

import CreateShopConcierge from "@/components/createShopConcierge";
import OpenShopWizard from "@/components/openShopWizard";
import type { apiShops } from "@/lib/api";

type Mode = "quick" | "manual";

export default function MerchantNewShopPage() {
  const [mode, setMode] = useState<Mode>("quick");
  const [created, setCreated] = useState<apiShops.Shop | null>(null);

  if (created) {
    return (
      <div className="space-y-4">
        <div className="dm-card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Shop created
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your shop is ready. Add AI context and products from settings.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={`/merchant/shops/${created.id}`}
              className="dm-pill dm-focus inline-flex justify-center bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              Manage this shop
            </Link>
            <Link
              href={`/shops/${encodeURIComponent(created.slug)}`}
              className="dm-pill dm-focus inline-flex justify-center bg-foreground/[0.07] px-5 py-2.5 text-sm font-semibold hover:bg-foreground/[0.1]"
            >
              View public page
            </Link>
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="dm-pill dm-focus inline-flex justify-center bg-foreground/[0.05] px-5 py-2.5 text-sm font-medium hover:bg-foreground/[0.08]"
            >
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Merchant
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Open a new shop
        </h1>
      </header>

      <section className="dm-card p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={`dm-pill dm-focus px-4 py-2 text-sm font-semibold transition-colors ${
              mode === "quick"
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/[0.07] text-foreground/90 hover:bg-foreground/[0.1]"
            }`}
          >
            Quick start (AI)
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`dm-pill dm-focus px-4 py-2 text-sm font-semibold transition-colors ${
              mode === "manual"
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/[0.07] text-foreground/90 hover:bg-foreground/[0.1]"
            }`}
          >
            Set up manually
          </button>
        </div>
      </section>

      {mode === "quick" ? (
        <section className="dm-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Quick start with AI</h2>
          <p className="mt-1 text-sm text-muted">
            Describe your business; the assistant will suggest name, slug, and description.
          </p>
          <div className="mt-5">
            <CreateShopConcierge onShopCreated={setCreated} />
          </div>
        </section>
      ) : (
        <OpenShopWizard />
      )}
    </div>
  );
}
