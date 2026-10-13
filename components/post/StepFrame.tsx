"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-5">
      <p className="text-xs text-muted tabular-nums">
        Step {step} of {total}
      </p>
      <div
        className="mt-2 h-0.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
      >
        <div className="h-full bg-foreground transition-[width]" style={{ width: `${Math.round((step / total) * 100)}%` }} />
      </div>
    </div>
  );
}

export default function StepFrame({
  title,
  subtitle,
  onBack,
  step,
  total,
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
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 sm:py-10">
      <button
        type="button"
        onClick={onBack}
        className="dm-focus -ml-1 mb-4 inline-flex h-9 items-center gap-1.5 rounded-md px-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </button>
      {step && total ? <StepProgress step={step} total={total} /> : null}
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

export const OPTION_ROW =
  "dm-focus flex w-full items-center gap-3 rounded-md border border-border bg-background px-4 py-3.5 text-left transition-colors hover:border-foreground/40 hover:bg-surface";

export const INPUT =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-foreground dm-focus";
export const TEXTAREA =
  "min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-foreground dm-focus";

export function FormField({
  label,
  htmlFor,
  hint,
  optional,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
        {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-[color:var(--error)]" role="alert">
      {children}
    </p>
  );
}

export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap items-center gap-2 border-t border-border bg-background px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
      {children}
    </div>
  );
}
