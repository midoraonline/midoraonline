"use client";

import { useCallback, useEffect, useState } from "react";

import { apiAdmin } from "@/lib/api";
import type { AdminSubscription } from "@/lib/api/admin";

export default function AdminSubscriptionsPage() {
  const [items, setItems] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAdmin.listSubscriptions();
      setItems(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Admin · Subscriptions
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Pesapal subscriptions
          </h1>
        </div>
        <button
          onClick={load}
          className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-foreground/[0.04]"
        >
          Refresh
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="dm-card p-8 text-sm text-muted">Loading subscriptions…</div>
      ) : items.length === 0 ? (
        <div className="dm-card p-8 text-sm text-muted">No subscriptions yet.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="dm-card flex flex-wrap items-center justify-between gap-2 p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">#{s.id.slice(0, 8)}…</p>
                <p className="truncate text-xs text-muted">
                  Shop: {s.shop_id ? s.shop_id.slice(0, 8) + "…" : "—"}
                </p>
              </div>
              <span className="rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                {s.status || "unknown"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
