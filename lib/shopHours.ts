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

export type DayHours = { closed: boolean; ranges: TimeRange[] };

/** Stored on `shops.availability`. `days` is null when the schedule is unknown. */
export type ShopAvailability = {
  timezone: "Africa/Kampala";
  open_24_hours: boolean;
  by_appointment: boolean;
  note: string | null;
  legacy_text: string | null;
  days: Record<Weekday, DayHours> | null;
};

export type DayDraft = { open: boolean; ranges: TimeRange[] };

export type HoursDraft = {
  mode: "weekly" | "always" | "appointment";
  note: string;
  legacyText: string;
  /** False while the shop only has free text and the week has not been edited. */
  daysKnown: boolean;
  days: Record<Weekday, DayDraft>;
};

const DEFAULT_RANGE: TimeRange = { open: "08:00", close: "18:00" };
const KAMPALA = "Africa/Kampala";
const KAMPALA_SHIFT_MS = 3 * 60 * 60 * 1000;

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
  if (typeof value !== "string") return null;
  return DAY_INDEX[value.trim().toLowerCase()] ?? null;
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

function parseRanges(value: unknown): TimeRange[] {
  if (!Array.isArray(value)) return [];
  const ranges: TimeRange[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row) continue;
    const open = parseClock(row.open ?? row.start ?? row.from);
    const close = parseClock(row.close ?? row.end ?? row.to);
    if (open && close && open !== close) ranges.push({ open, close });
  }
  return ranges;
}

function dayFromUnknown(value: unknown): DayDraft | null {
  if (Array.isArray(value)) {
    const ranges = parseRanges(value);
    return { open: ranges.length > 0, ranges: ranges.length ? ranges : [{ ...DEFAULT_RANGE }] };
  }
  const row = asRecord(value);
  if (!row) return null;
  const ranges = parseRanges(row.ranges ?? row.slots);
  const closed = row.closed === true || row.is_closed === true;
  if (!ranges.length && !closed) {
    const open = parseClock(row.open);
    const close = parseClock(row.close);
    if (open && close && open !== close) ranges.push({ open, close });
  }
  return {
    open: !closed && ranges.length > 0,
    ranges: ranges.length ? ranges : [{ ...DEFAULT_RANGE }],
  };
}

export function blankHoursDraft(): HoursDraft {
  const days = {} as HoursDraft["days"];
  for (const day of WEEKDAYS) days[day] = { open: false, ranges: [{ ...DEFAULT_RANGE }] };
  return { mode: "weekly", note: "", legacyText: "", daysKnown: false, days };
}

