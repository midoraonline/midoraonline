"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  variant: "signed-in" | "unsigned";
  onDismiss: () => void;
};

export default function HomeOnboardingBanner({ variant, onDismiss }: Props) {
  if (variant === "unsigned") {
    return (
      <div className="mb-6 flex animate-fadeIn flex-col items-start justify-between gap-4 rounded-2xl border border-accent/30 bg-accent p-4 shadow-md sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="shrink-0 rounded-xl bg-white/20 p-2">
            <MaterialSymbol name="login" className="!text-xl text-white" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-white">Unlock the full Midora experience</h4>
            <p className="mt-0.5 text-xs text-white/90">
              Save items, chat with sellers, and get personalised recommendations.
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
          <Link
            href="/login"
            className="dm-btn-accent dm-focus whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full p-1 text-white/90 transition-colors hover:bg-white/10"
            title="Dismiss"
          >
            <MaterialSymbol name="close" className="!text-lg" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex animate-fadeIn flex-col items-start justify-between gap-4 rounded-2xl border border-primary/20 bg-primary p-4 shadow-md sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="shrink-0 rounded-xl bg-white/10 p-2 text-accent">
          <MaterialSymbol name="auto_awesome" className="!text-xl" filled />
        </span>
        <div>
          <h4 className="text-sm font-bold text-accent">Welcome to Midora</h4>
          <p className="mt-0.5 text-xs text-white/75">
            Pick a category, browse listings, then chat with verified shops instantly.
          </p>
        </div>
      </div>
      <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/20"
        >
          Got it
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10"
          title="Dismiss"
        >
          <MaterialSymbol name="close" className="!text-lg" />
        </button>
      </div>
    </div>
  );
}
