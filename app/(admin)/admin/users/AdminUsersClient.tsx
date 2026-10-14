"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Loader2, Search, Users, X } from "lucide-react";
import { toast } from "sonner";

import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Badge,
  BTN_SECONDARY,
  EmptyState,
  ErrorState,
  FilterBar,
  LIST,
  PageHeader,
  Pagination,
  PageSkeleton,
  ROW,
  Select,
  relativeTime,
  type StatusTone,
} from "@/components/dashboard/ui";
import { apiAdmin } from "@/lib/api";
import type { AdminUserRole, AdminUserStatus } from "@/lib/api/admin";
import { useAppSession } from "@/lib/state";

type RoleFilter = "" | AdminUserRole;
type VerifiedFilter = "" | "email" | "phone" | "unverified";
type StatusFilter = "" | AdminUserStatus;

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "customer", label: "Customer" },
  { value: "merchant", label: "Merchant" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
] as const;
const VERIFIED_OPTIONS = [
  { value: "", label: "Any" },
  { value: "email", label: "Email verified" },
  { value: "phone", label: "Phone verified" },
  { value: "unverified", label: "Unverified" },
] as const;
const STATUS_OPTIONS = [
  { value: "", label: "Active & suspended" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "blocked", label: "Blocked" },
  { value: "deleted", label: "Deleted" },
] as const;

const STATUS_TONE: Record<AdminUserStatus, StatusTone> = {
  active: "ok",
  suspended: "warn",
  blocked: "bad",
  deleted: "neutral",
};

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

