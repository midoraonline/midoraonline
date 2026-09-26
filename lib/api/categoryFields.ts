import { ApiError, apiFetch } from "./base";
import type { CategoryMetaField } from "@/lib/listingMeta";

export type CategoryFieldsResponse = {
  slug: string;
  label: string;
  parent_slug?: string | null;
  fields: CategoryMetaField[];
};

export type MissingListingField = { key: string; label: string };

/** True when the per-field routes are not deployed yet (404/405), not a real field miss. */
export function isFieldsRouteMissing(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 405) return true;
  if (err.status !== 404) return false;
  const code = err.code || "";
  return code !== "field_not_found" && code !== "category_not_found" && code !== "inherited_field";
}

/** Merged fields for Post Item. Null when this route is not deployed or the category is unknown. */
export async function fetchCategoryFields(
  identifier: string,
): Promise<CategoryFieldsResponse | null> {
  try {
    return await apiFetch<CategoryFieldsResponse>(
      `/api/v1/categories/${encodeURIComponent(identifier)}/fields`,
    );
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) return null;
    throw err;
  }
}

function errorBody(err: unknown): { code: string; data: Record<string, unknown> } | null {
  if (!(err instanceof ApiError) || err.status !== 422) return null;
  const data = (err.data ?? {}) as Record<string, unknown>;
  const nested =
    data.detail && typeof data.detail === "object"
      ? (data.detail as Record<string, unknown>)
      : null;
  const code = String(data.code || nested?.code || err.code || "");
  return { code, data: { ...nested, ...data } };
}

export function mediaUnreachableMessage(err: unknown): string | null {
  const body = errorBody(err);
  if (!body || body.code !== "media_unreachable") return null;
  const detail = body.data.detail;
  if (typeof detail === "string" && detail.trim() && detail !== "media_unreachable") {
    return detail.trim();
  }
  return "A photo on this listing could not be opened. Remove it and upload the photo again.";
}

export function missingListingFields(err: unknown): MissingListingField[] | null {
  const body = errorBody(err);
  if (!body || body.code !== "listing_fields_required") return null;
  const data = body.data;
  const raw = data.missing_fields;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { key?: unknown; label?: unknown };
    const key = String(row.key ?? "").trim();
    if (!key) return [];
    return [{ key, label: String(row.label ?? key) }];
  });
}

function fieldPath(slug: string, key?: string): string {
  const base = `/api/v1/admin/settings/categories/${encodeURIComponent(slug)}/fields`;
  return key ? `${base}/${encodeURIComponent(key)}` : base;
}

export function addCategoryField(slug: string, body: CategoryMetaField) {
  return apiFetch(fieldPath(slug), { method: "POST", body });
}

export function updateCategoryField(
  slug: string,
  key: string,
  body: Partial<CategoryMetaField>,
) {
  return apiFetch(fieldPath(slug, key), { method: "PATCH", body });
}

export function deleteCategoryField(slug: string, key: string) {
  return apiFetch(fieldPath(slug, key), { method: "DELETE" });
}

export function reorderCategoryFields(slug: string, keys: string[]) {
  return apiFetch(`${fieldPath(slug)}/order`, { method: "PUT", body: { keys } });
}
