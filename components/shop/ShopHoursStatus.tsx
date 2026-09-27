"use client";

import { describeShopHours } from "@/lib/shopHours";

type Props = {
  availability?: unknown;
  availabilityText?: string | null;
  isOpenNow?: boolean | null;
  nextChange?: string | null;
};

export default function ShopHoursStatus({
  availability,
  availabilityText,
  isOpenNow,
  nextChange,
}: Props) {
  const view = describeShopHours({
    availability,
    availability_text: availabilityText,
    is_open_now: isOpenNow,
    next_change: nextChange,
  });
  if (!view.status && view.week.length === 0) return null;

  return (
    <div className="min-w-0 space-y-1">
      {view.status ? <p className="text-sm font-medium text-foreground">{view.status}</p> : null}
      {view.note ? <p className="text-xs text-muted">{view.note}</p> : null}
      {view.week.length > 0 ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-accent">Full week</summary>
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
