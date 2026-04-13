"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiAuth } from "@/lib/api";

export default function ShopHeaderAuth() {
  const pathname = usePathname();
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
      cleanup?.();
      if (typeof window !== "undefined") {
        window.removeEventListener("midora-auth-changed", handleAuthChanged);
      }
    };
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

  if (displayName) {
    return (
      <Link
        href="/account"
        className="inline-flex shrink-0 items-center justify-center gap-0 rounded-full bg-primary/90 text-primary-foreground shadow-sm backdrop-blur-sm transition-opacity dm-focus hover:opacity-95 size-9 sm:h-auto sm:min-h-9 sm:w-auto sm:gap-2 sm:px-2.5 sm:py-1.5"
        aria-label="Account"
        title="Account"
      >
        <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/15 text-[10px] font-semibold sm:text-[11px]">
          {initials}
        </span>
        <span className="hidden max-w-[100px] truncate text-xs font-medium sm:inline">
          {displayName}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] px-2.5 py-2 text-xs font-semibold text-foreground/90 transition-colors dm-focus hover:bg-foreground/[0.11] sm:px-3 sm:text-sm"
    >
      Sign in
    </Link>
  );
}
