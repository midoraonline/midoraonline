"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useChatUnreadCount } from "@/lib/hooks/useChatUnreadCount";
import { useAppSession, usePresenceStore } from "@/lib/state";

type Tab = {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  center?: boolean;
  isActive?: (pathname: string) => boolean;
};

export default function BottomNav() {
  const pathname = usePathname();
  const session = useAppSession();
  const unread = useChatUnreadCount("bottomnav-unread");

  const role = session.user?.user_role ?? null;
  const isMerchant = role === "merchant" || role === "admin";
  const onlineCount = usePresenceStore((s) => s.onlineCount);

  const postHref = session.isAuthenticated
    ? "/post-item"
    : `/login?next=${encodeURIComponent("/post-item")}`;

  const tabs: Tab[] = useMemo(() => {
    const shopsTab: Tab = isMerchant
      ? {
          label: "My listings",
          href: "/merchant/listings",
          icon: "inventory_2",
          isActive: (p) => p.startsWith("/merchant/listings"),
        }
      : {
          label: "Shops",
          href: "/shops",
          icon: "storefront",
        };

    let accountTab: Tab;
    if (!session.isAuthenticated) {
      accountTab = { label: "Account", href: "/login", icon: "account_circle" };
    } else if (role === "admin") {
      accountTab = {
        label: "Dashboard",
        href: "/admin",
        icon: "admin_panel_settings",
        isActive: (p) => p.startsWith("/admin"),
      };
    } else if (role === "merchant") {
      accountTab = {
        label: "Dashboard",
        href: "/merchant",
        icon: "space_dashboard",
        isActive: (p) =>
          p === "/merchant" ||
          (p.startsWith("/merchant/") &&
            !p.startsWith("/merchant/shops") &&
            !p.startsWith("/merchant/listings")),
      };
    } else {
      accountTab = {
        label: "Account",
        href: "/customer",
        icon: "account_circle",
        isActive: (p) => p.startsWith("/customer"),
      };
    }

    return [
      {
        label: "Home",
        href: "/",
        icon: "home",
        isActive: (p) => p === "/",
      },
      {
        label: "Messages",
        href: "/chat",
        icon: "chat",
        badge: session.isAuthenticated ? unread : 0,
      },
      {
        label: "Post Item",
        href: postHref,
        icon: "add",
        center: true,
        isActive: (p) => p.startsWith("/post-item"),
      },
      shopsTab,
      accountTab,
    ];
  }, [isMerchant, postHref, role, session.isAuthenticated, unread]);

  return (
    <div className="fixed bottom-0 inset-x-0 z-sticky border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] shadow-lg backdrop-blur-md md:hidden">
      {onlineCount > 0 ? (
        <div className="flex items-center justify-center gap-1.5 border-b border-accent/15 bg-accent/5 px-3 py-1 text-[10px] font-semibold text-accent">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span>{onlineCount.toLocaleString()} online now</span>
        </div>
      ) : null}

      <div className="grid h-14 grid-cols-5">
        {tabs.map((tab) => {
          const isActive = tab.isActive
            ? tab.isActive(pathname)
            : tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href.split("?")[0]);
          const badge = Number(tab.badge ?? 0);

          if (tab.center) {
            return (
              <Link
                key={`${tab.label}-${tab.href}`}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className="dm-focus relative flex h-full items-end justify-center pb-1"
              >
                <span className="absolute -top-3 left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-full bg-accent text-white shadow-lg ring-4 ring-surface transition-transform active:scale-[0.98]">
                  <MaterialSymbol name={tab.icon} className="!text-3xl" />
                </span>
                <span className="whitespace-nowrap text-[10px] font-bold leading-none tracking-tight text-accent">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={`${tab.label}-${tab.href}`}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`dm-focus relative flex h-full flex-col items-center justify-center py-1.5 transition-colors ${
                isActive
                  ? "font-bold text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="relative">
                <MaterialSymbol
                  name={tab.icon}
                  className={`!text-2xl ${isActive ? "text-accent" : "text-muted"}`}
                  filled={isActive}
                />
                {badge > 0 ? (
                  <span className="absolute -right-2 -top-1 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 max-w-full truncate px-0.5 text-center text-[10px] leading-none tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
