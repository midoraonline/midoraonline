"use client";

import useSWR from "swr";
import { DEFAULT_MEDIA_LIMITS, getPublicSettings, limitsForPlan, parsePlanMediaLimits } from "@/lib/api/platformSettings";

const FALLBACK_PLAN_LIMITS = parsePlanMediaLimits(null);

async function loadPublicSettings() {
  try {
    return await getPublicSettings();
  } catch {
    return { analytics: false, flags: { analytics: false }, limits: DEFAULT_MEDIA_LIMITS, planLimits: FALLBACK_PLAN_LIMITS };
  }
}

export function usePublicSettings() {
  const { data, isLoading } = useSWR("settings-public", loadPublicSettings, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const flags = data?.flags ?? {};
  return {
    ready: !isLoading,
    analytics: flags.analytics === true,
    maintenance: flags.maintenance_mode === true,
    mediaLimits: data?.limits ?? DEFAULT_MEDIA_LIMITS,
    /** Caps for the poster's plan (users.plan_tier; missing -> Basic). */
    mediaLimitsFor: (plan?: string | null) => limitsForPlan(data?.planLimits ?? FALLBACK_PLAN_LIMITS, plan),
    flags,
  };
}

export function usePlatformAnalytics() {
  const settings = usePublicSettings();
  return {
    ready: settings.ready,
    enabled: settings.analytics,
  };
}
