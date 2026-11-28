"use client";

import { usePublicSettings } from "@/lib/hooks/usePlatformAnalytics";
import { MAINTENANCE_MESSAGE } from "@/lib/platformMessages";

export default function MaintenanceNotice() {
  const settings = usePublicSettings();
  if (!settings.ready || !settings.maintenance) return null;
  return (
    <div
      role="status"
      className="border-b border-accent/30 bg-accent/10 px-4 py-2 text-center text-xs text-foreground"
    >
      {MAINTENANCE_MESSAGE}
    </div>
  );
}
