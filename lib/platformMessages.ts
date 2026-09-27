import { ApiError } from "@/lib/api/base";

export const MAINTENANCE_MESSAGE =
  "Midora is in maintenance. New shops, new listings, and edits are paused. You can still mark a listing sold or closed.";

export const SIGNUPS_CLOSED_MESSAGE =
  "New accounts are paused right now. If you already have an account, sign in instead.";

export const STOCK_REQUIRED_MESSAGE =
  "Add a stock quantity greater than 0 to put this product back on the feed.";

export const ANALYTICS_OFF_MESSAGE = "Analytics is turned off.";

export function isMaintenanceMode(err: unknown): boolean {
  return err instanceof ApiError && err.code === "maintenance_mode";
}

export function isSignupsClosed(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 403 || err.code === "signups_closed") && err.code === "signups_closed";
}

export function isStockRequired(err: unknown): boolean {
  return err instanceof ApiError && err.code === "stock_required";
}

export function isAnalyticsDisabledError(err: unknown): boolean {
  return err instanceof ApiError && err.code === "analytics_disabled";
}

export function platformActionMessage(err: unknown, fallback: string): string {
  if (isMaintenanceMode(err)) return MAINTENANCE_MESSAGE;
  if (isSignupsClosed(err)) return SIGNUPS_CLOSED_MESSAGE;
  if (isStockRequired(err)) return STOCK_REQUIRED_MESSAGE;
  if (isAnalyticsDisabledError(err)) return ANALYTICS_OFF_MESSAGE;
  if (err instanceof Error && err.message.trim() && !/^HTTP \d+/.test(err.message) && !/^Request failed/i.test(err.message)) {
    return err.message;
  }
  return fallback;
}
