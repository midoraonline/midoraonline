"use client";

import { WEEKDAYS, WEEKDAY_LABEL, copyMondayToWeek, type HoursDraft, type TimeRange } from "@/lib/shopHours";

type Props = {
  value: HoursDraft;
  onChange: (next: HoursDraft) => void;
};

function setDay(draft: HoursDraft, day: (typeof WEEKDAYS)[number], patch: Partial<HoursDraft["days"]["mon"]>): HoursDraft {
  return {
    ...draft,
    days: { ...draft.days, [day]: { ...draft.days[day], ...patch } },
  };
}

export default function ShopHoursEditor({ value, onChange }: Props) {
  function updateRange(day: (typeof WEEKDAYS)[number], index: number, patch: Partial<TimeRange>) {
    const ranges = value.days[day].ranges.map((range, i) =>
      i === index ? { ...range, ...patch } : range,
    );
    onChange(setDay(value, day, { ranges }));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["weekly", "Weekly hours"],
            ["always", "Open 24 hours"],
            ["appointment", "By appointment"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={value.mode === mode}
            onClick={() => onChange({ ...value, mode })}
            className={`min-h-11 rounded-full border px-3 text-xs font-semibold transition-colors ${
              value.mode === mode
                ? "border-accent bg-accent text-white"
                : "border-border bg-background text-foreground hover:bg-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {value.mode === "weekly" ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onChange(copyMondayToWeek(value))}
            className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
          >
            Copy to all weekdays
          </button>
          {WEEKDAYS.map((day) => {
            const row = value.days[day];
            return (
              <div key={day} className="flex flex-wrap items-center gap-2">
                <span className="w-9 text-xs font-semibold text-foreground">{WEEKDAY_LABEL[day]}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.open}
                  aria-label={`${WEEKDAY_LABEL[day]} ${row.open ? "open" : "closed"}`}
                  onClick={() => onChange(setDay(value, day, { open: !row.open }))}
                  className={`min-h-11 min-w-20 rounded-lg border px-2 text-xs font-semibold ${
                    row.open
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border bg-background text-muted"
                  }`}
                >
                  {row.open ? "Open" : "Closed"}
                </button>
                {row.open
                  ? row.ranges.map((range, index) => (
                      <span key={`${day}-${index}`} className="flex items-center gap-1">
                        <input
                          type="time"
                          aria-label={`${WEEKDAY_LABEL[day]} opens`}
                          value={range.open}
                          onChange={(e) => updateRange(day, index, { open: e.target.value })}
                          className="h-11 rounded-lg border border-border bg-background px-2 text-sm"
                        />
                        <span className="text-xs text-muted">–</span>
                        <input
                          type="time"
                          aria-label={`${WEEKDAY_LABEL[day]} closes`}
                          value={range.close}
                          onChange={(e) => updateRange(day, index, { close: e.target.value })}
                          className="h-11 rounded-lg border border-border bg-background px-2 text-sm"
                        />
                        {row.ranges.length > 1 ? (
                          <button
                            type="button"
                            aria-label={`Remove ${WEEKDAY_LABEL[day]} range`}
                            onClick={() =>
                              onChange(
                                setDay(value, day, {
                                  ranges: row.ranges.filter((_, i) => i !== index),
                                }),
                              )
                            }
                            className="px-1 text-xs text-muted hover:text-foreground"
                          >
                            Remove
                          </button>
                        ) : null}
                      </span>
                    ))
                  : null}
                {row.open ? (
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        setDay(value, day, {
                          ranges: [...row.ranges, { open: "14:00", close: "18:00" }],
                        }),
                      )
                    }
                    className="text-xs font-semibold text-accent"
                  >
                    Add hours
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted">
          {value.mode === "always"
            ? "Shown as open all day, Kampala time."
            : "Customers see that visits are by appointment."}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="shop-hours-note" className="text-xs font-medium text-muted">
          Note (optional)
        </label>
        <input
          id="shop-hours-note"
          value={value.note}
          maxLength={120}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          placeholder="e.g. Kitchen closes 30 minutes early"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
    </div>
  );
}
