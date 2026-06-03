"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import { MaterialSymbol } from "@/components/MaterialSymbol";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/shops", label: "Shops" },
  { href: "/products", label: "Products" },
  { href: "/aboutus", label: "About" },
  { href: "/contactus", label: "Contact" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const shell =
  "pointer-events-auto mx-auto w-full max-w-none dm-glass-bar px-3 sm:px-4";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const session = useAppSession();
  const [unread, setUnread] = useState(0);

  const activeHref = useMemo(() => {
    const hit = navItems.find((i) => isActivePath(pathname, i.href));
    return hit?.href ?? null;
  }, [pathname]);

  const displayName = useMemo(() => {
    if (!session.user) return "";
    return (
      session.user.full_name?.trim() ||
      session.user.email?.trim() ||
      `Account ${session.user.id.slice(0, 8)}`
    );
  }, [session.user]);

  const initials = useMemo(() => {
    if (!displayName) return "";
    return displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  const authLoading = session.hydrated && session.isAuthenticated && session.user === undefined;

  const unreadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!session.isAuthenticated) {
      setUnread(0);
      return;
    }
    try {
      const res = await apiChat.getUnreadCount();
      setUnread(res.unread_count);
    } catch {}
  }, [session.isAuthenticated]);

  useEffect(() => {
    fetchUnread();
    unreadIntervalRef.current = setInterval(fetchUnread, 15000);
    return () => {
      if (unreadIntervalRef.current) clearInterval(unreadIntervalRef.current);
    };
  }, [fetchUnread]);

  const role = session.user?.user_role ?? null;
  const dashboardHref =
    role === "admin"
      ? "/admin"
      : role === "merchant"
      ? "/merchant"
      : "/customer";

  const onAccount =
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/merchant" ||
    pathname.startsWith("/merchant/") ||
    pathname === "/customer" ||
    pathname.startsWith("/customer/");
  const accountPillBg = onAccount ? "bg-accent" : "bg-accent/90";

  const onChatPage = pathname === "/chat";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-[max(0.75rem,env(safe-area-inset-top))] px-3 sm:px-5">
      <div className={shell}>
        <div
          className="flex h-[3.25rem] items-center justify-between gap-3 sm:h-14 sm:gap-5"
          suppressHydrationWarning
        >
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-2 rounded-xl py-1 dm-focus"
            onClick={() => setOpen(false)}
          >
          <Image
            src="/logo.png"
            alt="Midora Online"
            width={100}
            height={34}
            className="h-8 w-auto shrink-0"
            priority
          />
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
            {navItems.map((item) => {
              const active = activeHref !== null && item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors dm-focus",
                    active
                      ? "bg-accent text-white shadow-sm"
                      : "text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2" suppressHydrationWarning>
            {session.isAuthenticated ? (
              <Link
                href="/chat"
                className={`relative grid size-9 place-items-center rounded-full transition-colors dm-focus ${
                  onChatPage
                    ? "bg-accent text-white"
                    : "text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground"
                }`}
                aria-label="Messages"
                title="Messages"
              >
                <MaterialSymbol name="chat" className="!text-xl" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] px-1 h-[18px] place-items-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            ) : null}

            {displayName ? (
              <>
                <Link
                  href={dashboardHref}
                  className={[
                    "hidden items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm backdrop-blur-sm transition-opacity dm-focus hover:opacity-95 md:inline-flex",
                    accountPillBg,
                  ].join(" ")}
                >
                  <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/15 text-[11px] font-semibold">
                    {initials}
                  </span>
                  <span className="max-w-[120px] truncate lg:max-w-[140px]">{displayName}</span>
                </Link>
                <Link
                  href={dashboardHref}
                  className={[
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-sm backdrop-blur-sm transition-opacity dm-focus hover:opacity-95 md:hidden",
                    accountPillBg,
                  ].join(" ")}
                  aria-label="Account"
                  title="Account"
                  onClick={() => setOpen(false)}
                >
                  <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/15 text-[10px] font-semibold">
                    {initials}
                  </span>
                </Link>
              </>
            ) : authLoading ? (
              <span className="inline-flex size-9 shrink-0 rounded-full md:hidden" aria-hidden />
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors dm-focus hover:bg-accent/90 md:inline-flex"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors dm-focus hover:bg-accent/90 md:hidden"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              </>
            )}

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-foreground/[0.07] px-3 py-2 text-sm font-medium text-foreground/85 transition-colors hover:bg-foreground/[0.11] md:hidden dm-focus"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-foreground/[0.06] pb-3 pt-2 md:hidden">
            <div className="flex flex-col gap-0.5 rounded-xl bg-foreground/[0.03] p-1.5">
              {navItems.map((item) => {
                const active = activeHref !== null && item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "rounded-xl px-3 py-2.5 text-sm font-medium dm-focus transition-colors",
                      active
                        ? "bg-accent text-white"
                        : "text-foreground/85 hover:bg-foreground/[0.06]",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
