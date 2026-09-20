"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[50vh] place-items-center p-6">
      <div className="dm-card max-w-md space-y-4 p-8 text-center">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Couldn&apos;t load this page
        </h2>
        <p className="text-sm text-muted">
          Try again, or go back to your merchant overview.
        </p>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={() => reset()} className="dm-btn dm-btn-primary dm-btn-sm">
            Try again
          </button>
          <Link href="/merchant" className="dm-btn dm-btn-secondary dm-btn-sm">
            Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
