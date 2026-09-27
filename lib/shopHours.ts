export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export type TimeRange = { open: string; close: string };

export type OpeningHours = {
  timezone?: string;
  open_24_hours?: boolean;
  by_appointment?: boolean;
  note?: string | null;
  days?: Partial<Record<Weekday, TimeRange[]>>;
};

export type DayDraft = { open: boolean; ranges: TimeRange[] };

export type HoursDraft = {
  mode: "weekly" | "always" | "appointment";
  note: string;
  days: Record<Weekday, DayDraft>;
};

const DEFAULT_RANGE: TimeRange = { open: "08:00", close: "18:00" };
const KAMPALA = "Africa/Kampala";

const DAY_INDEX: Record<string, Weekday> = {
  mon: "mon",
  monday: "mon",
  tue: "tue",
  tues: "tue",
  tuesday: "tue",
  wed: "wed",
  wednesday: "wed",
  thu: "thu",
  thur: "thu",
  thurs: "thu",
  thursday: "thu",
  fri: "fri",
  friday: "fri",
  sat: "sat",
  saturday: "sat",
  sun: "sun",
  sunday: "sun",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function weekdayKey(value: unknown): Weekday | null {
  if (typeof value === "number" && value >= 0 && value <= 6) {
    return WEEKDAYS[value === 0 ? 6 : value - 1] ?? null;
  }
  if (typeof value !== "string") return null;
  return DAY_INDEX[value.trim().toLowerCase().slice(0, 9)] ?? null;
}

export function parseClock(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function clockMinutes(clock: string): number {
  const [hour, minute] = clock.split(":").map(Number);
  return hour * 60 + minute;
}

function formatMinutes(total: number): string {
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseRanges(value: unknown): TimeRange[] {
  if (!Array.isArray(value)) return [];
  const ranges: TimeRange[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row) continue;
    const open = parseClock(row.open ?? row.start ?? row.from);
    const close = parseClock(row.close ?? row.end ?? row.to);
    if (open && close && close > open) ranges.push({ open, close });
  }
  return ranges;
}

function dayFromUnknown(value: unknown): DayDraft | null {
  if (Array.isArray(value)) {
    const ranges = parseRanges(value);
    return {
      open: ranges.length > 0,
      ranges: ranges.length ? ranges : [{ ...DEFAULT_RANGE }],
    };
  }
  const row = asRecord(value);
  if (!row) return null;
  const ranges = parseRanges(row.ranges ?? row.slots ?? row.hours ?? row.periods);
  if (!ranges.length) {
    const open = parseClock(row.open ?? row.start);
    const close = parseClock(row.close ?? row.end);
    if (open && close && close > open) ranges.push({ open, close });
  }
  const closed = row.closed === true || row.is_closed === true || row.open === false;
  return {
    open: !closed && ranges.length > 0,
    ranges: ranges.length ? ranges : [{ ...DEFAULT_RANGE }],
  };
}

export function blankHoursDraft(): HoursDraft {
  const days = {} as HoursDraft["days"];
  for (const day of WEEKDAYS) {
    days[day] = { open: false, ranges: [{ ...DEFAULT_RANGE }] };
  }
  return { mode: "weekly", note: "", days };
}

function flag(row: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => row[key] === true);
}

/** Accept the new JSON shape and a few nearby spellings the API may ship. */
export function readOpeningHours(raw: unknown): HoursDraft | null {
  if (typeof raw === "string" && raw.trim()) {
    const draft = blankHoursDraft();
    draft.note = raw.trim().slice(0, 160);
    return draft;
  }
  const row = asRecord(raw);
  if (!row) return null;
  const draft = blankHoursDraft();
  const note = row.note ?? row.notes;
  if (typeof note === "string") draft.note = note.trim().slice(0, 160);
  const always = flag(row, ["open_24_hours", "always_open", "is_24_hours"]);
  const appointment = flag(row, ["by_appointment", "appointment_only"]);
  const daysRaw = row.days ?? row.week ?? row.schedule;
  if (Array.isArray(daysRaw)) {
    for (const item of daysRaw) {
      const rec = asRecord(item);
      if (!rec) continue;
      const key = weekdayKey(rec.day ?? rec.weekday ?? rec.dow);
      const parsed = key ? dayFromUnknown(rec) : null;
      if (key && parsed) draft.days[key] = parsed;
    }
  } else {
    const days = asRecord(daysRaw);
    if (days) {
      for (const [key, value] of Object.entries(days)) {
        const day = weekdayKey(key);
        const parsed = day ? dayFromUnknown(value) : null;
        if (day && parsed) draft.days[day] = parsed;
      }
    }
  }
  const scheduled = WEEKDAYS.some((day) => draft.days[day].open);
  if (always) draft.mode = "always";
  else if (appointment && !scheduled) draft.mode = "appointment";
  return draft;
}

export function hoursDraftFromShop(shop: {
  opening_hours?: unknown;
  availability?: {
    days?: string | null;
    hours?: string | null;
    opening_hours?: unknown;
  } | null;
}): HoursDraft {
  const structured =
    readOpeningHours(shop.opening_hours) ??
    readOpeningHours(shop.availability?.opening_hours);
  const draft = structured ?? blankHoursDraft();
  const hasSchedule =
    draft.mode !== "weekly" || WEEKDAYS.some((day) => draft.days[day].open);
  if (!hasSchedule && !draft.note) {
    const text = [shop.availability?.days, shop.availability?.hours]
      .filter((part) => typeof part === "string" && part.trim())
      .join(" · ");
    if (text) draft.note = text.slice(0, 160);
  }
  return draft;
}

export function hoursAreBlank(draft: HoursDraft): boolean {
  return (
    draft.mode === "weekly" &&
    !draft.note.trim() &&
    WEEKDAYS.every((day) => !draft.days[day].open)
  );
}

export function copyMondayToWeek(draft: HoursDraft): HoursDraft {
  const source = draft.days.mon;
  const days = { ...draft.days };
  for (const day of WEEKDAYS) {
    days[day] = {
      open: source.open,
      ranges: source.ranges.map((range) => ({ ...range })),
    };
  }
  return { ...draft, days };
}

function validRanges(ranges: TimeRange[]): TimeRange[] {
  return ranges.filter((range) => range.open && range.close && range.close > range.open);
}

export function toOpeningHours(draft: HoursDraft): OpeningHours {
  const note = draft.note.trim() || null;
  if (draft.mode === "always") {
    return { timezone: KAMPALA, open_24_hours: true, note };
  }
  if (draft.mode === "appointment") {
    return { timezone: KAMPALA, by_appointment: true, note };
  }
  const days: OpeningHours["days"] = {};
  for (const day of WEEKDAYS) {
    const row = draft.days[day];
    days[day] = row.open ? validRanges(row.ranges) : [];
  }
  return { timezone: KAMPALA, note, days };
}

function joinNote(body: string, note: string): string {
  const extra = note.trim();
  if (!extra || body.includes(extra)) return body;
  return `${body} · ${extra}`;
}

export function summarizeHours(draft: HoursDraft): string | null {
  if (draft.mode === "always") return joinNote("Open 24 hours", draft.note);
  if (draft.mode === "appointment") return joinNote("By appointment", draft.note);
  const parts: string[] = [];
  let index = 0;
  while (index < WEEKDAYS.length) {
    const day = WEEKDAYS[index];
    const row = draft.days[day];
    const ranges = row.open ? validRanges(row.ranges) : [];
    if (!ranges.length) {
      index += 1;
      continue;
    }
    const key = ranges.map((range) => `${range.open}-${range.close}`).join(",");
    let end = index;
    while (end + 1 < WEEKDAYS.length) {
      const next = draft.days[WEEKDAYS[end + 1]];
      const nextKey = next.open
        ? validRanges(next.ranges).map((range) => `${range.open}-${range.close}`).join(",")
        : "";
      if (nextKey !== key) break;
      end += 1;
    }
    const label =
      end === index
        ? WEEKDAY_LABEL[day]
        : `${WEEKDAY_LABEL[day]}–${WEEKDAY_LABEL[WEEKDAYS[end]]}`;
    const hours = ranges.map((range) => `${range.open}–${range.close}`).join(", ");
    parts.push(`${label} ${hours}`);
    index = end + 1;
  }
  if (!parts.length) return draft.note.trim() || null;
  return joinNote(parts.join("; "), draft.note);
}

export function shopHoursWritePayload(draft: HoursDraft): {
  opening_hours: OpeningHours;
  availability: {
    days: null;
    hours: string | null;
    opening_hours: OpeningHours;
  };
} {
  const opening_hours = toOpeningHours(draft);
  return {
    opening_hours,
    availability: {
      days: null,
      hours: summarizeHours(draft),
      opening_hours,
    },
  };
}

function kampalaNow(now: Date): { day: Weekday; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: KAMPALA,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const day = weekdayKey(parts.weekday) ?? "mon";
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  return {
    day,
    minutes: (Number.isFinite(hour) ? hour % 24 : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
  };
}

function clockInKampala(value: string): string | null {
  const direct = parseClock(value);
  if (direct && value.trim().length <= 5) return direct;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return direct;
  return formatMinutes(kampalaNow(date).minutes);
}

function clauseFromNext(next: unknown, open: boolean): string | null {
  if (typeof next === "string") {
    const clock = clockInKampala(next);
    return clock ? (open ? `Closes ${clock}` : `Opens ${clock}`) : null;
  }
  const row = asRecord(next);
  if (!row) return null;
  const action = String(row.action ?? row.kind ?? row.type ?? "").toLowerCase();
  const at = row.at ?? row.time ?? row.when ?? row.datetime;
  const clock = typeof at === "string" ? clockInKampala(at) : null;
  const day = weekdayKey(row.weekday ?? row.day);
  const closes = action.startsWith("close");
  if (!clock) return null;
  if (closes || (open && !action.startsWith("open"))) return `Closes ${clock}`;
  if (day) return `Opens ${WEEKDAY_LABEL[day]} ${clock}`;
  return `Opens ${clock}`;
}

function localClause(draft: HoursDraft, now: Date): { open: boolean; clause: string | null } {
  if (draft.mode === "always") return { open: true, clause: null };
  if (draft.mode === "appointment") return { open: false, clause: null };
  const { day, minutes } = kampalaNow(now);
  const start = WEEKDAYS.indexOf(day);
  const today = draft.days[day];
  if (today.open) {
    for (const range of validRanges(today.ranges)) {
      if (minutes >= clockMinutes(range.open) && minutes < clockMinutes(range.close)) {
        return { open: true, clause: `Closes ${range.close}` };
      }
    }
    const later = validRanges(today.ranges).find((range) => clockMinutes(range.open) > minutes);
    if (later) return { open: false, clause: `Opens ${later.open}` };
  }
  for (let step = 1; step <= 7; step += 1) {
    const next = WEEKDAYS[(start + step) % 7];
    const row = draft.days[next];
    const first = row.open ? validRanges(row.ranges)[0] : undefined;
    if (first) return { open: false, clause: `Opens ${WEEKDAY_LABEL[next]} ${first.open}` };
  }
  return { open: false, clause: null };
}

export type ShopHoursView = {
  status: string | null;
  week: { label: string; value: string }[];
  note: string | null;
};

function weekLines(draft: HoursDraft): { label: string; value: string }[] {
  return WEEKDAYS.map((day) => {
    if (draft.mode === "always") return { label: WEEKDAY_LABEL[day], value: "Open 24 hours" };
    if (draft.mode === "appointment") return { label: WEEKDAY_LABEL[day], value: "By appointment" };
    const ranges = draft.days[day].open ? validRanges(draft.days[day].ranges) : [];
    return {
      label: WEEKDAY_LABEL[day],
      value: ranges.length
        ? ranges.map((range) => `${range.open}–${range.close}`).join(", ")
        : "Closed",
    };
  });
}

export function describeShopHours(
  shop: {
    opening_hours?: unknown;
    is_open_now?: boolean | null;
    next_change?: unknown;
    availability?: {
      days?: string | null;
      hours?: string | null;
      opening_hours?: unknown;
      is_open_now?: boolean | null;
      next_change?: unknown;
    } | null;
  },
  now = new Date(),
): ShopHoursView {
  const opening = shop.opening_hours ?? shop.availability?.opening_hours;
  const draft = readOpeningHours(opening);
  const freeText = [shop.availability?.days, shop.availability?.hours]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" · ");
  const explicitDays = Boolean(
    asRecord(opening)?.days ?? asRecord(opening)?.week ?? asRecord(opening)?.schedule,
  );
  const hasWeek =
    draft != null &&
    (draft.mode !== "weekly" || WEEKDAYS.some((day) => draft.days[day].open) || explicitDays);
  const apiOpen = shop.is_open_now ?? shop.availability?.is_open_now;
  if (!draft || !hasWeek) {
    if (typeof apiOpen === "boolean") {
      const clause = clauseFromNext(shop.next_change ?? shop.availability?.next_change, apiOpen);
      return {
        status: apiOpen
          ? clause ? `Open now · ${clause}` : "Open now"
          : clause ? `Closed · ${clause}` : "Closed",
        week: [],
        note: draft?.note.trim() || null,
      };
    }
    return { status: freeText || draft?.note || null, week: [], note: null };
  }

  const local = localClause(draft, now);
  const open = typeof apiOpen === "boolean" ? apiOpen : local.open;
  const apiClause = clauseFromNext(shop.next_change ?? shop.availability?.next_change, open);
  const clause = apiClause ?? (typeof apiOpen === "boolean" && apiOpen !== local.open ? null : local.clause);

  let status: string;
  if (draft.mode === "always") status = "Open 24 hours";
  else if (draft.mode === "appointment") status = "By appointment";
  else if (open) status = clause ? `Open now · ${clause}` : "Open now";
  else status = clause ? `Closed · ${clause}` : "Closed";

  return {
    status,
    week: weekLines(draft),
    note: draft.note.trim() || null,
  };
}
