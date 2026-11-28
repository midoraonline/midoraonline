import { ApiError, apiErrorMessage } from "@/lib/api/base";

export const MAINTENANCE_MESSAGE =
  "Midora is under maintenance. For now, you can't open shops, post listings or make edits. You can still mark a listing sold or closed.";

export const SIGNUPS_CLOSED_MESSAGE =
  "New accounts are paused right now. If you already have an account, sign in instead.";

export const STOCK_REQUIRED_MESSAGE =
  "Add a stock quantity greater than 0 to put this product back on the feed.";

export const ANALYTICS_OFF_MESSAGE = "Analytics is turned off right now.";

export function isMaintenanceMode(err: unknown): boolean {
  return err instanceof ApiError && err.code === "maintenance_mode";
}

export function isSignupsClosed(err: unknown): boolean {
  return err instanceof ApiError && err.code === "signups_closed";
}

export function isStockRequired(err: unknown): boolean {
  return err instanceof ApiError && err.code === "stock_required";
}

export function isAnalyticsDisabledError(err: unknown): boolean {
  return err instanceof ApiError && err.code === "analytics_disabled";
}

/** Raw browser/server text that must never reach the screen. */
const TECHNICAL_ERROR =
  /^HTTP \d+|^Request failed|internal server error|failed to fetch|network ?error|load failed|undefined|null|exception|unexpected token|\bJSON\b/i;

export function platformActionMessage(err: unknown, fallback: string): string {
  if (isMaintenanceMode(err)) return MAINTENANCE_MESSAGE;
  if (isSignupsClosed(err)) return SIGNUPS_CLOSED_MESSAGE;
  if (isStockRequired(err)) return STOCK_REQUIRED_MESSAGE;
  if (isAnalyticsDisabledError(err)) return ANALYTICS_OFF_MESSAGE;
  if (err instanceof ApiError) return apiErrorMessage(err, fallback);
  if (err instanceof Error && err.message.trim() && !TECHNICAL_ERROR.test(err.message)) return err.message;
  return fallback;
}
