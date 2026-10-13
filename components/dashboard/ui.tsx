"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore, type ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-10 ${className}`}>
      {title || action ? (
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatStrip({ items }: { items: { label: string; value: ReactNode; hint?: ReactNode }[] }) {
  return (
    <dl className="mb-10 grid grid-cols-2 divide-border rounded-lg border border-border sm:flex sm:divide-x">
      {items.map((s, i) => (
        <div
          key={s.label}
          className={`min-w-0 flex-1 p-4 ${i % 2 === 1 ? "border-l border-border sm:border-l-0" : ""} ${
            i >= 2 ? "border-t border-border sm:border-t-0" : ""
          }`}
        >
          <dt className="truncate text-xs text-muted">{s.label}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{s.value}</dd>
          {s.hint ? <dd className="mt-0.5 text-xs text-muted">{s.hint}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

const DOT = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
  neutral: "bg-muted",
} as const;

export type StatusTone = keyof typeof DOT;

export function StatusDot({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-foreground/80">
      <span className={`size-1.5 rounded-full ${DOT[tone]}`} aria-hidden />
      {children}
    </span>
  );
}

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
}

export function useTabParam<T extends string>(tabs: readonly T[], fallback: T, key = "tab") {
  const raw = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get(key),
    () => null,
  );
  const tab = (tabs as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback;
  const setTab = useCallback(
    (next: T) => {
      const url = new URL(window.location.href);
      if (next === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, next);
      window.history.replaceState(window.history.state, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [fallback, key],
  );
  return [tab, setTab] as const;
}

const TAB = "-mb-px whitespace-nowrap border-b-2 pb-3 text-sm transition-colors";
const TAB_ON = "border-foreground font-medium text-foreground";
const TAB_OFF = "border-transparent text-muted hover:text-foreground";

export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  className = "",
}: {
  tabs: readonly { value: T; label: ReactNode; href?: string }[];
  value: T;
  onChange?: (v: T) => void;
  className?: string;
}) {
  return (
    <nav className={`mb-6 flex gap-5 overflow-x-auto border-b border-border ${className}`}>
      {tabs.map((t) => {
        const cls = `${TAB} ${t.value === value ? TAB_ON : TAB_OFF}`;
        return t.href ? (
          <Link key={t.value} href={t.href} className={cls} aria-current={t.value === value ? "page" : undefined}>
            {t.label}
          </Link>
        ) : (
          <button key={t.value} type="button" onClick={() => onChange?.(t.value)} className={cls} aria-pressed={t.value === value}>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

export function EmptyState({ message, action }: { message: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
      <p className="text-sm text-muted">{message}</p>
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: ReactNode; onRetry?: () => void }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="text-sm font-medium underline underline-offset-2">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export const LIST = "divide-y divide-border rounded-lg border border-border";
export const ROW = "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-subtle";
export const BTN_PRIMARY =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50";
export const BTN_SECONDARY =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50";
export const BTN_TEXT =
  "inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground";
export const TH = "px-3 py-2 text-left text-xs font-normal text-muted";
export const TD = "px-3 py-2.5";
export const NUM = "text-right tabular-nums";

export function formatCount(n?: number | null) {
  return new Intl.NumberFormat("en-UG").format(Number(n ?? 0));
}

export function formatUGXShort(n?: number | null) {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `UGX ${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 10_000) return `UGX ${Math.round(v / 1000)}K`;
  return `UGX ${formatCount(v)}`;
}

export function relativeTime(iso?: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function PageSkeleton({ stats = false, rows = 5, label = "Loading" }: { stats?: boolean; rows?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-6 w-40 rounded-md bg-surface-subtle" />
        <div className="h-4 w-64 max-w-full rounded-md bg-surface-subtle" />
      </div>
      {stats ? <div className="mb-10 h-20 rounded-lg border border-border" /> : null}
      <div className={LIST}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="h-4 flex-1 rounded-md bg-surface-subtle" />
            <div className="h-4 w-16 rounded-md bg-surface-subtle" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageError({ reset, backHref, backLabel }: { reset: () => void; backHref: string; backLabel: string }) {
  return (
    <div className="max-w-md py-10">
      <h1 className="text-xl font-semibold tracking-tight">This page didn&apos;t load</h1>
      <p className="mt-1 text-sm text-muted">Something went wrong while fetching it. Try again, or go back.</p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={reset} className={BTN_PRIMARY}>
          Try again
        </button>
        <Link href={backHref} className={BTN_SECONDARY}>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
