"use client";

import { useState } from "react";
import Link from "next/link";
import CreateShopConcierge from "@/components/createShopConcierge";
import OpenShopWizard from "@/components/openShopWizard";
import type { apiShops } from "@/lib/api";

type Mode = "quick" | "manual";

export default function OpenShopPage() {
  const [mode, setMode] = useState<Mode>("quick");
  const [createdFromQuick, setCreatedFromQuick] = useState<apiShops.Shop | null>(null);

  if (createdFromQuick) {
    const shop = createdFromQuick;
    return (
      <div className="space-y-6">
        <section className="dm-card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Shop created</h1>
          <p className="mt-2 text-sm text-muted">
            Your shop is ready. Add AI context and products from settings.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/shops/${encodeURIComponent(shop.slug)}`}
              className="dm-pill dm-focus bg-primary text-primary-foreground hover:opacity-95 px-4 py-2.5 text-sm font-semibold"
            >
              View my shop
            </Link>
            <Link
              href={`/open-shop/settings/${shop.id}`}
              className="dm-pill dm-focus border border-border bg-surface text-foreground/85 hover:bg-primary/5 px-4 py-2.5 text-sm font-semibold"
            >
              Shop settings
            </Link>
            <button
              type="button"
              onClick={() => setCreatedFromQuick(null)}
              className="dm-pill dm-focus border border-border bg-surface text-foreground/80 hover:bg-primary/5 px-4 py-2.5 text-sm"
            >
              Create another
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Open a digital shop</h1>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Use the AI assistant for a quick start, or set up manually with full control.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={"dm-pill dm-focus px-4 py-2.5 text-sm font-semibold " + (mode === "quick" ? "bg-primary text-primary-foreground" : "border border-border bg-surface text-foreground/85 hover:bg-primary/5")}
          >
            Quick start (AI)
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={"dm-pill dm-focus px-4 py-2.5 text-sm font-semibold " + (mode === "manual" ? "bg-primary text-primary-foreground" : "border border-border bg-surface text-foreground/85 hover:bg-primary/5")}
          >
            Set up manually
          </button>
        </div>
      </section>

      {mode === "quick" && (
        <section className="dm-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Quick start with AI</h2>
          <p className="mt-1 text-sm text-muted">Describe your business; the assistant will suggest name, slug, and description.</p>
          <div className="mt-4">
            <CreateShopConcierge onShopCreated={setCreatedFromQuick} />
          </div>
        </section>
      )}

      {mode === "manual" && <OpenShopWizard />}
    </div>
  );
}
