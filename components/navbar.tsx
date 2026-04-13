"use client";

import Link from "next/link";
import Image from "next/image";
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
    function syncUserFromToken() {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("midora_access_token")
          : null;
      if (!token) {
        setUserName(null);
        return;
      }

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
    }

    const cleanup = syncUserFromToken();

    function handleAuthChanged() {
      syncUserFromToken();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("midora-auth-changed", handleAuthChanged);
    }

    return () => {
      cleanup && cleanup();
      if (typeof window !== "undefined") {
        window.removeEventListener("midora-auth-changed", handleAuthChanged);
      }
    };
  }, [pathname]);

  const activeHref = useMemo(() => {
    const hit = navItems.find((i) => isActivePath(pathname, i.href));
    return hit?.href ?? "/";
  }, [pathname]);

  const displayName = useMemo(
    () => userName ?? "",
    [userName]
  );

  const initials = useMemo(() => {
    if (!displayName) return "";
    return displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="dm-container">
        <div className="flex h-14 items-center justify-between gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="Midora Online"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">
                Midora Online
              </p>
              <p className="text-xs text-muted">Brand-first discovery</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-3 md:flex" aria-label="Main">
            {navItems.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "dm-pill dm-focus transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-primary/5",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {displayName ? (
              <Link
                href="/account"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium dm-focus hover:opacity-95 transition-opacity"
              >
                <span className="grid size-7 place-items-center rounded-full bg-background/10 text-[11px] font-semibold">
                  {initials}
                </span>
                <span className="max-w-[140px] truncate">{displayName}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex dm-pill dm-focus bg-background px-4 py-2 text-sm text-foreground/85 transition-colors hover:bg-primary/10"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              className="inline-flex md:hidden items-center justify-center rounded-xl bg-background px-3 py-2 text-sm transition-colors hover:bg-primary/10 dm-focus"
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
            <div className="rounded-xl bg-background p-2">
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
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/85 hover:bg-primary/5",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                {displayName ? (
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground dm-focus hover:opacity-95 transition-opacity"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-background/10 text-[11px] font-semibold">
                      {initials}
                    </span>
                    <span className="max-w-[140px] truncate">{displayName}</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-2xl bg-background px-4 py-3 text-center text-sm font-semibold text-foreground/80 transition-colors hover:bg-primary/10 dm-focus"
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