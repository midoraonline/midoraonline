"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          We couldn’t load this page. You can try again or go back home.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-5 py-2.5 text-sm font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-foreground/20 bg-transparent px-5 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
