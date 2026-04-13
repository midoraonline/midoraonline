"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiAuth } from "@/lib/api";

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
  "pointer-events-auto mx-auto w-full max-w-5xl dm-glass-bar px-3 sm:px-4";

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

  const displayName = useMemo(() => userName ?? "", [userName]);

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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-[max(0.75rem,env(safe-area-inset-top))] px-3 sm:px-5">
      <div className={shell}>
        <div className="flex h-[3.25rem] items-center justify-between gap-3 sm:h-14 sm:gap-5">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-2 rounded-xl py-1 dm-focus"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="Midora Online"
              width={34}
              height={34}
              className="size-[34px] shrink-0 rounded-lg sm:size-9"
              priority
            />
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              Midora Online
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
            {navItems.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors dm-focus",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {displayName ? (
              <>
                <Link
                  href="/account"
                  className="hidden items-center gap-2 rounded-full bg-primary/90 px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm backdrop-blur-sm transition-opacity dm-focus hover:opacity-95 md:inline-flex"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/15 text-[11px] font-semibold">
                    {initials}
                  </span>
                  <span className="max-w-[120px] truncate lg:max-w-[140px]">{displayName}</span>
                </Link>
                <Link
                  href="/account"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-sm backdrop-blur-sm transition-opacity dm-focus hover:opacity-95 md:hidden"
                  aria-label="Account"
                  title="Account"
                  onClick={() => setOpen(false)}
                >
                  <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/15 text-[10px] font-semibold">
                    {initials}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full bg-foreground/[0.07] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors dm-focus hover:bg-foreground/[0.11] md:inline-flex"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] px-3 py-2 text-xs font-semibold text-foreground/90 transition-colors dm-focus hover:bg-foreground/[0.11] md:hidden"
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
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "rounded-xl px-3 py-2.5 text-sm font-medium dm-focus transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
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
