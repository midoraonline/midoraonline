"use client";

import { describeShopHours } from "@/lib/shopHours";

type Props = {
  openingHours?: unknown;
  isOpenNow?: boolean | null;
  nextChange?: unknown;
  availability?: {
    days?: string | null;
    hours?: string | null;
    opening_hours?: unknown;
    is_open_now?: boolean | null;
    next_change?: unknown;
  } | null;
};

export default function ShopHoursStatus({
  openingHours,
  isOpenNow,
  nextChange,
  availability,
}: Props) {
  const view = describeShopHours({
    opening_hours: openingHours,
    is_open_now: isOpenNow,
    next_change: nextChange,
    availability,
  });
  if (!view.status && view.week.length === 0) return null;

  return (
    <div className="min-w-0 space-y-1">
      {view.status ? (
        <p className="text-sm font-medium text-foreground">{view.status}</p>
      ) : null}
      {view.note ? <p className="text-xs text-muted">{view.note}</p> : null}
      {view.week.length > 0 ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-accent">
            Full week
          </summary>
          <ul className="mt-2 space-y-1">
            {view.week.map((row) => (
              <li key={row.label} className="flex gap-3 text-xs">
                <span className="w-9 font-semibold text-foreground">{row.label}</span>
                <span className="text-muted">{row.value}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
