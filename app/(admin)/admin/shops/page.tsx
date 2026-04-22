"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiAdmin } from "@/lib/api";
import type { AdminShop, VerificationStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/base";
import { useRealtimeTable } from "@/lib/realtime/hooks";

type Toast = { kind: "ok" | "err"; text: string } | null;

type StatusFilter = "all" | "active" | "inactive";
type VerifyFilter = "all" | VerificationStatus;

function fmt(n?: number | null) {
  return new Intl.NumberFormat().format(Number(n ?? 0));
}

function ActiveSwitch({
  active,
  busy,
  onChange,
  label,
}: {
  active: boolean;
  busy: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={busy}
      onClick={() => onChange(!active)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:opacity-60",
        active ? "bg-emerald-500" : "bg-foreground/20",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform",
          active ? "translate-x-5" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

function VerifyBadge({ status }: { status?: VerificationStatus }) {
  const s: VerificationStatus = status ?? "unverified";
  const tone =
    s === "verified"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : s === "pending"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : s === "rejected"
          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
          : "bg-foreground/[0.06] text-foreground/70";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {s}
    </span>
  );
}

export default function AdminShopsPage() {
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>("all");
  const [toast, setToast] = useState<Toast>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAdmin.listShops();
      setShops(res.items ?? []);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load shops",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable(
    { table: "shops", channel: "admin-shops-list" },
    () => {
      void load();
    },
  );
  useRealtimeTable(
    { table: "shop_verifications", channel: "admin-shops-list-verif" },
    () => {
      void load();
    },
  );

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (!t) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, []);

  async function toggleActive(shop: AdminShop, next: boolean) {
    if (busyId) return;
    setBusyId(shop.id);
    setShops((s) =>
      s.map((x) => (x.id === shop.id ? { ...x, is_active: next } : x)),
    );
    try {
      const updated = await apiAdmin.setShopActive(shop.id, next);
      setShops((s) =>
        s.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
      );
      showToast({
        kind: "ok",
        text: next
          ? `${shop.name} is now active and visible to customers.`
          : `${shop.name} has been deactivated.`,
      });
    } catch (err) {
      setShops((s) =>
        s.map((x) => (x.id === shop.id ? { ...x, is_active: !next } : x)),
      );
      showToast({
        kind: "err",
        text: err instanceof Error ? err.message : "Failed to update shop",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function verifyAction(
    shop: AdminShop,
    action: "approve" | "reject" | "queue",
  ) {
    if (busyId) return;
    if (action === "reject") {
      const reason = window.prompt(
        `Reason for rejecting "${shop.name}":`,
        "",
      );
      if (!reason || !reason.trim()) {
        showToast({ kind: "err", text: "A reason is required to reject." });
        return;
      }
      setBusyId(shop.id);
      try {
        await apiAdmin.rejectVerification(shop.id, reason.trim());
        showToast({ kind: "ok", text: `${shop.name} rejected.` });
        await load();
      } catch (err) {
        showToast({
          kind: "err",
          text: err instanceof Error ? err.message : "Failed to reject",
        });
      } finally {
        setBusyId(null);
      }
      return;
    }
    setBusyId(shop.id);
    try {
      if (action === "approve") {
        await apiAdmin.approveVerification(shop.id);
        showToast({ kind: "ok", text: `${shop.name} verified.` });
      } else {
        await apiAdmin.queueVerification(shop.id);
        showToast({ kind: "ok", text: `${shop.name} queued for review.` });
      }
      await load();
    } catch (err) {
      showToast({
        kind: "err",
        text: err instanceof Error ? err.message : "Action failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shops.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.owner_email || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? !!s.is_active
            : !s.is_active;
      const matchesVerify =
        verifyFilter === "all"
          ? true
          : (s.verification_status || "unverified") === verifyFilter;
      return matchesQuery && matchesStatus && matchesVerify;
    });
  }, [shops, query, statusFilter, verifyFilter]);

  const counts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let verified = 0;
    let pending = 0;
    let rejected = 0;
    let unverified = 0;
    for (const s of shops) {
      if (s.is_active) active += 1;
      else inactive += 1;
      switch (s.verification_status) {
        case "verified":
          verified += 1;
          break;
        case "pending":
          pending += 1;
          break;
        case "rejected":
          rejected += 1;
          break;
        default:
          unverified += 1;
      }
    }
    return {
      total: shops.length,
      active,
      inactive,
      verified,
      pending,
      rejected,
      unverified,
    };
  }, [shops]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Admin · Shops
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            All shops
          </h1>
          <p className="mt-1 text-sm text-muted">
            {counts.total} total · {counts.active} active · {counts.verified}{" "}
            verified · {counts.pending} pending · {counts.unverified} not
            submitted · {counts.rejected} rejected
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, slug, or owner…"
            className="min-w-[12rem] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm sm:flex-none"
          />
          <button
            onClick={load}
            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-foreground/[0.04]"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex rounded-xl border border-border p-0.5 text-xs font-semibold">
          {(["all", "active", "inactive"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={[
                "rounded-lg px-2.5 py-1 capitalize transition-colors",
                statusFilter === k
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted hover:bg-foreground/[0.04]",
              ].join(" ")}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="inline-flex flex-wrap rounded-xl border border-border p-0.5 text-xs font-semibold">
          {(
            ["all", "verified", "pending", "unverified", "rejected"] as const
          ).map((k) => (
            <button
              key={k}
              onClick={() => setVerifyFilter(k)}
              className={[
                "rounded-lg px-2.5 py-1 capitalize transition-colors",
                verifyFilter === k
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted hover:bg-foreground/[0.04]",
              ].join(" ")}
            >
              {k === "all" ? "All verifications" : k}
            </button>
          ))}
        </div>
      </div>

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
        <div className="dm-card p-8 text-sm text-muted">Loading shops…</div>
      ) : visible.length === 0 ? (
        <div className="dm-card p-8 text-sm text-muted">No shops match.</div>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {visible.map((s) => {
            const busy = busyId === s.id;
            const active = !!s.is_active;
            const verifyStatus = s.verification_status || "unverified";
            return (
              <li
                key={s.id}
                className="dm-card flex flex-col gap-4 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold leading-tight">
                        {s.name}
                      </h3>
                      <VerifyBadge status={verifyStatus as VerificationStatus} />
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          active
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-foreground/[0.06] text-foreground/70",
                        ].join(" ")}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      /{s.slug}
                      {s.shop_type ? ` · ${s.shop_type}` : ""}
                    </p>
                    {s.owner_email ? (
                      <p className="mt-0.5 text-[11px] text-muted">
                        Owner: {s.owner_full_name || s.owner_email}
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={`/shops/${s.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-foreground/[0.04]"
                  >
                    View ↗
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-foreground/[0.03] p-3 text-xs">
                  <Stat label="Views" value={fmt(s.view_count)} />
                  <Stat label="Products" value={fmt(s.product_count)} />
                  <Stat
                    label="Submitted"
                    value={
                      s.verification_requested_at
                        ? new Date(s.verification_requested_at).toLocaleDateString()
                        : "—"
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Active
                    </span>
                    <ActiveSwitch
                      active={active}
                      busy={busy}
                      onChange={(next) => toggleActive(s, next)}
                      label={`${active ? "Deactivate" : "Activate"} ${s.name}`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {verifyStatus !== "verified" ? (
                      <button
                        disabled={busy}
                        onClick={() => verifyAction(s, "approve")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Verify
                      </button>
                    ) : null}
                    {verifyStatus === "unverified" ? (
                      <button
                        disabled={busy}
                        onClick={() => verifyAction(s, "queue")}
                        className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.04] disabled:opacity-60"
                      >
                        Queue review
                      </button>
                    ) : null}
                    {verifyStatus !== "rejected" ? (
                      <button
                        disabled={busy}
                        onClick={() => verifyAction(s, "reject")}
                        className="rounded-lg border border-rose-500/60 px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-500/10 disabled:opacity-60 dark:text-rose-300"
                      >
                        Reject
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  );
}
