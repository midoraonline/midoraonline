"use client";

import Link from "next/link";
import { X } from "lucide-react";
import Logo from "@/components/Logo";

type Props = {
  children: React.ReactNode;
  // Small uppercase label beside the logo (e.g. "Merchant Studio")
  eyebrow?: string;
  // Where the close-X sends the user; defaults to the marketplace home.
  closeHref?: string;
};

/**
 * Minimal chrome for full-page flows (post an item, open a shop). No sidebar,
 * no nav, no footer — just a logo + close so wayfinding is one click while the
 * form owns the entire viewport.
 */
export default function StandaloneShell({
  children,
  eyebrow,
  closeHref = "/",
}: Props) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
        <Link href="/" className="dm-focus flex items-center gap-3 rounded-lg py-1">
          <Logo alt="Midora" width={100} height={32} className="h-8 w-auto" priority />
          {eyebrow ? (
            <>
              <span className="hidden h-4 w-px bg-border sm:block" />
              <span className="hidden text-xs font-semibold uppercase tracking-wider text-muted sm:inline-block">
                {eyebrow}
              </span>
            </>
          ) : null}
        </Link>

        <Link
          href={closeHref}
          aria-label="Close"
          className="dm-focus grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
        >
          <X className="size-5" />
        </Link>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
