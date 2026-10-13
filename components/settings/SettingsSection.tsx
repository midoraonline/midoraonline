import type { ReactNode } from "react";

/** One card per settings tab; rows are split by hairline dividers. */
export function SettingsPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`divide-y divide-border rounded-xl border border-border bg-surface shadow-xs ${className}`}>
      {children}
    </div>
  );
}

/**
 * Settings row: heading + one-line description on the left, controls on the
 * right (desktop). Stacks on mobile. Controls fill the remaining width.
 */
export function SettingsRow({
  title,
  description,
  children,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2.2fr)] lg:gap-10"
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Form footer row inside a panel: primary action aligned with the controls. */
export function SettingsActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 bg-surface-subtle/60 px-4 py-3 sm:px-6">
      {children}
    </div>
  );
}
