"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiAuth } from "@/lib/api";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { useAppSession } from "@/lib/state";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  exact?: boolean;
  badge?: string | number | null;
};

export type DashboardRole = "admin" | "merchant" | "customer";

type Props = {
  role: DashboardRole;
  roleLabel: string;
  requiredRoles: DashboardRole[];
  navItems: DashboardNavItem[];
  secondaryNavItems?: DashboardNavItem[];
  returnHref?: string;
  returnLabel?: string;
  contentWidth?: "default" | "wide";
  children: React.ReactNode;
};

const ROLE_ACCENT: Record<
  DashboardRole,
  { active: string; pill: string; dot: string }
> = {
  admin: {
    active: "bg-rose-500/10 text-rose-600",
    pill: "bg-rose-500/10 text-rose-600",
    dot: "bg-rose-500",
  },
  merchant: {
    active: "bg-accent/10 text-accent",
    pill: "bg-accent/10 text-accent",
    dot: "bg-accent",
  },
  customer: {
    active: "bg-emerald-500/10 text-emerald-600",
    pill: "bg-emerald-500/10 text-emerald-600",
    dot: "bg-emerald-500",
  },
};

function isActivePath(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardShell({
  role,
  roleLabel,
  requiredRoles,
  navItems,
  secondaryNavItems,
  returnHref = "/",
  returnLabel = "Back to site",
  contentWidth = "default",
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const accent = ROLE_ACCENT[role];
  const userRole = session.user?.user_role ?? null;
  const allowed = !!userRole && requiredRoles.includes(userRole as DashboardRole);
  const stillResolving =
    !session.hydrated || (session.isAuthenticated && session.user === undefined);

  useEffect(() => {
    if (stillResolving) return;
    if (!session.isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [session.isAuthenticated, stillResolving, router, pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const displayName = useMemo(() => {
    const u = session.user;
    if (!u) return "";
    return u.full_name?.trim() || u.email?.trim() || `User ${u.id.slice(0, 6)}`;
  }, [session.user]);

  const initials = useMemo(() => {
    if (!displayName) return "";
    return displayName
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  async function handleLogout() {
    try {
      await apiAuth.logout();
    } catch {
      /* ignore; we clear locally anyway */
    } finally {
      notifyAuthChanged();
      router.replace("/");
    }
  }

  if (stillResolving) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="dm-skeleton h-4 w-40" />
          <p className="text-sm text-muted">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return null;
  }

  if (!allowed) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background p-6">
        <div className="dm-card max-w-md space-y-4 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-subtle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight">
            Access restricted
          </h1>
          <p className="text-sm text-muted">
            Your account role ({userRole || "unknown"}) can&apos;t open the {roleLabel.toLowerCase()} dashboard.
          </p>
          <Link
            href="/"
            className="dm-btn dm-btn-secondary inline-flex text-xs"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-surface/95 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="grid size-10 place-items-center rounded-xl bg-surface-subtle text-foreground/70 hover:bg-border"
          >
            <MenuIcon />
          </button>
          <Link href={returnHref} className="inline-block">
            <Image src="/logo.png" alt="Midora" width={100} height={34} className="h-7 w-auto rounded-md" />
          </Link>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${accent.pill}`}
        >
          {roleLabel}
        </span>
      </header>

      <div className="flex min-h-[calc(100dvh-3.25rem)] lg:min-h-[100dvh]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
          <SidebarContent
            accent={accent}
            navItems={navItems}
            secondaryNavItems={secondaryNavItems}
            pathname={pathname}
            displayName={displayName}
            initials={initials}
            email={session.user?.email || null}
            roleLabel={roleLabel}
            returnHref={returnHref}
            returnLabel={returnLabel}
            onLogout={handleLogout}
          />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <button
              aria-label="Close menu overlay"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            />
            <aside className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-surface px-4 py-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <Link href={returnHref} className="inline-block" onClick={() => setDrawerOpen(false)}>
                  <Image src="/logo.png" alt="Midora" width={100} height={34} className="h-7 w-auto rounded-md" />
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setDrawerOpen(false)}
                  className="grid size-9 place-items-center rounded-xl bg-surface-subtle text-foreground/70 hover:bg-border"
                >
                  <CloseIcon />
                </button>
              </div>
              <SidebarContent
                accent={accent}
                navItems={navItems}
                secondaryNavItems={secondaryNavItems}
                pathname={pathname}
                displayName={displayName}
                initials={initials}
                email={session.user?.email || null}
                roleLabel={roleLabel}
                returnHref={returnHref}
                returnLabel={returnLabel}
                onLogout={handleLogout}
              />
            </aside>
          </div>
        ) : null}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div
            className={[
              "w-full px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
              contentWidth === "wide" ? "" : "mx-auto max-w-6xl",
            ].join(" ")}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  accent,
  navItems,
  secondaryNavItems,
  pathname,
  displayName,
  initials,
  email,
  roleLabel,
  returnHref,
  returnLabel,
  onLogout,
}: {
  accent: { active: string; pill: string; dot: string };
  navItems: DashboardNavItem[];
  secondaryNavItems?: DashboardNavItem[];
  pathname: string;
  displayName: string;
  initials: string;
  email: string | null;
  roleLabel: string;
  returnHref: string;
  returnLabel: string;
  onLogout: () => void;
}) {
  return (
    <>
      <Link href={returnHref} className="mb-6 hidden px-2 lg:block">
        <Image src="/logo.png" alt="Midora" width={120} height={41} className="h-8 w-auto rounded-lg" />
      </Link>

      <nav aria-label="Dashboard" className="flex-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} accent={accent} />
        ))}

        {secondaryNavItems && secondaryNavItems.length > 0 ? (
          <>
            <div className="my-3 h-px bg-border" />
            {secondaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} accent={accent} />
            ))}
          </>
        ) : null}
      </nav>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-subtle text-xs font-bold text-foreground/60">
            {initials || "?"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName || "Signed in"}</p>
            {email ? <p className="truncate text-[11px] text-muted">{email}</p> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={returnHref}
            className="dm-btn dm-btn-secondary flex-1 text-xs"
          >
            {returnLabel}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="dm-btn dm-btn-ghost flex-1 text-xs"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

function NavLink({
  item,
  pathname,
  accent,
}: {
  item: DashboardNavItem;
  pathname: string;
  accent: { active: string; pill: string; dot: string };
}) {
  const active = isActivePath(pathname, item.href, item.exact);
  return (
    <Link
      href={item.href}
      className={[
        "group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors dm-focus",
        active
          ? `${accent.active}`
          : "text-foreground/65 hover:bg-surface-subtle hover:text-foreground",
      ].join(" ")}
    >
      {item.icon ? (
        <span className="grid size-5 shrink-0 place-items-center text-current">{item.icon}</span>
      ) : null}
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge !== "" ? (
        <span className="rounded-full bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold text-foreground/60">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="14" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
