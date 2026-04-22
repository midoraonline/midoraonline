"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiAdmin } from "@/lib/api";
import type {
  AdminVerification,
  VerificationStatus,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/base";
import { useRealtimeTable } from "@/lib/realtime/hooks";

type TabKey = "all" | "pending" | "verified" | "rejected" | "unverified";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "unverified", label: "Not submitted" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const STATUS_BADGE: Record<VerificationStatus, string> = {
  unverified: "bg-foreground/[0.06] text-foreground/70",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  verified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

type Toast = { kind: "ok" | "err"; text: string } | null;

export default function AdminVerificationsPage() {
  const [tab, setTab] = useState<TabKey>("pending");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyShopId, setBusyShopId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (!t) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, []);

  const load = useCallback(
    async (isInitial: boolean) => {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        // Always ask for a broad set so the tabs filter client-side without
        // extra round-trips, and fold in unverified shops so admins can
        // verify shops that were never submitted.
        const res = await apiAdmin.listVerifications({
          status: "all",
          limit: 500,
          includeUnverified: true,
        });
        setItems(res.items ?? []);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load verifications",
        );
      } finally {
        if (isInitial) setLoading(false);
        else setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  useRealtimeTable(
    { table: "shop_verifications", channel: "admin-shop-verifications" },
    () => void load(false),
  );
  useRealtimeTable(
    { table: "shops", channel: "admin-verifications-shops" },
    () => void load(false),
  );

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      all: items.length,
      pending: 0,
      unverified: 0,
      verified: 0,
      rejected: 0,
    };
    for (const v of items) {
      c[v.status] = (c[v.status] ?? 0) + 1;
    }
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((v) => {
      if (tab !== "all" && v.status !== tab) return false;
      if (!q) return true;
      const name = (v.shops?.name || "").toLowerCase();
      const slug = (v.shops?.slug || "").toLowerCase();
      const email = (v.shops?.shop_email || "").toLowerCase();
      return (
        name.includes(q) ||
        slug.includes(q) ||
        email.includes(q) ||
        v.shop_id.toLowerCase().includes(q)
      );
    });
  }, [items, tab, query]);

  async function runAction(
    shopId: string,
    action: "approve" | "reject" | "queue",
    successMsg: string,
  ) {
    setBusyShopId(shopId);
    try {
      const notes = noteDraft[shopId]?.trim() || undefined;
      if (action === "reject" && !notes) {
        showToast({ kind: "err", text: "Please add a short reason before rejecting." });
        return;
      }
      if (action === "approve") {
        await apiAdmin.approveVerification(shopId, notes);
      } else if (action === "reject") {
        await apiAdmin.rejectVerification(shopId, notes);
      } else {
        await apiAdmin.queueVerification(shopId, notes);
      }
      setNoteDraft((s) => ({ ...s, [shopId]: "" }));
      showToast({ kind: "ok", text: successMsg });
      await load(false);
    } catch (err) {
      showToast({
        kind: "err",
        text: err instanceof Error ? err.message : "Action failed",
      });
    } finally {
      setBusyShopId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Admin · Verifications
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Shop verification console
          </h1>
          <p className="mt-1 text-sm text-muted">
            Review every shop on the platform — approve, reject, or queue an
            unsubmitted shop for review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shop, slug, or email…"
            className="min-w-[10rem] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm sm:flex-none"
          />
          <button
            onClick={() => load(false)}
            disabled={refreshing}
            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-foreground/[0.04] disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <nav className="-mx-1 flex flex-wrap gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background hover:bg-foreground/[0.04]",
              ].join(" ")}
            >
              <span>{t.label}</span>
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-foreground/[0.08] text-foreground/70",
                ].join(" ")}
              >
                {counts[t.key] ?? 0}
              </span>
            </button>
          );
        })}
      </nav>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          className={[
            "rounded-xl border p-3 text-sm",
            toast.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
          ].join(" ")}
        >
          {toast.text}
        </div>
      ) : null}

      {loading ? (
        <div className="dm-card p-8 text-sm text-muted">Loading verifications…</div>
      ) : visible.length === 0 ? (
        <div className="dm-card p-8 text-sm text-muted">
          No shops match this filter.
        </div>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {visible.map((v) => {
            const shopName = v.shops?.name || v.shop_id;
            const slug = v.shops?.slug || null;
            const isBusy = busyShopId === v.shop_id;
            const canApprove = v.status !== "verified";
            const canReject = v.status !== "rejected";
            const canQueue = v.status === "unverified";
            return (
              <li
                key={v.id || v.shop_id}
                className="dm-card space-y-4 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold truncate">
                        {shopName}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          STATUS_BADGE[v.status] || STATUS_BADGE.unverified
                        }`}
                      >
                        {v.status}
                      </span>
                      {v.shops?.is_active ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {slug ? `/${slug} · ` : ""}
                      <code className="font-mono">{v.shop_id.slice(0, 8)}…</code>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {v.shops?.shop_email ? `Contact: ${v.shops.shop_email}` : null}
                      {v.requested_at
                        ? ` · requested ${formatDate(v.requested_at)}`
                        : ""}
                      {v.reviewed_at
                        ? ` · reviewed ${formatDate(v.reviewed_at)}`
                        : ""}
                    </p>
                  </div>
                  {slug ? (
                    <a
                      href={`/shops/${slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-foreground/[0.04]"
                    >
                      View ↗
                    </a>
                  ) : null}
                </div>

                {v.notes ? (
                  <p className="rounded-lg border border-border bg-foreground/[0.03] p-3 text-xs text-muted">
                    <strong className="font-semibold text-foreground/80">
                      Latest notes:
                    </strong>{" "}
                    {v.notes}
                  </p>
                ) : null}

                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Notes{" "}
                    <span className="font-normal normal-case text-muted/70">
                      (required to reject)
                    </span>
                  </span>
                  <textarea
                    value={noteDraft[v.shop_id] ?? ""}
                    onChange={(e) =>
                      setNoteDraft((s) => ({ ...s, [v.shop_id]: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-xl border border-border bg-background p-2 text-sm"
                    placeholder="Share context with the merchant…"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={isBusy || !canApprove}
                    onClick={() =>
                      runAction(v.shop_id, "approve", `${shopName} is now verified.`)
                    }
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isBusy ? "Working…" : v.status === "verified" ? "Verified" : "Approve"}
                  </button>
                  <button
                    disabled={isBusy || !canReject}
                    onClick={() =>
                      runAction(v.shop_id, "reject", `${shopName} has been rejected.`)
                    }
                    className="rounded-xl border border-rose-500/60 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-300"
                  >
                    Reject
                  </button>
                  {canQueue ? (
                    <button
                      disabled={isBusy}
                      onClick={() =>
                        runAction(
                          v.shop_id,
                          "queue",
                          `${shopName} queued for review.`,
                        )
                      }
                      className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-foreground/[0.04] disabled:opacity-50"
                    >
                      Queue for review
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
