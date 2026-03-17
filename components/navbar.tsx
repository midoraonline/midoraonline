"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiAuth } from "@/lib/api";

const navItems = [
  { href: "/", label: "Mall" },
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
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("midora_access_token")
        : null;
    if (!token) return;

    let cancelled = false;
    apiAuth
      .me(token)
      .then((me) => {
        if (!cancelled) {
          setUserName(me.full_name || me.email);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUserName(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeHref = useMemo(() => {
    const hit = navItems.find((i) => isActivePath(pathname, i.href));
    return hit?.href ?? "/";
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/85 backdrop-blur">
      <div className="dm-container">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 dm-focus"
              onClick={() => setOpen(false)}
            >
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">
                  Midora Online
                </p>
                <p className="text-xs text-muted">Brand-first discovery</p>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {navItems.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "dm-pill dm-focus transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground/80 hover:bg-foreground/5",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {userName ? (
              <Link
                href="/account"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-medium dm-focus hover:opacity-95 transition-opacity"
              >
                <span className="grid size-7 place-items-center rounded-full bg-background/10 text-[11px] font-semibold">
                  {userName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="max-w-[140px] truncate">{userName}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex dm-pill dm-focus border border-border bg-surface text-foreground/85 hover:bg-foreground/5 transition-colors px-4 py-2 text-sm"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              className="inline-flex md:hidden items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-sm dm-focus"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {open ? (
          <div className="md:hidden pb-4">
            <div className="dm-card p-2">
              <div className="flex flex-col">
                {navItems.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={[
                        "rounded-2xl px-4 py-3 text-sm font-medium dm-focus transition-colors",
                        active
                          ? "bg-foreground text-background"
                          : "text-foreground/85 hover:bg-foreground/5",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                {userName ? (
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background dm-focus hover:opacity-95 transition-opacity"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-background/10 text-[11px] font-semibold">
                      {userName
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <span className="max-w-[140px] truncate">{userName}</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground/80 dm-focus hover:bg-foreground/5 transition-colors text-center"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}