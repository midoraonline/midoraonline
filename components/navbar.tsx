"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { Menu, X } from "lucide-react";
import ProductSearchBar from "@/components/browse/ProductSearchBar";

function ProfileDropdown({ onNavigate }: { onNavigate?: () => void }) {
  const [ddOpen, setDdOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ddOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDdOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ddOpen]);

  const close = () => {
    setDdOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={ref} className="relative">
      {/* Desktop trigger */}
      <button
        type="button"
        onClick={() => setDdOpen((v) => !v)}
        aria-expanded={ddOpen}
        className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.04] md:inline-flex dm-focus"
      >
        <MaterialSymbol name="person" className="!text-lg" />
        Profile
        <MaterialSymbol
          name="expand_more"
          className={`!text-base text-muted transition-transform duration-200 ${ddOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setDdOpen((v) => !v)}
        aria-expanded={ddOpen}
        aria-label="Profile"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground md:hidden dm-focus"
      >
        <MaterialSymbol name="person" className="!text-lg" />
      </button>

      {ddOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
          <div className="p-1.5">
            <Link
              href="/login"
              onClick={close}
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Sign in
            </Link>
            <div className="my-1 h-px bg-border" />
            <Link
              href="/account"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface-subtle"
            >
              <MaterialSymbol name="account_circle" className="!text-base text-muted" />
              My account
            </Link>
            <Link
              href="/customer/saved"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface-subtle"
            >
              <MaterialSymbol name="favorite" className="!text-base text-muted" />
              Wishlist
            </Link>
            <Link
              href="/customer/orders"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface-subtle"
            >
              <MaterialSymbol name="receipt_long" className="!text-base text-muted" />
              Orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

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

export default function Navbar({
  shopLogoUrl,
  shopName,
}: {
  shopLogoUrl?: string | null;
  shopName?: string | null;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const session = useAppSession();
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

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

  function submitNavbarSearch(q?: string) {
    const term = (q ?? searchQuery).trim();
    if (!term) return;
    setSearchOpen(false);
    router.push(`/products?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div ref={menuRef}>
        <div className="dm-container flex h-14 items-center gap-3 sm:gap-5">
          {/* Logo */}
          <Link
            href={shopLogoUrl ? "#" : "/"}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg py-1 dm-focus"
            onClick={() => setOpen(false)}
          >
            <Image
              src={shopLogoUrl || "/logo.png"}
              alt={shopLogoUrl ? shopName || "Shop" : "Midora Online"}
              width={100}
              height={34}
              className={`${shopLogoUrl ? "size-7 rounded-full object-cover sm:size-8" : "h-7 w-auto sm:h-8"}`}
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
          <div className="ml-auto hidden w-full md:block md:max-w-sm lg:max-w-md">
            <ProductSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={submitNavbarSearch}
              placeholder="Search products…"
              ariaLabel="Search products"
            />
          </div>

          {/* Right actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 md:gap-2" suppressHydrationWarning>
            {/* Mobile search toggle */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-foreground md:hidden dm-focus"
              aria-label="Toggle search"
            >
              <MaterialSymbol name="search" className="!text-lg" />
            </button>

            {session.isAuthenticated ? (
              <>
                {/* Wishlist */}
                <Link
                  href="/customer/wishlist"
                  className="relative grid size-9 place-items-center rounded-full transition-colors dm-focus text-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground"
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <MaterialSymbol name="favorite" className="!text-lg" />
                </Link>
                {/* Chat */}
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
                {/* Create Shop — shown when user has no shops */}
                {(!session.ownedShopIds || session.ownedShopIds.length === 0) ? (
                  <Link
                    href="/open-shop"
                    className="hidden rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all dm-focus hover:bg-accent-hover hover:shadow-md md:inline-flex"
                  >
                    Create Shop
                  </Link>
                ) : null}
              </>
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
              <ProfileDropdown onNavigate={() => setOpen(false)} />
            )}

            <button
              type="button"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground md:hidden dm-focus"
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
            <ProductSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={submitNavbarSearch}
              placeholder="Search products…"
              ariaLabel="Search products"
            />
          </div>
        </div>

        {/* Mobile menu */}
        {open ? (
          <div className="border-t border-border pb-4 pt-2 md:hidden">
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

            {/* Mobile: wishlist + create shop — shown when logged in */}
            {session.isAuthenticated ? (
              <div className="mt-2 flex flex-col gap-0.5 px-2">
                <Link
                  href="/customer/wishlist"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/85 transition-colors dm-focus hover:bg-foreground/[0.04]"
                >
                  <MaterialSymbol name="favorite" className="!text-lg text-foreground/60" />
                  Wishlist
                </Link>
                {(!session.ownedShopIds || session.ownedShopIds.length === 0) ? (
                  <Link
                    href="/open-shop"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg bg-accent/10 px-3 py-2.5 text-sm font-semibold text-accent transition-colors dm-focus hover:bg-accent/20"
                  >
                    <MaterialSymbol name="store" className="!text-lg" />
                    Create Shop
                  </Link>
                ) : null}
              </div>
            ) : null}

            {/* Sign in CTA — shown only when not logged in */}
            {!session.isAuthenticated && !authLoading && (
              <div className="mt-3 border-t border-border px-4 pt-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-all dm-focus hover:bg-accent-hover"
                >
                  Sign in to Midora
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
