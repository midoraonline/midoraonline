"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiAdmin } from "@/lib/api";
import type { AdminShop, VerificationStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/base";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import {
  BTN_SECONDARY,
  BTN_TEXT,
  EmptyState,
  ErrorState,
  LIST,
  PageHeader,
  StatusDot,
  UnderlineTabs,
  formatCount as fmt,
  relativeTime,
  useTabParam,
} from "@/components/dashboard/ui";

type StatusFilter = "all" | "active" | "inactive";
type VerifyFilter = "all" | VerificationStatus;


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
  const tone = s === "verified" ? "ok" : s === "pending" ? "warn" : s === "rejected" ? "bad" : "neutral";
  return (
    <StatusDot tone={tone}>
      <span className="capitalize">{s === "unverified" ? "Not submitted" : s}</span>
    </StatusDot>
  );
}


export default function AdminShopsClient({ initialShops }: { initialShops: AdminShop[] }) {
  const [shops, setShops] = useState<AdminShop[]>(initialShops);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verifyFilter, setVerifyFilter] = useTabParam(["all", "verified", "pending", "unverified", "rejected"] as const, "all");

  const load = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
    void load();
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
      toast.success(
        next
          ? `${shop.name} is now active and visible to customers.`
          : `${shop.name} has been deactivated.`,
      );
    } catch (err) {
      setShops((s) =>
        s.map((x) => (x.id === shop.id ? { ...x, is_active: !next } : x)),
      );
      toast.error(err instanceof Error ? err.message : "Failed to update shop");
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
        toast.error("A reason is required to reject.");
        return;
      }
      setBusyId(shop.id);
      try {
        await apiAdmin.rejectVerification(shop.id, reason.trim());
        toast.success(`${shop.name} rejected.`);
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to reject");
      } finally {
        setBusyId(null);
      }
      return;
    }
    setBusyId(shop.id);
    try {
      if (action === "approve") {
        await apiAdmin.approveVerification(shop.id);
        toast.success(`${shop.name} verified.`);
      } else {
        await apiAdmin.queueVerification(shop.id);
        toast.success(`${shop.name} queued for review.`);
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
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
    <div>
      <PageHeader
        title="Shops"
        description={`${fmt(counts.total)} shops, ${fmt(counts.active)} active, ${fmt(counts.pending)} waiting for verification.`}
        action={
          <button type="button" onClick={() => void load()} className={BTN_SECONDARY}>
            Refresh
          </button>
        }
      />

      <UnderlineTabs
        tabs={(["all", "verified", "pending", "unverified", "rejected"] as const).map((k) => ({
          value: k,
          label: k === "all" ? "All" : k === "unverified" ? "Not submitted" : k[0].toUpperCase() + k.slice(1),
        }))}
        value={verifyFilter}
        onChange={(k) => setVerifyFilter(k as VerifyFilter)}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, slug or owner"
          aria-label="Search shops"
          className="h-9 w-full max-w-xs rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Active status"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {visible.length === 0 ? (
        <EmptyState message="No shops match these filters." />
      ) : (
        <ul className={LIST}>
          {visible.map((s) => {
            const busy = busyId === s.id;
            const active = !!s.is_active;
            const verifyStatus = s.verification_status || "unverified";
            return (
              <li key={s.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <a
                      href={`/shops/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {s.name}
                    </a>
                    <VerifyBadge status={verifyStatus as VerificationStatus} />
                  </div>
                  <p className="mt-0.5 truncate text-xs tabular-nums text-muted">
                    {[
                      s.owner_full_name || s.owner_email,
                      s.shop_type,
                      `${fmt(s.product_count)} listings`,
                      `${fmt(s.view_count)} views`,
                      s.verification_requested_at ? `submitted ${relativeTime(s.verification_requested_at)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted">
                    Active
                    <ActiveSwitch
                      active={active}
                      busy={busy}
                      onChange={(next) => toggleActive(s, next)}
                      label={`${active ? "Deactivate" : "Activate"} ${s.name}`}
                    />
                  </label>
                  {verifyStatus !== "verified" ? (
                    <button disabled={busy} onClick={() => verifyAction(s, "approve")} className={BTN_SECONDARY}>
                      Verify
                    </button>
                  ) : null}
                  {verifyStatus === "unverified" ? (
                    <button disabled={busy} onClick={() => verifyAction(s, "queue")} className={BTN_TEXT}>
                      Queue review
                    </button>
                  ) : null}
                  {verifyStatus !== "rejected" ? (
                    <button
                      disabled={busy}
                      onClick={() => verifyAction(s, "reject")}
                      className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
                    >
                      Reject
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
