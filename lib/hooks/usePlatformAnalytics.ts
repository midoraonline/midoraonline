"use client";

import useSWR from "swr";
import { DEFAULT_MEDIA_LIMITS, getPublicSettings } from "@/lib/api/platformSettings";

async function loadPublicSettings() {
  try {
    return await getPublicSettings();
  } catch {
    return { analytics: false, flags: { analytics: false }, limits: DEFAULT_MEDIA_LIMITS };
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
    analyticsAllPlans: flags.analytics_all_plans === true,
    maintenance: flags.maintenance_mode === true,
    mediaLimits: data?.limits ?? DEFAULT_MEDIA_LIMITS,
    flags,
  };
}

export function usePlatformAnalytics() {
  const settings = usePublicSettings();
  return {
    ready: settings.ready,
    enabled: settings.analytics,
    allPlans: settings.analyticsAllPlans,
  };
}
