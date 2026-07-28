"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import { usePresenceCount, useRealtimeTable } from "@/lib/realtime/hooks";

export default function BottomNav() {
  const pathname = usePathname();
  const session = useAppSession();
  const [unread, setUnread] = useState(0);

  const role = session.user?.user_role ?? null;
  const dashboardHref =
    role === "admin"
      ? "/admin"
      : role === "merchant"
        ? "/merchant"
        : "/customer";

  const presenceState = useMemo(() => {
    if (session.isAuthenticated && session.user) {
      return {
        user_id: session.user.id,
        role: session.user.user_role ?? "customer",
        available: session.user.user_role === "merchant",
      };
    }
    return { role: "guest" as const };
  }, [session.isAuthenticated, session.user]);

  const onlineCount = usePresenceCount(
    "midora:presence:global",
    presenceState,
    true,
  );

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

  const tabs = [
    {
      label: "Home",
      href: "/",
      icon: "home",
    },
    {
      label: "Browse",
      href: "/products",
      icon: "grid_view",
    },
    {
      label: "Messages",
      href: "/chat",
      icon: "chat",
      badge: session.isAuthenticated ? unread : 0,
    },
    {
      label: "Shops",
      href: "/shops",
      icon: "storefront",
    },
    {
      label: "Account",
      href: session.isAuthenticated ? dashboardHref : "/login",
      icon: "account_circle",
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-sticky border-t border-neutral-200/80 bg-white/90 pb-safe shadow-lg backdrop-blur-md md:hidden">
      {/* Online strip — mirrors top-nav count so mobile always sees presence */}
      <div className="flex items-center justify-center gap-1.5 border-b border-emerald-100/80 bg-emerald-50/90 px-3 py-1 text-[10px] font-semibold text-emerald-700">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <span>{onlineCount.toLocaleString()} online</span>
      </div>

      <div className="flex h-14 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const badge = "badge" in tab ? Number(tab.badge ?? 0) : 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`dm-focus relative flex h-full flex-1 flex-col items-center justify-center py-1.5 transition-colors ${
                isActive
                  ? "font-bold text-orange-600"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <span className="relative">
                <MaterialSymbol
                  name={tab.icon}
                  className={`!text-2xl ${isActive ? "text-orange-600" : "text-neutral-400"}`}
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