function textFromUnknown(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

/** Old free-text rows, plus `{ days, hours }` objects from the previous API. */
function legacyFromAvailability(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  const row = asRecord(raw);
  if (!row) return "";
  if (typeof row.legacy_text === "string" && row.legacy_text.trim()) return row.legacy_text.trim();
  const days = typeof row.days === "string" ? row.days.trim() : "";
  const hours = typeof row.hours === "string" ? row.hours.trim() : "";
  return [days, hours].filter(Boolean).join(" · ");
}

function readDraft(raw: unknown): HoursDraft | null {
  if (typeof raw === "string") {
    const draft = blankHoursDraft();
    draft.legacyText = raw.trim();
    return draft.legacyText ? draft : null;
  }
  const row = asRecord(raw);
  if (!row) return null;
  const nested = asRecord(row.opening_hours);
  const source = nested ?? row;
  const draft = blankHoursDraft();
  const note = source.note ?? source.notes;
  if (typeof note === "string") draft.note = note.trim().slice(0, 160);
  draft.legacyText = legacyFromAvailability(raw);
  const always = source.open_24_hours === true || source.always_open === true;
  const appointment = source.by_appointment === true || source.appointment_only === true;
  const daysRaw = source.days ?? source.week ?? source.schedule;
  if (daysRaw == null || typeof daysRaw === "string") {
    if (always) draft.mode = "always";
    else if (appointment) draft.mode = "appointment";
    return draft;
  }
  if (Array.isArray(daysRaw)) {
    for (const item of daysRaw) {
      const rec = asRecord(item);
      const key = rec ? weekdayKey(rec.day ?? rec.weekday) : null;
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
  draft.daysKnown = true;
  if (always) draft.mode = "always";
  else if (appointment && !WEEKDAYS.some((day) => draft.days[day].open)) draft.mode = "appointment";
  return draft;
}

export function hoursDraftFromShop(shop: {
  availability?: unknown;
  availability_text?: string | null;
}): HoursDraft {
  const draft = readDraft(shop.availability) ?? blankHoursDraft();
  if (!draft.legacyText && shop.availability_text?.trim()) {
    draft.legacyText = shop.availability_text.trim();
  }
  return draft;
}

export function hoursAreBlank(draft: HoursDraft): boolean {
  return draft.mode === "weekly" && !draft.daysKnown && !draft.note.trim();
}

export function copyMondayToWeek(draft: HoursDraft): HoursDraft {
  const source = draft.days.mon;
  const days = { ...draft.days };
  for (const day of WEEKDAYS) {
    days[day] = { open: source.open, ranges: source.ranges.map((range) => ({ ...range })) };
  }
  return { ...draft, daysKnown: true, days };
}

function spanMinutes(range: TimeRange): [number, number] | null {
  if (!parseClock(range.open) || !parseClock(range.close)) return null;
  const start = clockMinutes(range.open);
  let end = clockMinutes(range.close);
  if (start === end) return null;
  if (end < start) end += 24 * 60;
  return [start, end];
}

/** Same overlap rule as the API: a close before open crosses midnight. */
export function hoursDraftError(draft: HoursDraft): string | null {
  if (draft.note.trim().length > 160) return "Note must be 160 characters or fewer.";
  if (draft.mode !== "weekly" || !draft.daysKnown) return null;
  for (const day of WEEKDAYS) {
    const row = draft.days[day];
    if (!row.open) continue;
    const spans: [number, number][] = [];
    for (const range of row.ranges) {
      if (!range.open || !range.close) continue;
      if (range.open === range.close) {
        return `${WEEKDAY_LABEL[day]} has a range that starts and ends at the same time.`;
      }
      const span = spanMinutes(range);
      if (span) spans.push(span);
    }
    spans.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < spans.length; i += 1) {
      if (spans[i][0] < spans[i - 1][1]) {
        return `${WEEKDAY_LABEL[day]} has overlapping hours.`;
      }
    }
  }
  return null;
}

export function shopHoursWritePayload(draft: HoursDraft): { availability: ShopAvailability } {
  const note = draft.note.trim().slice(0, 160) || null;
  const legacy_text = draft.legacyText.trim() || null;
  if (draft.mode === "always") {
    return {
      availability: {
        timezone: KAMPALA,
        open_24_hours: true,
        by_appointment: false,
        note,
        legacy_text,
        days: null,
      },
    };
  }
  if (draft.mode === "appointment" || !draft.daysKnown) {
    return {
      availability: {
        timezone: KAMPALA,
        open_24_hours: false,
        by_appointment: draft.mode === "appointment",
        note,
        legacy_text,
        days: null,
      },
    };
  }
  const days = {} as Record<Weekday, DayHours>;
  for (const day of WEEKDAYS) {
    const row = draft.days[day];
    const ranges = row.open
      ? row.ranges.filter((range) => range.open && range.close && range.open !== range.close)
      : [];
    days[day] = { closed: !row.open || ranges.length === 0, ranges: row.open ? ranges : [] };
  }
  return {
    availability: {
      timezone: KAMPALA,
      open_24_hours: false,
      by_appointment: false,
      note,
      legacy_text,
      days,
    },
  };
}

type KampalaNow = { dayStamp: number; minutes: number; weekday: Weekday };

function kampalaNow(now: Date): KampalaNow {
  const shifted = new Date(now.getTime() + KAMPALA_SHIFT_MS);
  const utcDay = shifted.getUTCDay();
  return {
    dayStamp: Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    weekday: WEEKDAYS[utcDay === 0 ? 6 : utcDay - 1],
  };
}

function weekdayFromStamp(stamp: number): Weekday {
  const utcDay = new Date(stamp).getUTCDay();
  return WEEKDAYS[utcDay === 0 ? 6 : utcDay - 1];
}

function formatClock(totalMinutes: number): string {
  const mins = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function localNextChange(draft: HoursDraft, now: Date): { open: boolean | null; next: string | null } {
  if (draft.mode === "always") return { open: true, next: "Open 24 hours" };
  if (!draft.daysKnown) {
    return draft.mode === "appointment"
      ? { open: null, next: "By appointment" }
      : { open: null, next: null };
  }
  const here = kampalaNow(now);
  const nowMs = here.dayStamp + here.minutes * 60_000;
  const intervals: { begin: number; end: number }[] = [];
  for (let offset = -1; offset <= 7; offset += 1) {
    const dayStamp = here.dayStamp + offset * 86_400_000;
    const spec = draft.days[weekdayFromStamp(dayStamp)];
    if (!spec.open) continue;
    for (const range of spec.ranges) {
      const span = spanMinutes(range);
      if (!span) continue;
      const begin = dayStamp + span[0] * 60_000;
      const end = dayStamp + span[1] * 60_000;
      intervals.push({ begin, end });
    }
  }
  intervals.sort((a, b) => a.begin - b.begin);
  for (const interval of intervals) {
    if (interval.begin <= nowMs && nowMs < interval.end) {
      const endStamp = Date.UTC(
        new Date(interval.end).getUTCFullYear(),
        new Date(interval.end).getUTCMonth(),
        new Date(interval.end).getUTCDate(),
      );
      const clock = formatClock(Math.floor((interval.end - endStamp) / 60_000));
      if (endStamp === here.dayStamp) return { open: true, next: `Closes ${clock}` };
      return { open: true, next: `Closes ${WEEKDAY_LABEL[weekdayFromStamp(endStamp)]} ${clock}` };
    }
  }
  for (const interval of intervals) {
    if (interval.begin > nowMs) {
      const stamp = Date.UTC(
        new Date(interval.begin).getUTCFullYear(),
        new Date(interval.begin).getUTCMonth(),
        new Date(interval.begin).getUTCDate(),
      );
      const clock = formatClock(Math.floor((interval.begin - stamp) / 60_000));
      return { open: false, next: `Opens ${WEEKDAY_LABEL[weekdayFromStamp(stamp)]} ${clock}` };
    }
  }
  if (draft.mode === "appointment") return { open: false, next: "By appointment" };
  return { open: false, next: null };
}

function statusLine(open: boolean | null, next: string | null): string | null {
  if (next === "Open 24 hours" || next === "By appointment") return next;
  if (open === true) return next ? `Open now · ${next}` : "Open now";
  if (open === false) return next ? `Closed · ${next}` : "Closed";
  return null;
}

export type ShopHoursView = {
  status: string | null;
  week: { label: string; value: string }[];
  note: string | null;
};

function weekLines(draft: HoursDraft): { label: string; value: string }[] {
  if (!draft.daysKnown && draft.mode === "weekly") return [];
  return WEEKDAYS.map((day) => {
    if (draft.mode === "always") return { label: WEEKDAY_LABEL[day], value: "Open 24 hours" };
    if (draft.mode === "appointment") return { label: WEEKDAY_LABEL[day], value: "By appointment" };
    const ranges = draft.days[day].open
      ? draft.days[day].ranges.filter((range) => range.open && range.close && range.open !== range.close)
      : [];
    return {
      label: WEEKDAY_LABEL[day],
      value: ranges.length ? ranges.map((range) => `${range.open}–${range.close}`).join(", ") : "Closed",
    };
  });
}

export function describeShopHours(
  shop: {
    availability?: unknown;
    availability_text?: string | null;
    is_open_now?: boolean | null;
    next_change?: string | null;
  },
  now = new Date(),
): ShopHoursView {
  const draft = hoursDraftFromShop(shop);
  const note = draft.note.trim() || null;
  const freeText = shop.availability_text?.trim() || draft.legacyText || null;
  const serverSent = shop.is_open_now !== undefined || shop.next_change !== undefined;
  if (!draft.daysKnown && draft.mode !== "always") {
    if (serverSent && (shop.next_change === "Open 24 hours" || shop.next_change === "By appointment")) {
      return { status: shop.next_change, week: [], note };
    }
    if (draft.mode === "appointment") return { status: "By appointment", week: [], note };
    return { status: freeText, week: [], note };
  }
  if (serverSent) {
    const next = shop.next_change ?? null;
    const open = shop.is_open_now ?? null;
    return { status: statusLine(open, next) ?? freeText, week: weekLines(draft), note };
  }
  const local = localNextChange(draft, now);
  return { status: statusLine(local.open, local.next) ?? freeText, week: weekLines(draft), note };
}
