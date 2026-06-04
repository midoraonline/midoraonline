"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { Menu, X, Search } from "lucide-react";
import BrowseSearchBar from "@/components/browse/BrowseSearchBar";

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

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const session = useAppSession();
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  /* Close mobile menu on outside click */
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  /* Focus search input when opened */
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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

  const onChatPage = pathname === "/chat";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div ref={menuRef}>
        <div className="dm-container flex h-14 items-center gap-3 sm:gap-5">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg py-1 dm-focus"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="Midora Online"
              width={100}
              height={34}
              className="h-7 w-auto sm:h-8"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {navItems.map((item) => {
              const active = activeHref !== null && item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors dm-focus",
                    active
                      ? "text-accent"
                      : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search */}
          <div className="hidden flex-1 md:block md:max-w-xs lg:max-w-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                placeholder="Search products, shops\u2026"
                className="min-h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none ring-0 transition-[border-color,box-shadow] focus-visible:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/10"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2" suppressHydrationWarning>
            {/* Mobile search toggle */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-foreground md:hidden dm-focus"
              aria-label="Toggle search"
            >
              <Search className="size-4" />
            </button>

            {session.isAuthenticated ? (
              <Link
                href="/chat"
                className={`relative grid size-9 place-items-center rounded-full transition-colors dm-focus ${
                  onChatPage
                    ? "bg-accent text-white shadow-sm"
                    : "text-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground"
                }`}
                aria-label="Messages"
                title="Messages"
              >
                <MaterialSymbol name="chat" className="!text-lg" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] px-1 h-[18px] place-items-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white shadow-sm">
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
                    "hidden items-center gap-2 rounded-full border border-border pl-1.5 pr-3 py-1 text-xs font-medium transition-all dm-focus hover:shadow-sm md:inline-flex",
                    onAccount
                      ? "bg-accent text-white border-accent shadow-sm"
                      : "bg-surface text-foreground hover:border-border-strong",
                  ].join(" ")}
                >
                  <span className="grid size-7 place-items-center rounded-full bg-foreground/[0.08] text-[11px] font-semibold">
                    {initials}
                  </span>
                  <span className="max-w-[120px] truncate lg:max-w-[140px]">{displayName}</span>
                </Link>
                <Link
                  href={dashboardHref}
                  className={[
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-all dm-focus hover:shadow-sm md:hidden",
                    onAccount
                      ? "bg-accent text-white shadow-sm"
                      : "bg-surface text-foreground border border-border",
                  ].join(" ")}
                  aria-label="Account"
                  title="Account"
                  onClick={() => setOpen(false)}
                >
                  <span className="grid size-7 place-items-center rounded-full bg-foreground/[0.08] text-[10px] font-semibold">
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
                  className="hidden rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all dm-focus hover:bg-accent-hover hover:shadow-md md:inline-flex"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-all dm-focus hover:bg-accent-hover md:hidden"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              </>
            )}

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-foreground/[0.05] px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.1] md:hidden dm-focus"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-out md:hidden ${
            searchOpen ? "max-h-14 border-t border-border" : "max-h-0"
          }`}
        >
          <div className="px-4 py-2">
            <BrowseSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products, shops\u2026"
              ariaLabel="Search"
            />
          </div>
        </div>

        {/* Mobile menu */}
        {open ? (
          <div className="border-t border-border pb-3 pt-2 md:hidden">
            <div className="flex flex-col gap-0.5 px-2">
              {navItems.map((item) => {
                const active = activeHref !== null && item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium dm-focus transition-colors",
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-foreground/85 hover:bg-foreground/[0.04]",
                    ].join(" ")}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    <span className={active ? "font-semibold" : ""}>{item.label}</span>
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
