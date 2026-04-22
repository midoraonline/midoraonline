"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { useAppSession } from "@/lib/state";

export default function MerchantOverviewPage() {
  const session = useAppSession();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiShops.myShops();
      setShops(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your shops");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable(
    { table: "shops", channel: "merchant-shops-overview" },
    () => {
      void load();
    },
  );

  const displayName = session.user?.full_name?.trim() || session.user?.email?.trim() || "there";
  const active = shops.filter((s) => s.is_active).length;
  const pendingVerification = shops.filter((s) => !s.is_active).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Merchant
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {displayName}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Manage your shops, track performance, and keep your catalog fresh.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total shops" value={loading ? "—" : shops.length} />
        <StatCard label="Active" value={loading ? "—" : active} tone="emerald" />
        <StatCard
          label="Awaiting / inactive"
          value={loading ? "—" : pendingVerification}
          tone="amber"
        />
      </section>

      <section className="dm-card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Your shops</h2>
          <Link
            href="/merchant/new"
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95"
          >
            + New shop
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted">Loading your shops…</p>
        ) : shops.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted">
              You haven&apos;t opened a shop yet.
            </p>
            <Link
              href="/merchant/new"
              className="dm-pill dm-focus mt-4 inline-flex bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
            >
              Open your first shop
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {shops.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/merchant/shops/${s.id}`}
                  className="dm-card group flex h-full flex-col gap-2 p-4 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.name}</p>
                      <p className="truncate text-xs text-muted">/{s.slug}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        s.is_active
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-auto text-[11px] text-muted">
                    <span className="mr-2">👥 {s.follower_count ?? 0}</span>
                    <span className="mr-2">❤ {s.like_count ?? 0}</span>
                    <span>👁 {s.view_count ?? 0}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
      ? "text-amber-700 dark:text-amber-300"
      : "text-foreground";
  return (
    <div className="dm-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
