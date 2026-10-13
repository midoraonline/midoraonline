"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/state/session-store";
import { apiAuth } from "@/lib/api";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import UserAvatar from "@/components/UserAvatar";

// ── Logout confirmation modal ────────────────────────────────────────────────
function LogoutModal({
  open,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* backdrop */}
      <button
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-4">
          <p className="text-sm font-semibold">Sign out?</p>
          <p className="mt-1 text-sm text-muted">You&apos;ll need to sign in again to open your dashboard.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 flex-1 rounded-lg border border-border bg-surface px-3.5 shadow-xs text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-10 flex-1 rounded-lg bg-rose-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile dropdown ─────────────────────────────────────────────────────────
function ProfileDropdown({
  displayName,
  email,
  avatarUrl,
  settingsHref,
  onLogout,
}: {
  displayName: string;
  email: string | null;
  avatarUrl?: string | null;
  settingsHref: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-surface-muted"
      >
        <UserAvatar url={avatarUrl} name={displayName} size={32} />
        <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:block">
          {displayName}
        </span>
        <MaterialSymbol
          name="expand_more"
          className={`!text-sm text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg">
          {/* User info */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <UserAvatar url={avatarUrl} name={displayName} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              {email && <p className="truncate text-xs text-muted">{email}</p>}
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1">
            <button
              type="button"
              onClick={() => { setOpen(false); router.push(settingsHref); }}
              className="flex w-full items-center gap-2.5 min-h-10 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface-muted"
            >
              <MaterialSymbol name="settings" className="!text-base text-muted" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); router.push("/"); }}
              className="flex w-full items-center gap-2.5 min-h-10 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface-muted"
            >
              <MaterialSymbol name="storefront" className="!text-base text-muted" />
              Back to site
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex w-full items-center gap-2.5 min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <MaterialSymbol name="logout" className="!text-base" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main header ──────────────────────────────────────────────────────────────
export default function DashboardHeader({
  screenName,
  role,
}: {
  screenName: string;
  role: "admin" | "merchant" | "customer";
}) {
  const router = useRouter();
  const session = useAppSession();
  const [showLogout, setShowLogout] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const displayName =
    session.user?.full_name?.trim() || session.user?.email?.trim() || "Account";
  const email = session.user?.email ?? null;
  const avatarUrl = session.user?.avatar_url ?? null;

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      useSessionStore.getState().resetSession();
      await apiAuth.logout();
    } catch {
      /* ignore */
    } finally {
      notifyAuthChanged();
      setShowLogout(false);
      setLogoutLoading(false);
      router.replace("/");
    }
  }

  const settingsHref =
    role === "admin" ? "/admin/settings" : role === "customer" ? "/customer/settings" : "/merchant/settings";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface/75 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
            className="grid size-10 shrink-0 place-items-center rounded-lg text-foreground transition-colors hover:bg-surface-muted lg:hidden"
          >
            <MaterialSymbol name="menu" className="!text-xl" />
          </button>
          <p className="text-sm font-medium text-foreground">{screenName}</p>
        </div>

        <div className="flex items-center gap-1">
          <ProfileDropdown
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
            settingsHref={settingsHref}
            onLogout={() => setShowLogout(true)}
          />
        </div>
      </header>

      <LogoutModal
        open={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </>
  );
}
