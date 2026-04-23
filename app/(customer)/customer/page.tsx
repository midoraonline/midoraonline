"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import { useAppSession } from "@/lib/state";

export default function CustomerOverviewPage() {
  const session = useAppSession();
  const name =
    session.user?.full_name?.trim() || session.user?.email?.trim() || "friend";

  const [followed, setFollowed] = useState<number | null>(null);
  const [liked, setLiked] = useState<number | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      const [f, l] = await Promise.all([
        apiShops.myFollowedShops(),
        apiShops.myLikedShops(),
      ]);
      setFollowed(f.total ?? f.items?.length ?? 0);
      setLiked(l.total ?? l.items?.length ?? 0);
    } catch {
      // non-critical — counts stay null
    }
  }, []);

  useEffect(() => {
    if (session.hydrated && session.isAuthenticated) {
      void loadCounts();
    }
  }, [session.hydrated, session.isAuthenticated, loadCounts]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Customer
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Hi, {name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Track your orders, manage saved shops, and update your profile.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/customer/saved" className="dm-card group flex flex-col gap-2 p-5 transition hover:-translate-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Following</p>
          <p className="font-display text-3xl font-semibold text-primary">
            {followed === null ? "—" : followed}
          </p>
          <p className="mt-auto text-xs font-semibold text-foreground/70 group-hover:text-foreground">
            View followed shops →
          </p>
        </Link>
        <Link href="/customer/saved" className="dm-card group flex flex-col gap-2 p-5 transition hover:-translate-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Liked shops</p>
          <p className="font-display text-3xl font-semibold" style={{ color: "#c17767" }}>
            {liked === null ? "—" : liked}
          </p>
          <p className="mt-auto text-xs font-semibold text-foreground/70 group-hover:text-foreground">
            View liked shops →
          </p>
        </Link>
        <Link href="/customer/orders" className="dm-card group flex flex-col gap-2 p-5 transition hover:-translate-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Orders</p>
          <p className="font-display text-3xl font-semibold text-foreground/80">—</p>
          <p className="mt-auto text-xs font-semibold text-foreground/70 group-hover:text-foreground">
            View orders →
          </p>
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickCard
          href="/customer/profile"
          title="My profile"
          description="Update your contact info and avatar."
        />
        <QuickCard
          href="/customer/saved"
          title="Saved shops"
          description="Shops you follow or liked — all in one place."
        />
        <QuickCard
          href="/shops"
          title="Discover shops"
          description="Browse the latest verified storefronts on Midora."
        />
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
