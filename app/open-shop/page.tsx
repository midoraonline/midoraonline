"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, PenLine, Store, CheckCircle2, ShieldCheck } from "lucide-react";

import StandaloneShell from "@/components/StandaloneShell";
import CreateShopConcierge from "@/components/createShopConcierge";
import OpenShopWizard from "@/components/openShopWizard";
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
      <StandaloneShell eyebrow="Merchant Studio">
        <div className="grid min-h-[calc(100dvh-64px)] place-items-center p-6">
          <div className="flex flex-col items-center gap-3 text-muted">
            <div className="dm-skeleton h-5 w-48 rounded-lg" />
            <p className="text-sm font-medium">Opening shop builder…</p>
          </div>
        </div>
      </StandaloneShell>
    );
  }

  if (!session.isAuthenticated) return null;

  return (
    <StandaloneShell eyebrow="Merchant Studio">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {createdShop ? (
          <CreatedSuccessCard shop={createdShop} onCreateAnother={() => setCreatedShop(null)} />
        ) : (
          <div className="space-y-8">
            <IntroHeader />
            <ModeSwitcher mode={mode} onChange={setMode} />
            <ActiveModeSection mode={mode} onShopCreated={setCreatedShop} />
          </div>
        )}
      </div>
    </StandaloneShell>
  );
}

function IntroHeader() {
  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
        <Store className="size-3.5" />
        Open your shop
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Start selling on Midora
      </h1>
      <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Describe your business once — our AI assistant drafts the store name, story, and details for you. Prefer full control? Switch to manual.
      </p>
    </div>
  );
}

function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: CreationMode;
  onChange: (m: CreationMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Shop creation mode"
      className="grid max-w-lg grid-cols-2 gap-1 rounded-2xl border border-border bg-surface-subtle p-1"
    >
      {(
        [
          { key: "quick" as const, label: "Create with AI", icon: Sparkles },
          { key: "manual" as const, label: "Manual setup", icon: PenLine },
        ]
      ).map(({ key, label, icon: Icon }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm",
              active
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ActiveModeSection({
  mode,
  onShopCreated,
}: {
  mode: CreationMode;
  onShopCreated: (s: apiShops.Shop) => void;
}) {
  if (mode === "quick") {
    return (
      <section className="dm-card overflow-hidden p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-border pb-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-sm">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              AI Shop Concierge
            </h2>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              Chat in plain English, Swahili, or Luganda. Review the draft, then launch.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <CreateShopConcierge onShopCreated={onShopCreated} />
        </div>
      </section>
    );
  }
  return (
    <section className="dm-card p-6 sm:p-8">
      <OpenShopWizard />
    </section>
  );
}

function CreatedSuccessCard({
  shop,
  onCreateAnother,
}: {
  shop: apiShops.Shop;
  onCreateAnother: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="dm-card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative flex items-center gap-2 text-accent">
          <CheckCircle2 className="size-5" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
            Shop published
          </span>
        </div>

        <h1 className="relative mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {shop.name}
        </h1>
        <p className="relative mt-2 text-sm leading-relaxed text-muted">
          Your storefront is live. Complete verification next to unlock trust badges and boost your placement in feeds.
        </p>

        <div className="relative mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={`/merchant/shops/${shop.id}/verification`}
            className="dm-btn dm-btn-primary inline-flex gap-2"
          >
            <ShieldCheck className="size-4" />
            Verify shop
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={`/merchant/shops/${shop.id}`}
            className="dm-btn dm-btn-secondary"
          >
            Manage shop
          </Link>
          <Link
            href={`/shops/${encodeURIComponent(shop.slug)}`}
            className="dm-btn dm-btn-ghost"
          >
            View public page
          </Link>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onCreateAnother}
          className="text-xs font-semibold text-muted transition-colors hover:text-foreground"
        >
          + Create another shop
        </button>
      </div>
    </div>
  );
}
