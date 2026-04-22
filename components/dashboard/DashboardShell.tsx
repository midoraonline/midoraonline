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
  /** Accent color used for active nav states + role pill. */
  role: DashboardRole;
  /** Short label shown next to the logo (e.g. "Admin", "Merchant"). */
  roleLabel: string;
  /** Required role(s) to access — redirects if user doesn't match. */
  requiredRoles: DashboardRole[];
  /** Primary nav items (top of sidebar). */
  navItems: DashboardNavItem[];
  /** Optional secondary nav (below a divider). */
  secondaryNavItems?: DashboardNavItem[];
  /** Back-to-site link (where the nav goes when the user wants to exit). */
  returnHref?: string;
  returnLabel?: string;
  /** Content width preset. `"wide"` removes the default max-w-6xl cap so
   * analytics grids and charts can use the full viewport.
   */
  contentWidth?: "default" | "wide";
  children: React.ReactNode;
};

const ROLE_ACCENT: Record<
  DashboardRole,
  { active: string; pill: string; dot: string }
> = {
  admin: {
    active: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    pill: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  merchant: {
    active: "bg-primary/15 text-primary",
    pill: "bg-primary/15 text-primary",
    dot: "bg-primary",
  },
  customer: {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    pill: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
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
        <p className="text-sm text-muted">Loading your dashboard…</p>
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return null;
  }

  if (!allowed) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background p-6">
        <div className="dm-card max-w-md space-y-3 p-6 text-center">
          <h1 className="font-display text-xl font-semibold tracking-tight">
            Access restricted
          </h1>
          <p className="text-sm text-muted">
            Your account role ({userRole || "unknown"}) can&apos;t open the {roleLabel.toLowerCase()} dashboard.
          </p>
          <Link
            href="/"
            className="dm-pill dm-focus inline-flex bg-foreground/[0.07] px-4 py-2 text-xs font-semibold hover:bg-foreground/[0.1]"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/85 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="grid size-10 place-items-center rounded-full bg-foreground/[0.07] text-foreground/80 hover:bg-foreground/[0.11]"
          >
            <MenuIcon />
          </button>
          <Link href={returnHref} className="inline-flex items-center gap-2">
            <Image src="/logo.png" alt="Midora" width={28} height={28} className="size-7 rounded-md" />
            <span className="text-sm font-semibold">{roleLabel}</span>
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
        <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-border bg-background/60 px-4 py-5 backdrop-blur-xl lg:flex">
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
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            />
            <aside className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-background px-4 py-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <Link href={returnHref} className="inline-flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
                  <Image src="/logo.png" alt="Midora" width={28} height={28} className="size-7 rounded-md" />
                  <span className="text-sm font-semibold">Midora</span>
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setDrawerOpen(false)}
                  className="grid size-9 place-items-center rounded-full bg-foreground/[0.07] text-foreground/80 hover:bg-foreground/[0.11]"
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

        {/* Content */}
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
      <Link href={returnHref} className="mb-6 hidden items-center gap-2 px-2 lg:flex">
        <Image src="/logo.png" alt="Midora" width={32} height={32} className="size-8 rounded-lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">Midora</p>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            <span className={`inline-block size-1.5 rounded-full ${accent.dot}`} />
            {roleLabel}
          </p>
        </div>
      </Link>

      <nav aria-label="Dashboard" className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} accent={accent} />
        ))}

        {secondaryNavItems && secondaryNavItems.length > 0 ? (
          <>
            <div className="my-4 h-px bg-border" />
            {secondaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} accent={accent} />
            ))}
          </>
        ) : null}
      </nav>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.08] text-xs font-bold text-foreground/70">
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
            className="flex-1 rounded-xl border border-border px-3 py-2 text-center text-xs font-semibold hover:bg-foreground/[0.04]"
          >
            {returnLabel}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 rounded-xl bg-foreground/[0.07] px-3 py-2 text-xs font-semibold text-foreground hover:bg-foreground/[0.1]"
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
        "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors dm-focus",
        active
          ? `${accent.active} shadow-sm`
          : "text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground",
      ].join(" ")}
    >
      {item.icon ? (
        <span className="grid size-5 shrink-0 place-items-center text-current">{item.icon}</span>
      ) : null}
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge !== "" ? (
        <span className="rounded-full bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-foreground/70">
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
