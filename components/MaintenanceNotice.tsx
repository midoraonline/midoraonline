"use client";

import { usePublicSettings } from "@/lib/hooks/usePlatformAnalytics";

export default function MaintenanceNotice() {
  const settings = usePublicSettings();
  if (!settings.ready || !settings.maintenance) return null;
  return (
    <div
      role="status"
      className="border-b border-accent/30 bg-accent/10 px-4 py-2 text-center text-xs text-foreground"
    >
      Midora is in maintenance. New shops, new listings, and edits are paused. You can still mark a listing sold or closed.
    </div>
  );
}
