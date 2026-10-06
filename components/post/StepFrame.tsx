"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function StepFrame({
  title,
  subtitle,
  onBack,
  step,
  total,
  wide = false,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  step?: number;
  total?: number;
  wide?: boolean;
  children: ReactNode;
}) {
  const showProgress = Boolean(step && total && total > 0);
  return (
    <div className={`mx-auto w-full ${wide ? "max-w-7xl" : "max-w-lg"} px-4 py-6 sm:py-12`}>
      <div
        className={
          wide
            ? ""
            : "sm:rounded-2xl sm:border sm:border-border sm:bg-surface sm:p-6 sm:shadow-md lg:p-8"
        }
      >
        <button
          type="button"
          onClick={onBack}
          className="dm-focus mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </button>
        {showProgress ? (
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Step {step} of {total}
            </p>
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={step}
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.round((step! / total!) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}
        <h1 className={`font-display text-2xl font-bold tracking-tight text-foreground ${wide ? "sm:text-3xl" : ""}`}>
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
        <div className="mt-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}
