import { PageSkeleton } from "@/components/dashboard/ui";

/**
 * Route-level skeletons. They render inside DashboardShell (the navbar and
 * sidebar stay put), so each one only mirrors the page body's layout.
 */

const BAR = "rounded-md bg-surface-muted";

export function ListSkeleton({ label, stats = false, rows = 6 }: { label: string; stats?: boolean; rows?: number }) {
  return <PageSkeleton label={label} stats={stats} rows={rows} />;
}

/** Settings pages: tab strip, then panels of left-heading / right-control rows. */
export function SettingsSkeleton({ label, rows = 4 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="animate-pulse space-y-6">
      <div className="flex gap-6 border-b border-border pb-2.5">
        {[64, 80, 72, 96].map((w) => (
          <div key={w} className={`h-4 ${BAR}`} style={{ width: w }} />
        ))}
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-xs">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2.2fr)] lg:gap-10">
            <div className="space-y-2">
              <div className={`h-4 w-32 ${BAR}`} />
              <div className={`h-3 w-48 max-w-full ${BAR}`} />
            </div>
            <div className="space-y-3">
              <div className={`h-11 w-full rounded-xl ${BAR}`} />
              {i % 2 === 0 ? <div className={`h-11 w-2/3 rounded-xl ${BAR}`} /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card grids: shops, plans. */
export function CardsSkeleton({ label, cards = 3 }: { label: string; cards?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="animate-pulse">
      <div className="mb-8 space-y-2">
        <div className={`h-4 w-64 max-w-full ${BAR}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div className={`h-5 w-1/2 ${BAR}`} />
            <div className={`h-3 w-3/4 ${BAR}`} />
            <div className={`h-3 w-2/3 ${BAR}`} />
            <div className={`mt-4 h-10 w-full rounded-xl ${BAR}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Two-pane inbox: thread list + conversation. */
export function InboxSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="grid animate-pulse gap-4 md:grid-cols-[320px_1fr]">
      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="size-10 rounded-full bg-surface-muted" />
            <div className="flex-1 space-y-2">
              <div className={`h-3 w-1/2 ${BAR}`} />
              <div className={`h-3 w-3/4 ${BAR}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden min-h-[60dvh] rounded-xl border border-border bg-surface md:block" />
    </div>
  );
}
