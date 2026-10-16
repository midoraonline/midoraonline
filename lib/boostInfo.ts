/** Active boost as returned by the API (feed cards, product detail, promote, /listings/boosts). */
export type BoostInfo = {
  id?: string | null;
  listing_id?: string | null;
  package_name?: string | null;
  source?: string | null;
  source_label?: string | null;
  scope?: "shop" | "listing" | null;
  shop_id?: string | null;
  score_bonus?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

const SOURCE: Record<string, string> = { admin: "Admin", plan_allowance: "Plan", paid: "Paid" };

export function boostEndsLabel(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return (
    d.toLocaleString("en-US", {
      timeZone: "Africa/Kampala",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }) + " EAT"
  );
}

export function boostTimeLeft(iso?: string | null, now = Date.now()): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h >= 1) return `${h}h ${m}m left`;
  return `${Math.max(1, m)}m left`;
}

export function boostPackageLabel(b: BoostInfo): string {
  const name = (b.package_name ?? "").trim();
  return !name || name === "Custom" ? "Custom" : name;
}

export function boostSourceLabel(b: BoostInfo): string {
  return b.source_label ?? SOURCE[b.source ?? ""] ?? "Paid";
}

export function boostScopeLabel(b: BoostInfo): string {
  return b.scope === "shop" || b.shop_id ? "Business boost" : "Listing boost";
}

/** e.g. "3 days · Business boost · Admin · ends Oct 19, 2:00 PM EAT (2d 3h left)" */
export function describeBoost(b: BoostInfo): string {
  const ends = boostEndsLabel(b.ends_at);
  const left = boostTimeLeft(b.ends_at);
  return [
    boostPackageLabel(b),
    boostScopeLabel(b),
    boostSourceLabel(b),
    ends ? `ends ${ends}${left ? ` (${left})` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
