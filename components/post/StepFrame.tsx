"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function StepFrame({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 sm:py-12">
      <div className="sm:rounded-2xl sm:border sm:border-border sm:bg-surface sm:p-6 sm:shadow-md">
        <button
          type="button"
          onClick={onBack}
          className="dm-focus mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </button>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
        <div className="mt-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}
