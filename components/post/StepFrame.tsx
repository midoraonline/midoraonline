"use client";

import { ArrowLeft, Check } from "lucide-react";
import type { ReactNode } from "react";

export function StepProgress({ step, total, label }: { step: number; total: number; label?: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs text-muted tabular-nums">
        Step {step} of {total}
        {label ? ` · ${label}` : ""}
      </p>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${Math.round((step / total) * 100)}%` }} />
      </div>
    </div>
  );
}

/** Desktop step rail: done (accent + check), current (ring), upcoming (muted). */
export function StepRail({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <ol className="space-y-1" aria-label="Steps">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <li key={label} className="flex min-h-10 items-center gap-3 text-sm" aria-current={state === "current" ? "step" : undefined}>
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs font-medium tabular-nums ${
                state === "done"
                  ? "border-accent bg-accent text-white"
                  : state === "current"
                    ? "border-accent text-accent ring-4 ring-accent/10"
                    : "border-border text-muted"
              }`}
            >
              {state === "done" ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={state === "upcoming" ? "text-muted" : "font-medium text-foreground"}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function StepFrame({
  title,
  subtitle,
  onBack,
  step,
  total,
  steps,
  preview,
  wide,
  plain,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  step?: number;
  total?: number;
  /** Step labels; shows a rail on desktop. */
  steps?: readonly string[];
  /** Live preview, desktop right column. */
  preview?: ReactNode;
  wide?: boolean;
  /** Render children without the step card (choice screens). */
  plain?: boolean;
  children: ReactNode;
}) {
  const hasRail = !!(steps && step);
  const layout = hasRail
    ? preview
      ? "lg:grid lg:grid-cols-[220px_minmax(0,1fr)_340px] lg:gap-10 max-w-[1440px]"
      : "lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 max-w-7xl"
    : wide
      ? "max-w-7xl"
      : "max-w-6xl";
  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-surface-page">
      <div className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-10 lg:px-8 ${layout}`}>
        {hasRail ? (
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <StepRail steps={steps!} current={step! - 1} />
            </div>
          </aside>
        ) : null}
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="dm-focus -ml-2 mb-4 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
          {step && total ? (
            <div className={hasRail ? "lg:hidden" : ""}>
              <StepProgress step={step} total={total} label={steps?.[step - 1]} />
            </div>
          ) : null}
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          {plain ? (
            <div className="mt-6 space-y-4">{children}</div>
          ) : (
            <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-4 shadow-xs sm:p-6">{children}</div>
          )}
        </div>
        {preview ? (
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Preview</p>
              {preview}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export const OPTION_ROW =
  "dm-focus flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-left shadow-xs transition-colors hover:border-accent/50 hover:bg-surface-muted/40";

export const INPUT =
  "h-10 w-full rounded-lg border border-border-input bg-surface px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted/80 focus:border-accent focus:ring-4 focus:ring-accent/25";
export const TEXTAREA =
  "min-h-28 w-full rounded-xl border border-border-input bg-surface px-3 py-2.5 text-sm text-foreground shadow-xs outline-none placeholder:text-muted/80 focus:border-accent focus:ring-4 focus:ring-accent/25";

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
    <div className="sticky bottom-0 z-20 -mx-4 -mb-4 mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:-mb-6 sm:rounded-b-xl sm:px-6 [&>*:first-child]:order-last">
      {children}
    </div>
  );
}
