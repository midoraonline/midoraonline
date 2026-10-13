"use client";

import { useCallback, useEffect, useState } from "react";

import { apiAdmin } from "@/lib/api";
import type { AdminSubscription } from "@/lib/api/admin";
import { BTN_SECONDARY, EmptyState, ErrorState, LIST, PageHeader, StatusDot, formatCount as fmt } from "@/components/dashboard/ui";

type Props = { initialItems: AdminSubscription[] };

export default function AdminSubscriptionsClient({ initialItems }: Props) {
  const [items, setItems] = useState<AdminSubscription[]>(initialItems);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiAdmin.listSubscriptions();
      setItems(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscriptions");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description={`${fmt(items.length)} Pesapal subscriptions.`}
        action={
          <button type="button" onClick={() => void load()} className={BTN_SECONDARY}>
            Refresh
          </button>
        }
      />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {items.length === 0 ? (
        <EmptyState message="No subscriptions yet." />
      ) : (
        <ul className={LIST}>
          {items.map((s) => {
            const st = (s.status || "unknown").toLowerCase();
            return (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold tabular-nums">#{s.id.slice(0, 8)}</span>
                  <span className="block truncate text-xs text-muted">
                    Shop {s.shop_id ? s.shop_id.slice(0, 8) : "none"}
                  </span>
                </span>
                <StatusDot tone={st === "active" || st === "completed" ? "ok" : st === "failed" ? "bad" : "neutral"}>
                  <span className="capitalize">{st}</span>
                </StatusDot>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
