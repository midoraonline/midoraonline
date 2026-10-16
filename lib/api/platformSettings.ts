import { ApiError, apiFetch } from "./base";

export type MediaLimits = { maxPhotos: number; maxVideos: number };
export const DEFAULT_MEDIA_LIMITS: MediaLimits = { maxPhotos: 3, maxVideos: 1 };
export const MEDIA_LIMITS_KEY = "listing_media_limits";
export const PLAN_KEYS = ["basic", "standard", "premium"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];
export const PLAN_LABEL: Record<PlanKey, string> = { basic: "Basic", standard: "Standard", premium: "Premium" };
export type PlanMediaLimits = { default: MediaLimits; plans: Record<PlanKey, MediaLimits> };

export function parsePlanMediaLimits(raw: unknown): PlanMediaLimits {
  const row = asRecord(raw) ?? {};
  const hasNested = "default" in row || "plans" in row;
  const def = parseMediaLimits(hasNested ? row.default : row);
  const plansRaw = asRecord(row.plans) ?? {};
  const plans = Object.fromEntries(
    PLAN_KEYS.map((k) => [k, plansRaw[k] ? { ...def, ...parseMediaLimits(plansRaw[k]) } : def]),
  ) as Record<PlanKey, MediaLimits>;
  return { default: def, plans };
}

/** Limits for a plan; unknown/missing plan uses Basic, then the default. */
export function limitsForPlan(all: PlanMediaLimits, plan?: string | null): MediaLimits {
  const key = (plan ?? "basic").toLowerCase() as PlanKey;
  return all.plans[key] ?? all.plans.basic ?? all.default;
}

export type FeatureSwitch = {
  key: string;
  value?: Record<string, unknown>;
  label: string;
  description: string;
  enabled: boolean;
  updated_by?: string | null;
  updated_at?: string | null;
};

const KNOWN: Record<string, { label: string; description: string }> = {
  analytics: {
    label: "Analytics",
    description: "Seller and admin analytics. Off stops new events and hides analytics.",
  },
  analytics_all_plans: {
    label: "Analytics for all plans",
    description: "Every subscription, including Basic, gets shop analytics. Needs Analytics on.",
  },
  signups_allowed: {
    label: "Sign-ups",
    description: "New email and Google accounts. Existing sign-in still works when this is off.",
  },
  listings_require_review: {
    label: "Listings need review",
    description: "Clean listings stay in review instead of going live immediately.",
  },
  ai_moderation: {
    label: "AI moderation",
    description: "Gemini and OpenAI checks on listings. Basic checks still run when this is off.",
  },
  maintenance_mode: {
    label: "Maintenance",
    description: "Pauses new shops, new listings, and edits. Marking a listing sold or closed still works.",
  },
};

