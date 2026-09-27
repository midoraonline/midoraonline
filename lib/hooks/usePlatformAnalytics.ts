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

export function usePlatformAnalytics() {
  const { data, isLoading } = useSWR("settings-public", loadPublicSettings, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  return {
    ready: !isLoading,
    enabled: data?.analytics === true,
  };
}
