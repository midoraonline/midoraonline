"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";

export default function ShopHeaderAuth() {
  const pathname = usePathname();
  const session = useAppSession();

  const nextHref = useMemo(() => {
    const next = pathname && pathname.startsWith("/") ? pathname : "/shops";
    return `/login?next=${encodeURIComponent(next)}`;
  }, [pathname]);

  const onAccount =
    pathname === "/account" ||
    (pathname?.startsWith("/account/") ?? false) ||
    pathname === "/admin" ||
    (pathname?.startsWith("/admin/") ?? false) ||
    pathname === "/merchant" ||
    (pathname?.startsWith("/merchant/") ?? false) ||
    pathname === "/customer" ||
    (pathname?.startsWith("/customer/") ?? false);

  const role = session.user?.user_role ?? null;
  const dashboardHref =
    role === "admin"
      ? "/admin"
      : role === "merchant"
      ? "/merchant"
      : "/customer";

  if (!session.hydrated) {
    // Reserve the space without a shimmer so the header doesn't flash a
    // "loading" pill on every navigation — feels much more seamless.
    return (
      <div className="flex items-center gap-2" aria-hidden>
        <div className="hidden h-9 min-w-[8rem] rounded-full md:block" />
        <span className="inline-flex size-9 rounded-full md:hidden" />
      </div>
    );
  }

  if (session.user) {
    const label =
      session.user.full_name?.trim() ||
      session.user.email?.trim() ||
      `Account ${session.user.id.slice(0, 8)}`;
    const initials = label
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const accountBg = onAccount ? "bg-accent" : "bg-accent/90";

    return (
      <>
        <Link
          href={dashboardHref}
          className={[
            "hidden items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm backdrop-blur-sm transition-opacity dm-focus hover:opacity-95 md:inline-flex",
            accountBg,
          ].join(" ")}
          aria-label="Account"
          title="Account"
        >
          <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/15 text-[11px] font-semibold">
            {initials}
          </span>
          <span className="max-w-[120px] truncate lg:max-w-[140px]">{label}</span>
        </Link>
        <Link
          href={dashboardHref}
          className={[
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-sm backdrop-blur-sm transition-opacity dm-focus hover:opacity-95 md:hidden",
            accountBg,
          ].join(" ")}
          aria-label="Account"
          title="Account"
        >
          <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/15 text-[10px] font-semibold">
            {initials}
          </span>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href={nextHref}
        className="dm-btn-accent dm-focus hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex"
        aria-label="Sign in"
      >
        Login
      </Link>
      <Link
        href={nextHref}
        className="dm-btn-accent dm-focus inline-flex shrink-0 items-center justify-center rounded-full px-3 py-2 text-xs font-semibold md:hidden"
        aria-label="Sign in"
      >
        <MaterialSymbol name="person" className="!text-[18px] leading-none" />
        <span className="ml-1">Sign in</span>
      </Link>
    </>
  );
}