function errText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function AdminUsersClient() {
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim());
  const [role, setRole] = useState<RoleFilter>("");
  const [verified, setVerified] = useState<VerifiedFilter>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const key = ["admin-users", q, role, verified, status, page] as const;
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    apiAdmin.listUsers({ q, role, verified, status, page, limit: 25 }),
  );

  function filter<T>(set: (v: T) => void) {
    return (v: T) => {
      set(v);
      setPage(1);
    };
  }

  return (
    <div>
      <PageHeader title="Users" description="Find accounts, check verification, change roles, suspend or delete." />
      <FilterBar>
        <div className="flex min-w-0 flex-col gap-1.5 sm:w-72">
          <label htmlFor="user-search" className="text-xs font-semibold text-foreground">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="user-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Name, email or phone"
              className="h-10 w-full rounded-lg border border-border-input bg-surface pl-9 pr-3 text-sm text-foreground shadow-xs focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/25"
            />
          </div>
        </div>
        <Select label="Role" value={role} onChange={filter(setRole)} options={ROLE_OPTIONS} />
        <Select label="Verified" value={verified} onChange={filter(setVerified)} options={VERIFIED_OPTIONS} />
        <Select label="Status" value={status} onChange={filter(setStatus)} options={STATUS_OPTIONS} />
      </FilterBar>

      {error ? <ErrorState message="Couldn't load users." onRetry={() => void mutate()} /> : null}
      {isLoading && !data ? (
        <PageSkeleton rows={8} label="Loading users" />
      ) : data && data.items.length === 0 ? (
        <EmptyState icon={Users} title="No users found" message="Try a different search or clear the filters." />
      ) : data ? (
        <>
          <ul className={LIST}>
            {data.items.map((u) => (
              <li key={u.id}>
                <button type="button" onClick={() => setOpenId(u.id)} className={`${ROW} w-full text-left`}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                    {(u.full_name || u.email || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{u.full_name || "No name"}</span>
                    <span className="block truncate text-xs text-muted">{u.email}</span>
                  </span>
                  <span className="hidden text-xs capitalize text-muted sm:inline">{u.user_role}</span>
                  <span className="hidden text-xs text-muted md:inline">
                    {u.email_verified ? "Email ✓" : "Email ✗"} · {u.phone_verified ? "Phone ✓" : "Phone ✗"}
                  </span>
                  <Badge tone={STATUS_TONE[u.status] ?? "neutral"}>{u.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">{data.total} users</p>
          <Pagination page={page} totalPages={data.total_pages} onChange={setPage} />
        </>
      ) : null}

      {openId ? (
        <UserDrawer
          userId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => void mutate()}
        />
      ) : null}
    </div>
  );
}

function UserDrawer({ userId, onClose, onChanged }: { userId: string; onClose: () => void; onChanged: () => void }) {
  const me = useAppSession().user;
  const { data, error, mutate } = useSWR(["admin-user", userId], () => apiAdmin.getUser(userId));
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"delete" | "suspend" | null>(null);
  const isSelf = me?.id === userId;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function run(label: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(label);
    try {
      await fn();
      toast.success(ok);
      await mutate();
      onChanged();
    } catch (err) {
      toast.error(errText(err, "That didn't work. Try again."));
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  const user = data?.user;
  const deleted = user?.status === "deleted";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="User details">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose()} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">User details</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground">
            <X className="size-4" />
          </button>
        </header>
        {error ? (
          <div className="p-5">
            <ErrorState message="Couldn't load this user." onRetry={() => void mutate()} />
          </div>
        ) : !data || !user ? (
          <div className="flex flex-1 items-center justify-center text-muted">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : (
          <div className="space-y-6 p-5 text-sm">
            <section className="space-y-1">
              <p className="text-lg font-semibold text-foreground">{user.full_name || "No name"}</p>
              <p className="text-muted">{user.email}</p>
              {user.phone_number ? <p className="text-muted">{user.phone_number}</p> : null}
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge tone={STATUS_TONE[user.status] ?? "neutral"}>{user.status}</Badge>
                <Badge tone="neutral">{user.user_role}</Badge>
              </div>
              <p className="pt-1 text-xs text-muted">
                Joined {relativeTime(user.created_at)}
                {user.last_seen_at ? ` · last seen ${relativeTime(user.last_seen_at)}` : ""}
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Verification</h3>
              <ul className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["Email", data.verification.email],
                    ["Phone", data.verification.phone],
                    ["Identity", data.verification.identity],
                    ["Business", data.verification.business],
                  ] as const
                ).map(([label, ok]) => (
                  <li key={label} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span>{label}</span>
                    <Badge tone={ok ? "ok" : "neutral"}>{ok ? "Verified" : "No"}</Badge>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Businesses · {data.listings_count} ads
              </h3>
              {data.shops.length === 0 ? (
                <p className="text-muted">No businesses.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.shops.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2">
                      <a href={`/shops/${s.slug}`} target="_blank" rel="noreferrer" className="truncate text-accent hover:underline">
                        {s.name}
                      </a>
                      {s.is_active === false ? <Badge tone="warn">Inactive</Badge> : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {!deleted ? (
              <section className="space-y-3 border-t border-border pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Actions</h3>
                {isSelf ? <p className="text-xs text-muted">You can&apos;t change your own role or status here.</p> : null}
                <Select
                  label="Role"
                  value={user.user_role}
                  onChange={(r) => void run("role", () => apiAdmin.setUserRole(userId, r), `Role changed to ${r}.`)}
                  options={ROLE_OPTIONS.filter((o) => o.value !== "") as { value: AdminUserRole; label: string }[]}
                />
                <div className="flex flex-wrap gap-2">
                  {user.status === "suspended" ? (
                    <button
                      type="button"
                      disabled={isSelf || !!busy}
                      onClick={() => void run("status", () => apiAdmin.setUserStatus(userId, "active"), "User unsuspended.")}
                      className={BTN_SECONDARY}
                    >
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSelf || !!busy}
                      onClick={() => setConfirm("suspend")}
                      className={BTN_SECONDARY}
                    >
                      Suspend
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSelf || !!busy}
                    onClick={() => setConfirm("delete")}
                    className={`${BTN_SECONDARY} text-[color:var(--error)]`}
                  >
                    Delete user
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        )}
      </aside>
      {confirm === "suspend" ? (
        <ConfirmDialog
          title="Suspend this user?"
          message="They'll be signed out and can't sign in until you unsuspend them."
          confirmLabel="Suspend"
          destructive
          busy={busy === "status"}
          onClose={() => setConfirm(null)}
          onConfirm={() => void run("status", () => apiAdmin.setUserStatus(userId, "suspended"), "User suspended.")}
        />
      ) : null}
      {confirm === "delete" ? (
        <ConfirmDialog
          title="Delete this user?"
          message="Their profile, businesses, ads and photos will be deleted. This can't be undone."
          confirmLabel="Delete user"
          destructive
          busy={busy === "delete"}
          onClose={() => setConfirm(null)}
          onConfirm={() =>
            void run(
              "delete",
              async () => {
                await apiAdmin.deleteUser(userId);
                onClose();
              },
              "User deleted.",
            )
          }
        />
      ) : null}
    </div>
  );
}
