import { ApiError, apiFetch } from "./base";

export type FeatureSwitch = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  updated_by?: string | null;
  updated_at?: string | null;
};

const KNOWN: Record<string, { label: string; description: string }> = {
  analytics: {
    label: "Analytics",
    description: "Seller analytics on shop pages and the merchant dashboard.",
  },
};

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
  };
}

export function parseFeatureSwitches(data: unknown): FeatureSwitch[] {
  const root = asRecord(data);
  const bag = root?.switches ?? root?.items ?? root?.settings ?? root?.features ?? data;
  const out: FeatureSwitch[] = [];
  if (Array.isArray(bag)) {
    for (const item of bag) {
      const row = asRecord(item);
      if (!row) continue;
      const key = String(row.key ?? row.id ?? row.name ?? "").trim();
      const parsed = switchFrom(key, row);
      if (parsed) out.push(parsed);
    }
    return out;
  }
  const record = asRecord(bag);
  if (!record) return out;
  for (const [key, value] of Object.entries(record)) {
    if (key === "detail" || key === "code" || key === "updated_at" || key === "updated_by") continue;
    const parsed = switchFrom(key, value);
    if (parsed) out.push(parsed);
  }
  return out;
}

export function parsePublicSettings(data: unknown): { analytics: boolean; flags: Record<string, boolean> } {
  const switches = parseFeatureSwitches(data);
  const flags: Record<string, boolean> = {};
  for (const item of switches) flags[item.key] = item.enabled;
  const root = asRecord(data);
  const direct = enabledOf(root?.analytics);
  if (direct != null && flags.analytics == null) flags.analytics = direct;
  return { analytics: flags.analytics === true, flags };
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

export async function getPublicSettings(): Promise<{ analytics: boolean; flags: Record<string, boolean> }> {
  try {
    const data = await apiFetch<unknown>("/api/v1/settings/public");
    return parsePublicSettings(data);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      return { analytics: false, flags: { analytics: false } };
    }
    throw err;
  }
}
