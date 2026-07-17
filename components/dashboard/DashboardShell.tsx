"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAppSession } from "@/lib/state";
import DashboardHeader from "./DashboardHeader";

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

const ROLE_ACCENT: Record<DashboardRole, { active: string; pill: string }> = {
  admin:    { active: "bg-rose-500/10 text-rose-600",    pill: "bg-rose-500/10 text-rose-600"    },
  merchant: { active: "bg-accent/10 text-accent",        pill: "bg-accent/10 text-accent"        },
  customer: { active: "bg-emerald-500/10 text-emerald-600", pill: "bg-emerald-500/10 text-emerald-600" },
};

// Map route → screen name shown in the header
const SCREEN_NAMES: Record<string, string> = {
  "/merchant":               "Overview",
  "/merchant/shops":         "My Shops",
  "/merchant/conversations": "Conversations",
  "/merchant/leads":         "Leads",
  "/merchant/orders":        "Orders",
  "/merchant/new":           "Open a Shop",
  "/merchant/settings":      "Settings",
  // customer
  "/customer":               "Overview",
  "/customer/profile":       "My Profile",
  "/customer/orders":        "My Orders",
  "/customer/saved":         "Saved Shops",
  "/customer/wishlist":      "Wishlist",
  "/customer/settings":      "Settings",
};

function resolveScreenName(pathname: string): string {
  if (SCREEN_NAMES[pathname]) return SCREEN_NAMES[pathname];
  // merchant shop sub-pages
  if (pathname.includes("/analytics"))    return "Analytics";
  if (pathname.includes("/catalog"))      return "Catalog";
  if (pathname.startsWith("/merchant/shops/") && pathname.includes("/settings")) return "Shop Settings";
  if (pathname.includes("/verification")) return "Verification";
  if (pathname.startsWith("/merchant/shops/")) return "Shop Dashboard";
  return "Dashboard";
}

function isActivePath(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  accent,
  onClick,
}: {
  item: DashboardNavItem;
  pathname: string;
  accent: { active: string };
  onClick?: () => void;
}) {
  const active = isActivePath(pathname, item.href, item.exact);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={[
        "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? accent.active
          : "text-foreground/60 hover:bg-surface-subtle hover:text-foreground",
      ].join(" ")}
    >
      {item.icon && (
        <span className="grid size-5 shrink-0 place-items-center text-current">
          {item.icon}
        </span>
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge !== "" && (
        <span className="rounded-full bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold text-foreground/60">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function Sidebar({
  navItems,
  secondaryNavItems,
  pathname,
  accent,
  roleLabel,
  returnHref,
  returnLabel,
  onItemClick,
}: {
  navItems: DashboardNavItem[];
  secondaryNavItems?: DashboardNavItem[];
  pathname: string;
  accent: { active: string; pill: string };
  roleLabel: string;
  returnHref: string;
  returnLabel: string;
  onItemClick?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo + role badge */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Midora" className="h-7 w-auto rounded-lg" />
        </Link>
        <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${accent.pill}`}>
          {roleLabel}
        </span>
      </div>

      <div className="mx-3 mb-4 h-px bg-border" />

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} accent={accent} onClick={onItemClick} />
        ))}

        {secondaryNavItems && secondaryNavItems.length > 0 && (
          <>
            <div className="my-3 h-px bg-border" />
            {secondaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} accent={accent} onClick={onItemClick} />
            ))}
          </>
        )}
      </nav>

      {/* Back to site */}
      <div className="mx-3 mt-2 border-t border-border py-3">
        <Link
          href={returnHref}
          onClick={onItemClick}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {returnLabel}
        </Link>
      </div>
    </div>
  );
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

  const screenName = useMemo(() => resolveScreenName(pathname), [pathname]);

  useEffect(() => {
    if (stillResolving) return;
    if (!session.isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [session.isAuthenticated, stillResolving, router, pathname]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

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

  if (!session.isAuthenticated) return null;

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
          <h1 className="font-display text-xl font-semibold tracking-tight">Access restricted</h1>
          <p className="text-sm text-muted">
            Your account role ({userRole || "unknown"}) can&apos;t open the{" "}
            {roleLabel.toLowerCase()} dashboard.
          </p>
          <Link href="/" className="dm-btn dm-btn-secondary inline-flex text-xs">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Desktop layout */}
      <div className="flex min-h-[100dvh]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <Sidebar
            navItems={navItems}
            secondaryNavItems={secondaryNavItems}
            pathname={pathname}
            accent={accent}
            roleLabel={roleLabel}
            returnHref={returnHref}
            returnLabel={returnLabel}
          />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <button
              aria-label="Close menu overlay"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            />
            <aside className="absolute inset-y-0 left-0 flex w-[75%] max-w-xs flex-col border-r border-border bg-surface shadow-2xl">
              <Sidebar
                navItems={navItems}
                secondaryNavItems={secondaryNavItems}
                pathname={pathname}
                accent={accent}
                roleLabel={roleLabel}
                returnHref={returnHref}
                returnLabel={returnLabel}
                onItemClick={() => setDrawerOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Main content column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            screenName={screenName}
            onMenuClick={() => setDrawerOpen(true)}
          />
          <main className="flex-1 overflow-x-hidden">
            <div
              className={[
                "w-full px-3 py-5 sm:px-4 sm:py-6 lg:px-6 lg:py-7",
                contentWidth === "wide" ? "" : "mx-auto max-w-6xl",
              ].join(" ")}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
