"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowLeft, HelpCircle, Home, List } from "lucide-react";
import { previousRoute } from "@/lib/returnTo";
import { useAppSession } from "@/lib/state";

const noop = () => () => {};

/**
 * "Leave" options for abandon / back / error / empty pages:
 * back to where the user came from, home, My listings, help.
 */
export default function LeaveLinks({
  className = "",
  hideListings = false,
}: {
  className?: string;
  hideListings?: boolean;
}) {
  const prev = useSyncExternalStore(noop, previousRoute, () => null);
  const session = useAppSession();
  const role = session.user?.user_role;
  const canList = !hideListings && (role === "merchant" || role === "admin");
  const item =
    "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";
  return (
    <nav aria-label="Leave this page" className={`flex flex-wrap items-center justify-center gap-1 ${className}`}>
      {prev ? (
        <Link href={prev} className={item}>
          <ArrowLeft className="size-4" aria-hidden />
          Go back
        </Link>
      ) : null}
      <Link href="/" className={item}>
        <Home className="size-4" aria-hidden />
        Home
      </Link>
      {canList ? (
        <Link href="/merchant/listings" className={item}>
          <List className="size-4" aria-hidden />
          My listings
        </Link>
      ) : null}
      <Link href="/contactus" className={item}>
        <HelpCircle className="size-4" aria-hidden />
        Help
      </Link>
    </nav>
  );
}
