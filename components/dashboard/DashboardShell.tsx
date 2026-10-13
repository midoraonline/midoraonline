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
        "group flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 lg:h-9",
        active
          ? "bg-accent/10 font-medium text-foreground"
          : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
      ].join(" ")}
    >
      {item.icon && (
        <span className={`grid size-5 shrink-0 place-items-center [&>svg]:size-4 ${active ? "text-accent" : "text-muted group-hover:text-foreground"}`}>
          {item.icon}
        </span>
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge !== "" && (
        <span className="rounded-md bg-surface-muted px-1.5 text-xs tabular-nums text-muted">
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
      <div className="flex h-16 shrink-0 items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo alt="Midora" width={100} height={28} className="h-7 w-auto rounded-lg" />
        </Link>
        <span className="truncate rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{roleLabel}</span>
        {onClose ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="ml-auto grid size-10 shrink-0 place-items-center rounded-lg text-foreground transition-colors hover:bg-surface-muted"
          >
            <X className="size-5" strokeWidth={2.25} />
          </button>
        ) : null}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto border-t border-border px-3 pt-3 pb-4">
        <p className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted">Menu</p>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onClick={onItemClick} />
        ))}

        {secondaryNavItems && secondaryNavItems.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wide text-muted">Account</p>
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
        <div className="max-w-md space-y-3 rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
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
    <div className="min-h-[100dvh] bg-surface-page text-foreground">
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
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <aside className="absolute inset-y-0 left-0 flex w-[84vw] max-w-xs flex-col border-r border-border bg-surface shadow-xl">
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
          <main className="dm-dash flex-1 overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            {/* Dashboards use the full content column (AGENTS.md §1.2). */}
            <div
              className={[
                "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
                contentWidth === "wide" ? "max-w-[1400px]" : "max-w-7xl",
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
