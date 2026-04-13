"use client";

import { useState } from "react";
import Link from "next/link";
import CreateShopConcierge from "@/components/createShopConcierge";
import OpenShopWizard from "@/components/openShopWizard";
import type { apiShops } from "@/lib/api";

type Mode = "quick" | "manual";

const modeBtn =
  "dm-pill dm-focus px-4 py-2.5 text-sm font-semibold transition-colors sm:px-5";

export default function OpenShopPage() {
  const [mode, setMode] = useState<Mode>("quick");
  const [createdFromQuick, setCreatedFromQuick] = useState<apiShops.Shop | null>(null);

  if (createdFromQuick) {
    const shop = createdFromQuick;
    return (
      <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
        <section className="dm-card p-6 sm:p-8 lg:p-10">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Shop created</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Your shop is ready. Add AI context and products from settings.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/shops/${encodeURIComponent(shop.slug)}`}
              className="dm-pill dm-focus inline-flex justify-center bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
            >
              View my shop
            </Link>
            <Link
              href={`/open-shop/settings/${shop.id}`}
              className="dm-pill dm-focus inline-flex justify-center bg-foreground/[0.07] px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
            >
              Shop settings
            </Link>
            <button
              type="button"
              onClick={() => setCreatedFromQuick(null)}
              className="dm-pill dm-focus inline-flex justify-center bg-foreground/[0.05] px-5 py-3 text-sm font-medium text-foreground/85 transition-colors hover:bg-foreground/[0.08]"
            >
              Create another
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Open a digital shop
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Use the AI assistant for a quick start, or set up manually with full control.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={
              modeBtn +
              (mode === "quick"
                ? " bg-primary text-primary-foreground"
                : " bg-foreground/[0.07] text-foreground/90 hover:bg-foreground/[0.1]")
            }
          >
            Quick start (AI)
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={
              modeBtn +
              (mode === "manual"
                ? " bg-primary text-primary-foreground"
                : " bg-foreground/[0.07] text-foreground/90 hover:bg-foreground/[0.1]")
            }
          >
            Set up manually
          </button>
        </div>
      </section>

      {mode === "quick" && (
        <section className="dm-card p-6 sm:p-8 lg:p-10">
          <h2 className="text-lg font-semibold tracking-tight">Quick start with AI</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Describe your business; the assistant will suggest name, slug, and description.
          </p>
          <div className="mt-6">
            <CreateShopConcierge onShopCreated={setCreatedFromQuick} />
          </div>
        </section>
      )}

      {mode === "manual" && <OpenShopWizard />}
    </div>
  );
}
