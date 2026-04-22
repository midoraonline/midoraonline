"use client";

import Link from "next/link";

import { useAppSession } from "@/lib/state";

export default function CustomerOverviewPage() {
  const session = useAppSession();
  const name =
    session.user?.full_name?.trim() || session.user?.email?.trim() || "friend";

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Customer
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Hi, {name} 👋
        </h1>
        <p className="mt-2 text-sm text-muted">
          Track your orders, manage saved shops, and update your profile.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickCard
          href="/customer/profile"
          title="My profile"
          description="Update your contact info and avatar."
        />
        <QuickCard
          href="/customer/orders"
          title="Orders"
          description="View purchase history and status."
        />
        <QuickCard
          href="/customer/saved"
          title="Saved shops"
          description="Quickly return to shops you love."
        />
      </section>

      <section className="dm-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Discover shops</h2>
        <p className="mt-1 text-sm text-muted">
          Browse the latest verified shops on Midora.
        </p>
        <Link
          href="/shops"
          className="dm-pill dm-focus mt-4 inline-flex bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
        >
          Browse shops →
        </Link>
      </section>
    </div>
  );
}

function QuickCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="dm-card group flex flex-col gap-1 p-5 transition hover:-translate-y-0.5"
    >
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="text-sm text-muted">{description}</p>
      <p className="mt-auto pt-4 text-xs font-semibold text-foreground/70 group-hover:text-foreground">
        Open →
      </p>
    </Link>
  );
}
