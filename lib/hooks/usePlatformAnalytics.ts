"use client";

import useSWR from "swr";
import { getPublicSettings } from "@/lib/api/platformSettings";

async function loadPublicSettings() {
  try {
    return await getPublicSettings();
  } catch {
    return { analytics: false, flags: { analytics: false } };
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
