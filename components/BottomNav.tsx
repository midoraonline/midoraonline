"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useAppSession, usePresenceStore } from "@/lib/state";
import { apiChat } from "@/lib/api";
import { useRealtimeTable } from "@/lib/realtime/hooks";

type Tab = {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  isActive?: (pathname: string) => boolean;
};

export default function BottomNav() {
  const pathname = usePathname();
  const session = useAppSession();
  const [unread, setUnread] = useState(0);

  const role = session.user?.user_role ?? null;
  const isMerchant = role === "merchant" || role === "admin";

  const onlineCount = usePresenceStore((s) => s.onlineCount);

  const fetchUnread = useCallback(async () => {
    if (!session.isAuthenticated) {
      setUnread(0);
      return;
    }
    try {
      const res = await apiChat.getUnreadCount();
      setUnread(res.unread_count ?? 0);
    } catch {
      /* keep last known */
    }
  }, [session.isAuthenticated]);

  useEffect(() => {
    const t = setTimeout(() => void fetchUnread(), 100);
    return () => clearTimeout(t);
  }, [fetchUnread]);

  useRealtimeTable(
    {
      table: "conversations",
      channel: "bottomnav-unread",
      event: "*",
      enabled: session.isAuthenticated,
    },
    () => {
      void fetchUnread();
    },
  );

  const tabs: Tab[] = useMemo(() => {
    // Merchants see a listings-first tab (their most-used surface: check status,
    // edit, delete, add new). Customers see a shops-directory tab.
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
        label: "Products",
        href: "/products",
        icon: "shopping_bag",
      },
      {
        label: "Messages",
        href: "/chat",
        icon: "chat",
        badge: session.isAuthenticated ? unread : 0,
      },
      shopsTab,
      accountTab,
    ];
  }, [isMerchant, role, session.isAuthenticated, unread]);

  return (
    <div className="fixed bottom-0 inset-x-0 z-sticky border-t border-border bg-surface/95 pb-safe shadow-lg backdrop-blur-md md:hidden">
      {/* Online strip — mobile-only presence (desktop shows it in the top navbar) */}
      {onlineCount > 0 ? (
        <div className="flex items-center justify-center gap-1.5 border-b border-accent/15 bg-accent/5 px-3 py-1 text-[10px] font-semibold text-accent">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span>{onlineCount.toLocaleString()} online now</span>
        </div>
      ) : null}

      <div className="flex h-14 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = tab.isActive
            ? tab.isActive(pathname)
            : tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const badge = Number(tab.badge ?? 0);

          return (
            <Link
              key={`${tab.label}-${tab.href}`}
              href={tab.href}
              className={`dm-focus relative flex h-full flex-1 flex-col items-center justify-center py-1.5 transition-colors ${
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
              <span className="mt-0.5 text-[10px] tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
