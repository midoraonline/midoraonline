"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuth } from "@/lib/api";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";

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
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-500/10 text-rose-600">
            <MaterialSymbol name="logout" className="!text-lg" />
          </span>
          <div>
            <p className="text-sm font-semibold">Sign out?</p>
            <p className="text-xs text-muted">You'll need to sign back in to access your dashboard.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
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
  initials,
  onLogout,
}: {
  displayName: string;
  email: string | null;
  initials: string;
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
        className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-surface-subtle"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
          {initials || "?"}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
          {displayName}
        </span>
        <MaterialSymbol
          name="expand_more"
          className={`!text-sm text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
          {/* User info */}
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            {email && <p className="truncate text-xs text-muted">{email}</p>}
          </div>

          {/* Menu items */}
          <div className="p-1">
            <button
              type="button"
              onClick={() => { setOpen(false); router.push("/merchant/settings"); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-surface-subtle"
            >
              <MaterialSymbol name="settings" className="!text-base text-muted" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); router.push("/"); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-surface-subtle"
            >
              <MaterialSymbol name="storefront" className="!text-base text-muted" />
              Back to site
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
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
  onMenuClick,
}: {
  screenName: string;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const session = useAppSession();
  const [showLogout, setShowLogout] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const displayName =
    session.user?.full_name?.trim() || session.user?.email?.trim() || "Account";
  const email = session.user?.email ?? null;
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    setLogoutLoading(true);
    try {
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

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-xl sm:px-6">
        {/* Left: hamburger (mobile) + screen name */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              aria-label="Open menu"
              onClick={onMenuClick}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-foreground/70 transition-colors hover:bg-surface-subtle lg:hidden"
            >
              <MaterialSymbol name="menu" className="!text-xl" />
            </button>
          )}
          <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {screenName}
          </h1>
        </div>

        {/* Right: notifications + profile */}
        <div className="flex items-center gap-1">
          {/* Notification bell — placeholder */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-xl text-foreground/70 transition-colors hover:bg-surface-subtle"
          >
            <MaterialSymbol name="notifications" className="!text-xl" />
            {/* Uncomment when real notifications exist:
            <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />
            */}
          </button>

          <ProfileDropdown
            displayName={displayName}
            email={email}
            initials={initials}
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