const SWITCH_ORDER = [
  "analytics",
  "analytics_all_plans",
  "signups_allowed",
  "listings_require_review",
  "ai_moderation",
  "maintenance_mode",
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function enabledOf(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const row = asRecord(value);
  if (!row || !("enabled" in row)) return null;
  return Boolean(row.enabled);
}

function labelOf(key: string, row: Record<string, unknown>): string {
  const label = row.label ?? row.name ?? row.title;
  if (typeof label === "string" && label.trim()) return label.trim();
  return KNOWN[key]?.label ?? key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function switchFrom(key: string, value: unknown): FeatureSwitch | null {
  const row = asRecord(value);
  const enabled = row ? enabledOf(row) ?? enabledOf(row.value) : enabledOf(value);
  if (!key || enabled == null) return null;
  const source = row ?? {};
  const description =
    typeof source.description === "string" && source.description.trim()
      ? source.description.trim()
      : KNOWN[key]?.description ?? "";
  const updatedBy = source.updated_by ?? source.updatedBy ?? source.changed_by;
  const updatedAt = source.updated_at ?? source.updatedAt ?? source.changed_at;
  return {
    key,
    label: labelOf(key, source),
    description,
    enabled,
    updated_by: typeof updatedBy === "string" && updatedBy.trim() ? updatedBy : null,
    updated_at: typeof updatedAt === "string" && updatedAt.trim() ? updatedAt : null,
    value: asRecord(source.value) ?? undefined,
  };
}

function intOr(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export function parseMediaLimits(raw: unknown): MediaLimits {
  const row = asRecord(raw);
  if (!row) return DEFAULT_MEDIA_LIMITS;
  return {
    maxPhotos: Math.max(1, intOr(row.max_photos ?? row.maxPhotos, DEFAULT_MEDIA_LIMITS.maxPhotos)),
    maxVideos: Math.max(0, intOr(row.max_videos ?? row.maxVideos, DEFAULT_MEDIA_LIMITS.maxVideos)),
  };
}

const pairOut = (l: MediaLimits) => ({ max_photos: l.maxPhotos, max_videos: l.maxVideos });

export function planMediaLimitsValue(all: PlanMediaLimits) {
  return {
    default: pairOut(all.default),
    plans: Object.fromEntries(PLAN_KEYS.map((k) => [k, pairOut(all.plans[k])])),
  };
}

export async function updatePlanMediaLimits(all: PlanMediaLimits): Promise<PlanMediaLimits> {
  const data = await apiFetch<unknown>("/api/v1/admin/settings", {
    method: "PATCH",
    body: { key: MEDIA_LIMITS_KEY, value: planMediaLimitsValue(all) },
  });
  const found = parseFeatureSwitches(data).find((item) => item.key === MEDIA_LIMITS_KEY);
  return found?.value ? parsePlanMediaLimits(found.value) : all;
}

export function parseFeatureSwitches(data: unknown): FeatureSwitch[] {
  const root = asRecord(data);
  const bag = root?.switches ?? root?.items ?? root?.settings ?? root?.features ?? root?.flags ?? data;
  const out: FeatureSwitch[] = [];
  if (Array.isArray(bag)) {
    for (const item of bag) {
      const row = asRecord(item);
      if (!row) continue;
      const key = String(row.key ?? row.id ?? row.name ?? "").trim();
      const parsed = switchFrom(key, row);
      if (parsed) out.push(parsed);
    }
    return sortSwitches(out);
  }
  const record = asRecord(bag);
  if (!record) return out;
  for (const [key, value] of Object.entries(record)) {
    if (key === "detail" || key === "code" || key === "updated_at" || key === "updated_by") continue;
    const parsed = switchFrom(key, value);
    if (parsed) out.push(parsed);
  }
  return sortSwitches(out);
}

function sortSwitches(items: FeatureSwitch[]): FeatureSwitch[] {
  return [...items].sort((a, b) => {
    const ai = SWITCH_ORDER.indexOf(a.key);
    const bi = SWITCH_ORDER.indexOf(b.key);
    return (ai === -1 ? SWITCH_ORDER.length : ai) - (bi === -1 ? SWITCH_ORDER.length : bi);
  });
}

export type PublicSettings = {
  analytics: boolean;
  flags: Record<string, boolean>;
  limits: MediaLimits;
  planLimits: PlanMediaLimits;
};

export function parsePublicSettings(data: unknown): PublicSettings {
  const switches = parseFeatureSwitches(data);
  const flags: Record<string, boolean> = {};
  for (const item of switches) flags[item.key] = item.enabled;
  const root = asRecord(data);
  const direct = enabledOf(root?.analytics);
  if (direct != null && flags.analytics == null) flags.analytics = direct;
  const limits = parseMediaLimits(root?.limits);
  const planLimits = parsePlanMediaLimits({ default: root?.limits, plans: root?.plan_limits });
  return { analytics: flags.analytics === true, flags, limits, planLimits };
}

export async function listAdminSwitches(): Promise<FeatureSwitch[]> {
  const data = await apiFetch<unknown>("/api/v1/admin/settings");
  return parseFeatureSwitches(data);
}

export async function updateAdminSwitch(key: string, enabled: boolean): Promise<FeatureSwitch> {
  const data = await apiFetch<unknown>("/api/v1/admin/settings", {
    method: "PATCH",
    body: { key, enabled },
  });
  const list = parseFeatureSwitches(data);
  const found = list.find((item) => item.key === key);
  if (found) return found;
  const one = switchFrom(key, data) ?? switchFrom(key, { key, enabled, ...(asRecord(data) ?? {}) });
  if (one) return { ...one, enabled };
  return {
    key,
    enabled,
    label: KNOWN[key]?.label ?? key,
    description: KNOWN[key]?.description ?? "",
  };
}

export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const data = await apiFetch<unknown>("/api/v1/settings/public");
    return parsePublicSettings(data);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      return { analytics: false, flags: { analytics: false }, limits: DEFAULT_MEDIA_LIMITS, planLimits: parsePlanMediaLimits(null) };
    }
    throw err;
  }
}
