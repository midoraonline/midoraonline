"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import {
  BarChart3,
  Eye,
  Heart,
  Inbox,
  MessageCircle,
  MessagesSquare,
  Package,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

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
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
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
    <section className={`mb-8 ${className}`}>
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

const STAT_ICONS: [RegExp, LucideIcon][] = [
  [/whatsapp/i, MessageCircle],
  [/message|conversation|chat/i, MessagesSquare],
  [/view|impression/i, Eye],
  [/shop|store|merchant/i, Store],
  [/user|customer|follower|lead/i, Users],
  [/save|wish|like/i, Heart],
  [/listing|product|item/i, Package],
];

function statIcon(label: string): LucideIcon {
  return STAT_ICONS.find(([re]) => re.test(label))?.[1] ?? BarChart3;
}

export function StatStrip({
  items,
}: {
  items: { label: string; value: ReactNode; hint?: ReactNode; icon?: LucideIcon }[];
}) {
  return (
    <dl className={`mb-8 grid grid-cols-2 gap-3 ${items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map((s) => {
        const Icon = s.icon ?? statIcon(s.label);
        return (
          <div key={s.label} className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <dt className="truncate text-sm text-muted">{s.label}</dt>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent" aria-hidden>
                <Icon className="size-4" />
              </span>
            </div>
            <dd className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">{s.value}</dd>
            {s.hint ? <dd className="mt-1 truncate text-xs text-muted">{s.hint}</dd> : null}
          </div>
        );
      })}
    </dl>
  );
}

const BADGE = {
  ok: "bg-success-subtle text-success ring-success/20",
  warn: "bg-warning-subtle text-warning ring-warning/20",
  bad: "bg-error-subtle text-error ring-error/20",
  neutral: "bg-surface-muted text-muted ring-border",
} as const;

export type StatusTone = keyof typeof BADGE;

/** Soft badge (4 tones). Kept under the old name so every caller picks it up. */
export function StatusDot({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[tone]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export const Badge = StatusDot;

/** 40px row media: image thumb, or a tinted initial tile when there is no photo. */
export function RowThumb({
  src,
  alt = "",
  label,
  round = false,
  tone = "accent",
}: {
  src?: string | null;
  alt?: string;
  label?: string | null;
  round?: boolean;
  tone?: "accent" | "product" | "service" | "opportunity" | "job";
}) {
  const shape = round ? "rounded-full" : "rounded-lg";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`size-10 shrink-0 ${shape} object-cover ring-1 ring-border`} loading="lazy" />;
  }
  const tones = {
    accent: "bg-accent/10 text-accent",
    product: "bg-listing-product text-listing-product-foreground",
    service: "bg-listing-service text-listing-service-foreground",
    opportunity: "bg-listing-opportunity text-listing-opportunity-foreground",
    job: "bg-listing-job text-listing-job-foreground",
  } as const;
  return (
    <span className={`grid size-10 shrink-0 place-items-center ${shape} text-sm font-semibold uppercase ${tones[tone]}`} aria-hidden>
      {(label ?? "").trim().charAt(0) || "·"}
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

const TAB = "-mb-px inline-flex min-h-10 items-center whitespace-nowrap border-b-2 pb-2.5 text-sm transition-colors";
const TAB_ON = "border-accent font-medium text-foreground";
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
    <nav className={`scrollbar-none mb-6 flex gap-6 overflow-x-auto border-b border-border ${className}`}>
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

/** Segmented control for filters inside a card (range pickers, small toggles). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-surface-muted p-1" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-8 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            o.value === value ? "bg-surface font-medium text-foreground shadow-xs" : "text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  message,
  title,
  action,
  icon: Icon = Inbox,
}: {
  message: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-accent/10 text-accent" aria-hidden>
        <Icon className="size-5" />
      </span>
      {title ? <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3> : null}
      <p className={`${title ? "mt-1" : "mt-4"} max-w-sm text-sm text-muted`}>{message}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: ReactNode; onRetry?: () => void }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-error/20 bg-error-subtle px-4 py-3 text-sm text-error">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="text-sm font-medium underline underline-offset-2">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export const CARD = "rounded-xl border border-border bg-surface shadow-xs";
export const CARD_HEADER = "flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5";
export const LIST = "divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-xs";
export const ROW = "flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60 sm:px-5";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
export const BTN_PRIMARY =
  `inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-accent-hover disabled:opacity-50 sm:h-9 ${FOCUS}`;
export const BTN_SECONDARY =
  `inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-surface-muted disabled:opacity-50 sm:h-9 ${FOCUS}`;
export const BTN_GHOST =
  `inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50 sm:h-9 ${FOCUS}`;
export const BTN_TEXT =
  "inline-flex min-h-10 items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover hover:underline sm:min-h-0";
export const INPUT =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-xs placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10";
export const TABLE_WRAP = "overflow-hidden rounded-xl border border-border bg-surface shadow-xs";
export const THEAD = "bg-surface-subtle";
export const TH = "px-4 py-2.5 text-left text-xs font-medium text-muted";
export const TD = "px-4 py-3";
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
        <div className="h-6 w-40 rounded-md bg-surface-muted" />
        <div className="h-4 w-64 max-w-full rounded-md bg-surface-muted" />
      </div>
      {stats ? (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[6.5rem] rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : null}
      <div className={LIST}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <div className="size-10 rounded-lg bg-surface-muted" />
            <div className="h-4 flex-1 rounded-md bg-surface-muted" />
            <div className="h-4 w-16 rounded-md bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageError({ reset, backHref, backLabel }: { reset: () => void; backHref: string; backLabel: string }) {
  return (
    <div className="max-w-md py-10">
      <h1 className="text-2xl font-semibold tracking-tight">This page didn&apos;t load</h1>
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

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-3 text-sm">
      <span className="tabular-nums text-muted">
        Page {page} of {totalPages}
      </span>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={BTN_SECONDARY}>
        Previous
      </button>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={BTN_SECONDARY}>
        Next
      </button>
    </div>
  );
}
