"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { useAppSession } from "@/lib/state";
import DashboardHeader from "./DashboardHeader";
import DashboardFooter from "./DashboardFooter";
import { BTN_SECONDARY } from "./ui";
import { X } from "lucide-react";

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

// Map route → screen name shown in the header
const SCREEN_NAMES: Record<string, string> = {
  "/merchant":               "Overview",
  "/merchant/listings":      "My Listings",
  "/merchant/shops":         "My Shops",
  "/merchant/conversations": "Conversations",
  "/merchant/leads":         "Leads",
  "/merchant/billing":       "Billing & Plans",
  "/merchant/settings":      "Settings",
  // customer
  "/customer":               "Overview",
  "/customer/profile":       "My Profile",
  "/customer/saved":         "Saved Shops",
  "/customer/wishlist":      "Wishlist",
  "/customer/settings":      "Settings",
  // admin
  "/admin":                  "Platform overview",
  "/admin/verifications":    "Verifications",
  "/admin/shops":            "All shops",
  "/admin/reports":          "Product reports",
  "/admin/listings":         "Listings review",
  "/admin/comments":         "Comments moderation",
  "/admin/feed-config":      "Feed scoring & placement",
  "/admin/categories":       "Categories",
  "/admin/chat":             "Chat monitoring",
  "/admin/subscriptions":    "Pesapal subscriptions",
  "/admin/feedback":         "Platform feedback",
  "/admin/settings":         "Settings",
  "/admin/features":         "Features",
};

function resolveScreenName(pathname: string): string {
  if (SCREEN_NAMES[pathname]) return SCREEN_NAMES[pathname];
  // merchant shop sub-pages
  if (pathname.includes("/analytics"))    return "Analytics";
  if (pathname.includes("/catalog"))      return "Catalog";
  if (pathname.startsWith("/merchant/listings/") && pathname.endsWith("/edit")) {
    return "Edit listing";
  }
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
  onClick,
}: {
  item: DashboardNavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const active = isActivePath(pathname, item.href, item.exact);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-surface-subtle text-foreground"
          : "text-muted hover:bg-surface-subtle hover:text-foreground",
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
  roleLabel,
  onItemClick,
  onClose,
}: {
  navItems: DashboardNavItem[];
  secondaryNavItems?: DashboardNavItem[];
  pathname: string;
  roleLabel: string;
  onItemClick?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo + role badge */}
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo alt="Midora" width={100} height={28} className="h-7 w-auto rounded-lg" />
        </Link>
        <span className="ml-auto truncate text-xs text-muted">{roleLabel}</span>
        {onClose ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-md text-foreground hover:bg-surface-subtle"
          >
            <X className="size-5" strokeWidth={2.25} />
          </button>
        ) : null}
      </div>

      <div className="mx-3 mb-4 h-px bg-border" />

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onClick={onItemClick} />
        ))}

        {secondaryNavItems && secondaryNavItems.length > 0 && (
          <>
            <div className="my-3 h-px bg-border" />
            {secondaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={onItemClick} />
            ))}
          </>
        )}
      </nav>
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
  contentWidth = "wide",
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    function onToggle() {
      setDrawerOpen((open) => !open);
    }
    window.addEventListener("toggle-sidebar", onToggle);
    return () => window.removeEventListener("toggle-sidebar", onToggle);
  }, []);

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
        <div className="max-w-md space-y-3 rounded-lg border border-border p-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Access restricted</h1>
          <p className="text-sm text-muted">
            Your account role ({userRole || "unknown"}) can&apos;t open the{" "}
            {roleLabel.toLowerCase()} dashboard.
          </p>
          <Link href="/" className={BTN_SECONDARY}>
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
        <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-in-out lg:flex">
          <Sidebar
            navItems={navItems}
            secondaryNavItems={secondaryNavItems}
            pathname={pathname}
            roleLabel={roleLabel}
          />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <button
              aria-label="Close menu overlay"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-foreground/30"
            />
            <aside className="absolute inset-y-0 left-0 flex w-[75%] max-w-xs flex-col border-r border-border bg-surface">
              <Sidebar
                navItems={navItems}
                secondaryNavItems={secondaryNavItems}
                pathname={pathname}
                roleLabel={roleLabel}
                onItemClick={() => setDrawerOpen(false)}
                onClose={() => setDrawerOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Main content column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader screenName={screenName} role={role} />
          <main className="flex-1 overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            {/* Dashboards use the full content column (AGENTS.md §1.2). */}
            <div
              className={[
                "w-full px-3 py-5 sm:px-4 sm:py-6 lg:px-6 lg:py-7",
                contentWidth === "wide" ? "" : "mx-auto max-w-7xl",
              ].join(" ")}
            >
              {children}
            </div>
          </main>
          <DashboardFooter />
        </div>
      </div>

      {/* Same mobile bottom bar as the public site (Post Item centered) */}
      {role !== "admin" ? <BottomNav /> : null}
    </div>
  );
}
